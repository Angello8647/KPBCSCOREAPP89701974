// js/state.js
let state = {
    currentPage: 1,
    selectedDate: '',
    selectedGameType: null,
    selectedCategory: null,
    matches: [],
    downloadedMatches: [],
    players: [],
    currentMatch: null,
    player1: { score: 0, turns: [], target: 0, beurtNummer: 1, highestSeries: 0, isWhite: false },
    player2: { score: 0, turns: [], target: 0, beurtNummer: 1, highestSeries: 0, isWhite: false },
    currentPlayer: 1,
    turnNumber: 1,
    matchEnded: false,
    isFirstPlayerInRound: true,
    pendingEnd: false,
    currentInput: 0,
    selectedWhitePlayer: null,
    newMatch: { player1: null, player2: null, target1: 0, target2: 0 },
    currentMatchesTab: 'active'
};

const DEFAULT_PASSWORD = "admin123";

function getAdminPassword() {
    return localStorage.getItem('biljartAdminPassword') || DEFAULT_PASSWORD;
}

function setAdminPassword(newPassword) {
    if (newPassword && newPassword.trim() !== '') {
        localStorage.setItem('biljartAdminPassword', newPassword.trim());
        return true;
    }
    return false;
}

function saveStateToStorage() {
    try {
        const toSave = {
            players: state.players,
            matches: state.matches,
            downloadedMatches: state.downloadedMatches,
            adminPassword: localStorage.getItem('biljartAdminPassword') || DEFAULT_PASSWORD
        };
        localStorage.setItem('billiardTournamentState', JSON.stringify(toSave));
    } catch (e) {
        // ✅ NIEUW: een falende localStorage-opslag (bv. vol, of quota
        // overschreden) mag NOOIT de rest van endMatch() blokkeren — dat
        // veroorzaakte een reëel dataverlies-scenario, waarbij de match wel
        // als 'completed' gemarkeerd werd, maar NOOIT de kans kreeg om
        // effectief naar de server verstuurd te worden (of, bij falen, in
        // de wachtrij te belanden).
        console.error('⚠️ saveStateToStorage mislukt (waarschijnlijk localStorage vol), maar dit blokkeert de rest van de match-afhandeling niet:', e);
    }
}

function loadStateFromStorage() {
    const saved = localStorage.getItem('billiardTournamentState');
    if (saved) {
        try {
            const p = JSON.parse(saved);
            state.players = p.players || [];
            state.matches = p.matches || [];
            state.downloadedMatches = p.downloadedMatches || [];
        } catch(e) { console.error('Fout bij laden staat:', e); }
    }
    const sp = localStorage.getItem('biljartPlayers');
    if (sp && state.players.length === 0) {
        try { state.players = JSON.parse(sp); } catch(e) {}
    }
    const t = new Date();
    state.selectedDate = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
}

function savePlayersToStorage() {
    localStorage.setItem('biljartPlayers', JSON.stringify(state.players));
}
