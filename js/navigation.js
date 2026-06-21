// js/navigation.js

window.showPage = function(pageNum) {
    let actualPageNum = typeof pageNum === 'string' ? parseInt(pageNum) : pageNum;
    if (isNaN(actualPageNum) || actualPageNum < 1) actualPageNum = 1;
    
    const pageId = `page${actualPageNum}`;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (!target) {
        console.warn(`⚠️ Pagina ${actualPageNum} bestaat niet!`);
        return;
    }
    
    target.classList.add('active');
    state.currentPage = actualPageNum;
    
    // Roep de juiste functie aan voor elke pagina
    if (actualPageNum === 1) {
        // PAGINA 1: Datum selectie
        const d = document.getElementById('dateSelect');
        if (d && !d.value) {
            d.value = new Date().toISOString().split('T')[0];
            state.selectedDate = d.value;
        }
        
        // ✅ RESET: Verwijder alle schaduwen van de kaders
        if (typeof window.resetPage1State === 'function') {
            window.resetPage1State();
        }
    } 
    else if (actualPageNum === 2) {

        // PAGINA 2: Matchen lijst (handmatige matches)
        if (typeof window.loadFilteredMatches === 'function') {
            window.loadFilteredMatches();
        }
    } 
    else if (actualPageNum === 3) {
        // PAGINA 3: Nieuwe match aanmaken
        if (typeof window.setupNewMatchPage === 'function') {
            window.setupNewMatchPage();
        }
    } 
    else if (actualPageNum === 4) {
        // PAGINA 4: Bal kleur selectie
        if (typeof window.updateBallSelectionPage === 'function') {
            window.updateBallSelectionPage();
        }
    } 
    else if (actualPageNum === 5) {
        // PAGINA 5: Scoring
        if (typeof window.updateScoringPage === 'function') {
            window.updateScoringPage();
        }
    } 
    else if (actualPageNum === 6) {
        // PAGINA 6: Match overzicht (samenvatting)
        if (typeof window.renderMatchSummary === 'function') {
            window.renderMatchSummary();
        }
    } 
    else if (actualPageNum === 7) {
        // PAGINA 7: Beheer matchen
        if (typeof window.loadMatchesTabContent === 'function') {
            window.loadMatchesTabContent();
        }
        const f = document.getElementById('filterDate');
        if (f) f.value = new Date().toISOString().split('T')[0];
    } 
    else if (actualPageNum === 8) {
        // PAGINA 8: Speler statistieken
        if (typeof window.loadStatsPage === 'function') {
            window.loadStatsPage();
        }
    } 
    else if (actualPageNum === 9) {
        // PAGINA 9: Rangschikking
        if (typeof window.loadRankingPage === 'function') {
            window.loadRankingPage();
        }
    } 
    else if (actualPageNum === 10) {
        // PAGINA 10: Planning ophalen (sync pagina)
        const syncDateDisplay = document.getElementById('syncDateDisplay');
        if (syncDateDisplay && state.selectedDate) {
            const d = new Date(state.selectedDate);
            const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
            syncDateDisplay.textContent = `${days[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        }
        const syncStatus = document.getElementById('syncStatus');
        if (syncStatus) syncStatus.textContent = "";
    }
    else if (actualPageNum === 11) {
        // PAGINA 11: Match selectie (competitie matches)
        // ✅ GEBRUIKT DEZELFDE FUNCTIE ALS PAGINA 2
        if (typeof window.loadFilteredMatches === 'function') {
            window.loadFilteredMatches();
        }
    }
    else if (actualPageNum === 20) {
    // PAGINA 20: Competitie (Rangschikking & Kruistabel)
    if (typeof window.initCompetitionPage === 'function') {
        window.initCompetitionPage();
    }
    // ✅ NIEUW: Haal verse match results op van de server
    if (typeof window.fetchMatchResultsFromAPI === 'function') {
        window.fetchMatchResultsFromAPI();
    }
}
};

// ==========================================
// NAVIGATIE FUNCTIES
// ==========================================

// Vanuit Pagina 1: Ga naar de Sync Pagina (Pagina 10)
window.goToPage10 = function() {
    const d = document.getElementById('dateSelect');
    if (!d.value) {
        alert("Selecteer eerst een datum!");
        return;
    }
    state.selectedDate = d.value;
    showPage(10);
};

// Na het syncen op Pagina 10: Ga naar Pagina 11 (competitie matchen)
// ==========================================
// DIRECTE SYNC & DOORSTUUR FUNCTIE
// ==========================================
window.syncAndGoToMatches = function() {
    const d = document.getElementById('dateSelect');
    if (!d.value) {
        alert("Selecteer eerst een datum!");
        return;
    }
    state.selectedDate = d.value;
    
    // Geef visuele feedback op de knop zelf (geen aparte melding)
    const btn = d.nextElementSibling; // De knop zelf
    const originalText = btn.textContent;
    btn.textContent = "⏳ Bezig met ophalen...";
    btn.disabled = true;

    if (typeof window.fetchMatchesFromAPI === 'function') {
        window.fetchMatchesFromAPI().then(success => {
            // Herstel de knop
            btn.textContent = originalText;
            btn.disabled = false;
            
            if (success) {
                // ✅ DIRECT door naar Pagina 11, GEEN alert of melding!
                window.showPage(11);
            } else {
                // Alleen bij een échte fout tonen we een melding
                alert("❌ Fout bij ophalen van matchen. Controleer je internetverbinding.");
            }
        });
    }
};

// Vanuit Pagina 1: Ga naar Pagina 2 (oude flow voor handmatige matches)
window.goToPage2 = function() {
    const d = document.getElementById('dateSelect');
    if (!d.value) {
        alert("Selecteer eerst een datum!");
        return;
    }
    state.selectedDate = d.value;
    showPage(2);
};
