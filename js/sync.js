/* =========================================================================
   SERVER SYNC: Match resultaten synchroniseren met PythonAnywhere
   ========================================================================= */

/**
 * Haalt alle gespeelde matches op van de centrale server
 * Wordt gebruikt voor rangschikking en kruistabel
 */
window.fetchMatchResultsFromAPI = async function() {
    const apiUrl = "https://kpbc.pythonanywhere.com/api/match-results";
    
    try {
        console.log("📊 Ophalen van alle gespeelde matches...");
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const matchResults = await response.json();
        console.log(`✅ ${matchResults.length} gespeelde matches opgehaald`);
        
        // Sla op in state.completedMatches
        state.completedMatches = matchResults;
        
        // Update de UI als we op de competitie-pagina zijn
        if (state.currentPage === 20 || state.currentPage === 21) {
            const activeView = document.getElementById('viewLeaderboard').style.display !== 'none' ? 'leaderboard' : 'crosstable';
            if (activeView === 'leaderboard') {
                window.renderCompetitionLeaderboard();
            } else {
                window.renderCrossTable();
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Fout bij ophalen match results:', error);
        return false;
    }
};

/**
 * Synchroniseert een voltooide match naar de centrale server
 * met lokale fallback bij netwerkfouten.
 */
window.syncMatchToAPI = async function(match) {
    // 1. Bepaal de winnaar op basis van de score
    const winnerClubId = match.p1Score > match.p2Score ? match.p1_club_id : match.p2_club_id;
    
    // 2. Genereer unieke match_id (formaat: speler1_speler2_datum)
    const matchId = match.match_id || `${match.p1_club_id}_${match.p2_club_id}_${match.date}`;

    // 3. Bouw de payload
    const payload = {
        match_id: matchId,
        played_date: match.date,
        discipline: match.discipline,
        categorie: match.cat,
        status: "voltooid",
        winner_club_id: winnerClubId,
        players: [
            {
                club_id: match.p1_club_id,
                score: match.p1Score,
                beurten: match.p1Turns.length,
                gemiddelde: match.p1Turns.length > 0 ? parseFloat((match.p1Score / match.p1Turns.length).toFixed(3)) : 0,
                hoogste_reeks: match.p1Highest || 0,
                turns_detail: match.p1Turns || []
            },
            {
                club_id: match.p2_club_id,
                score: match.p2Score,
                beurten: match.p2Turns.length,
                gemiddelde: match.p2Turns.length > 0 ? parseFloat((match.p2Score / match.p2Turns.length).toFixed(3)) : 0,
                hoogste_reeks: match.p2Highest || 0,
                turns_detail: match.p2Turns || []
            }
        ]
    };

    const API_URL = "https://kpbc.pythonanywhere.com/api/match-result";

    try {
        console.log("📤 Bezig met verzenden naar server...", payload);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("✅ Match succesvol gesynchroniseerd met de server!");
            removeFromPendingQueue(matchId);
            return true;
        } else {
            throw new Error(`Server fout: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.warn("⚠️ Netwerkfout of server niet bereikbaar. Match lokaal in wachtrij geplaatst.", error);
        saveToPendingQueue(payload);
        return false;
    }
};

/**
 * Slaat een mislukte sync op in localStorage voor later
 */
function saveToPendingQueue(payload) {
    let pending = JSON.parse(localStorage.getItem('pendingMatches') || '[]');
    if (!pending.some(m => m.match_id === payload.match_id)) {
        pending.push(payload);
        localStorage.setItem('pendingMatches', JSON.stringify(pending));
        console.log(`💾 Match ${payload.match_id} toegevoegd aan wachtrij (${pending.length} totaal)`);
    }
}

/**
 * Verwijdert een match uit de wachtrij na succesvolle sync
 */
function removeFromPendingQueue(matchId) {
    let pending = JSON.parse(localStorage.getItem('pendingMatches') || '[]');
    pending = pending.filter(m => m.match_id !== matchId);
    localStorage.setItem('pendingMatches', JSON.stringify(pending));
}

/**
 * Probeert alle opgeslagen matches alsnog te verzenden
 */
window.syncPendingMatches = async function() {
    const pending = JSON.parse(localStorage.getItem('pendingMatches') || '[]');
    if (pending.length === 0) return;

    console.log(`🔄 Bezig met het synchroniseren van ${pending.length} achterstallige match(es)...`);
    
    const API_URL = "https://kpbc.pythonanywhere.com/api/match-result";

    for (const payload of pending) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log(`✅ Achterstallige match ${payload.match_id} succesvol verstuurd!`);
                removeFromPendingQueue(payload.match_id);
            }
        } catch (error) {
            console.warn(`⚠️ Kon match ${payload.match_id} nog niet versturen.`);
            break;
        }
    }
    
    const remaining = JSON.parse(localStorage.getItem('pendingMatches') || '[]');
    if (remaining.length === 0) {
        console.log("🎉 Alle achterstallige matches zijn gesynchroniseerd!");
    }
};

// ✅ Luister naar online status om automatisch te syncen
window.addEventListener('online', () => {
    console.log("🌐 Internetverbinding hersteld. Starten met synchroniseren...");
    window.syncPendingMatches();
});
