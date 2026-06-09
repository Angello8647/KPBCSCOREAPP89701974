// js/navigation.js

window.showPage = function(pageNum) {
    let actualPageNum = typeof pageNum === 'string' ? parseInt(pageNum.replace('Page','')) : pageNum;
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
            d.value = formatDateForInput(new Date());
            state.selectedDate = d.value;
        }
    } else if (actualPageNum === 2) {
        if (typeof loadFilteredMatches === 'function') loadFilteredMatches();
    } else if (actualPageNum === 3) {
        if (typeof setupNewMatchPage === 'function') setupNewMatchPage();
    } else if (actualPageNum === 4) {
        if (typeof updateBallSelectionPage === 'function') updateBallSelectionPage();
    } else if (actualPageNum === 5) {
        if (typeof updateScoringPage === 'function') updateScoringPage();
    } else if (actualPageNum === 7) {
        if (typeof loadMatchesTabContent === 'function') loadMatchesTabContent();
    } else if (actualPageNum === 8) {
        if (typeof loadStatsPage === 'function') loadStatsPage();
    } else if (actualPageNum === 9) {
        if (typeof loadRankingPage === 'function') loadRankingPage();
    } else if (actualPageNum === 10) {
        // Sync pagina logica
        const c = document.getElementById('page10');
        const s = c?.querySelector('.data-transfer-section');
        if (s) {
            s.innerHTML = s.innerHTML
                .replace(/\${state\.players\.length}/g, state.players.length)
                .replace(/\${state\.matches\.filter\(m=>!m.completed\)\.length}/g, state.matches.filter(m => !m.completed).length)
                .replace(/\${state\.matches\.filter\(m=>m.completed\)\.length}/g, state.matches.filter(m => m.completed).length);
        }
    }
};

window.goToPage2 = function() {
    const d = document.getElementById('dateSelect');
    if (!d.value) {
        alert("Selecteer eerst een datum!");
        return;
    }
    state.selectedDate = d.value;
    showPage(2);
};

window.goToPage10 = function() {
    const d = document.getElementById('dateSelect');
    if (!d.value) {
        alert("Selecteer eerst een datum!");
        return;
    }
    state.selectedDate = d.value;
    
    const displayDate = formatDateDisplay(state.selectedDate);
    const dayOfWeek = getDayOfWeek(state.selectedDate);
    const syncDateDisplay = document.getElementById('syncDateDisplay');
    if (syncDateDisplay) syncDateDisplay.textContent = `${dayOfWeek} ${displayDate}`;
    
    const syncStatus = document.getElementById('syncStatus');
    if (syncStatus) syncStatus.textContent = "";
    
    showPage(10);
};

window.syncAndProceedToPage2 = function() {
    const statusDiv = document.getElementById('syncStatus');
    if (statusDiv) {
        statusDiv.textContent = "🔄 Bezig met ophalen van server...";
        statusDiv.style.color = "#f1c40f";
    }
    
    fetchMatchesFromAPI().then(success => {
        if (success) {
            if (statusDiv) {
                statusDiv.textContent = "✅ Succes! Doorsturen naar matchen...";
                statusDiv.style.color = "#2ecc71";
            }
            setTimeout(() => {
                showPage(2);
            }, 1500);
        } else {
            if (statusDiv) {
                statusDiv.textContent = "❌ Fout bij ophalen. Controleer je internetverbinding.";
                statusDiv.style.color = "#e74c3c";
            }
        }
    });
};
