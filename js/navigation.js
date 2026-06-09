// js/navigation.js

window.showPage = function(pageNum) {
    let actualPageNum = typeof pageNum === 'string' ? parseInt(pageNum) : pageNum;
    if (isNaN(actualPageNum) || actualPageNum < 1) actualPageNum = 1;
    
    const pageId = `page${actualPageNum}`;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (!target) return;
    
    target.classList.add('active');
    state.currentPage = actualPageNum;
    
    // Roep de juiste functie aan voor elke pagina
    if (actualPageNum === 1) {
        const d = document.getElementById('dateSelect');
        if (d && !d.value) {
            d.value = new Date().toISOString().split('T')[0];
            state.selectedDate = d.value;
        }
    } else if (actualPageNum === 2) {
        // PAGINA 2 = DE MATCHEN LIJST
        if (typeof window.loadFilteredMatches === 'function') {
            window.loadFilteredMatches();
        }
    } else if (actualPageNum === 3) {
        if (typeof window.setupNewMatchPage === 'function') window.setupNewMatchPage();
    } else if (actualPageNum === 4) {
        // PAGINA 4 = KIES WITTE BAL
        if (typeof window.updateBallSelectionPage === 'function') window.updateBallSelectionPage();
    } else if (actualPageNum === 5) {
        // PAGINA 5 = SCORING
        if (typeof window.updateScoringPage === 'function') window.updateScoringPage();
    } else if (actualPageNum === 6) {
        if (typeof window.renderMatchSummary === 'function') window.renderMatchSummary();
    } else if (actualPageNum === 7) {
        if (typeof window.loadMatchesTabContent === 'function') window.loadMatchesTabContent();
    } else if (actualPageNum === 8) {
        if (typeof window.loadStatsPage === 'function') window.loadStatsPage();
    } else if (actualPageNum === 9) {
        if (typeof window.loadRankingPage === 'function') window.loadRankingPage();
    } else if (actualPageNum === 10) {
        // PAGINA 10 = SYNC PAGINA
        const syncDateDisplay = document.getElementById('syncDateDisplay');
        if (syncDateDisplay && state.selectedDate) {
            const d = new Date(state.selectedDate);
            const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
            syncDateDisplay.textContent = `${days[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        }
        const syncStatus = document.getElementById('syncStatus');
        if (syncStatus) syncStatus.textContent = "";
    }
};

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

// Na het syncen op Pagina 10: Ga direct naar de Matchenlijst (Pagina 2)
window.syncAndProceedToPage2 = function() {
    const statusDiv = document.getElementById('syncStatus');
    if (statusDiv) {
        statusDiv.textContent = "🔄 Bezig met ophalen van server...";
        statusDiv.style.color = "#f1c40f";
    }
    
    if (typeof window.fetchMatchesFromAPI === 'function') {
        window.fetchMatchesFromAPI().then(success => {
            if (success) {
                if (statusDiv) {
                    statusDiv.textContent = "✅ Succes! Matchen geladen.";
                    statusDiv.style.color = "#2ecc71";
                }
                // Wacht 1 seconde en ga dan naar Pagina 2 (de matchenlijst)
                setTimeout(() => {
                    window.showPage(2);
                }, 1000);
            } else {
                if (statusDiv) {
                    statusDiv.textContent = "❌ Fout bij ophalen.";
                    statusDiv.style.color = "#e74c3c";
                }
            }
        });
    }
};
