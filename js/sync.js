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
    // ✅ FIX: bij een exact gelijkspel (mogelijk bij Dames) is er géén winnaar;
    // voorheen werd dan onterecht speler 2 als winnaar doorgestuurd omdat
    // `p1Score > p2Score` onwaar is bij gelijke scores.
    let winnerClubId = null;
    if (match.p1Score > match.p2Score) {
        winnerClubId = match.p1_club_id;
    } else if (match.p2Score > match.p1Score) {
        winnerClubId = match.p2_club_id;
    }
    // gelijk → winnerClubId blijft null (gelijkspel)
    
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


/* =========================================================================
   ✅ NIEUW: HERSTEL VAN SERVER — spelers & voltooide matchen terughalen
   zodat elke browser (TV, laptop, gsm) hetzelfde beeld toont.
   ========================================================================= */

/**
 * Haalt voltooide matchen op van de server en voegt toe wat lokaal ontbreekt.
 * Bestaande lokale matchen worden NOOIT overschreven of verwijderd.
 * Let op: de API geeft geen beurten-detail of targets terug; targets worden
 * opgezocht via state.players, beurtenlijsten blijven leeg bij herstelde matchen.
 */
window.restoreCompletedMatchesFromAPI = async function() {
    try {
        const response = await fetch("https://kpbc.pythonanywhere.com/api/match-results");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const results = await response.json();

        let added = 0;
        results.forEach(r => {
            if (!r.players || r.players.length < 2) return;
            const [pd1, pd2] = r.players;
            const c1 = String(pd1.club_id), c2 = String(pd2.club_id);
            const date = r.played_date;

            // Bestaat deze match lokaal al? Vergelijk op club_id-paar + datum
            // (lokaal id-formaat "40011-40111" verschilt van server "40011_40111_datum")
            const exists = state.matches.some(m =>
                m.completed &&
                m.date === date &&
                ((String(m.p1_club_id) === c1 && String(m.p2_club_id) === c2) ||
                 (String(m.p1_club_id) === c2 && String(m.p2_club_id) === c1))
            );
            if (exists) return;

            // Namen + targets opzoeken via state.players
            const pl1 = state.players.find(p => String(p.id) === c1);
            const pl2 = state.players.find(p => String(p.id) === c2);
            const p1Name = pl1 ? pl1.name : `ONBEKEND (ID: ${c1})`;
            const p2Name = pl2 ? pl2.name : `ONBEKEND (ID: ${c2})`;

            // ✅ Gelijkspel (winner_club_id null/leeg) correct terugvertalen
            let winnerName;
            if (r.winner_club_id === null || r.winner_club_id === undefined || r.winner_club_id === '') {
                winnerName = "Gelijk";
            } else {
                winnerName = String(r.winner_club_id) === c1 ? p1Name : p2Name;
            }

            state.matches.push({
                id: `${Math.min(+c1, +c2)}-${Math.max(+c1, +c2)}`,
                date: date,
                p1: p1Name,
                p2: p2Name,
                p1_club_id: parseInt(c1),
                p2_club_id: parseInt(c2),
                target1: pl1 ? pl1.target : 0,
                target2: pl2 ? pl2.target : 0,
                discipline: r.discipline,
                cat: parseInt(r.category) || r.category,
                completed: true,
                p1Score: pd1.score,
                p2Score: pd2.score,
                p1Turns: [],   // niet beschikbaar via de API
                p2Turns: [],
                p1Highest: pd1.hoogste_reeks || 0,
                p2Highest: pd2.hoogste_reeks || 0,
                winner: winnerName,
                restoredFromServer: true
            });
            added++;
        });

        if (added > 0) {
            saveStateToStorage();
            console.log(`✅ ${added} voltooide match(en) hersteld van de server`);
        } else {
            console.log("ℹ️ Alle voltooide matchen waren al lokaal aanwezig");
        }
    } catch (e) {
        console.warn("⚠️ Kon voltooide matchen niet herstellen:", e);
    }
};


