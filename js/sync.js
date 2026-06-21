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
                renderCompetitionLeaderboard();
            } else {
                renderCrossTable();
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Fout bij ophalen match results:', error);
        return false;
    }
};
