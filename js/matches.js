// js/matches.js
// ============================================
// MATCH SYNC MET PLANNING APP
// ============================================
async function fetchMatchesFromAPI() {
    const apiUrl = "https://kpbc.pythonanywhere.com/api/export/matches";
    
    try {
        // Toon loading (optioneel, voor als de functie vanuit andere pagina's wordt aangeroepen)
        const matchList = document.getElementById('matchList');
        if (matchList) {
            matchList.innerHTML = `<div class="no-matches"><p>🔄 Matchen ophalen van planning app...</p></div>`;
        }
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const apiMatches = await response.json();
        console.log(`📥 ${apiMatches.length} matchen opgehaald van API`);
        
        // Converteer API matchen naar biljart-app formaat
        const newMatches = [];
        
        apiMatches.forEach(apiMatch => {
            // Haal de twee spelers op
            const [p1Data, p2Data] = apiMatch.players;
            
            // Zoek speler 1 op basis van club_id
            const player1 = state.players.find(p => String(p.id) === String(p1Data.club_id));
            const player2 = state.players.find(p => String(p.id) === String(p2Data.club_id));
            
            if (!player1 || !player2) {
                console.warn(`⚠️ Spelers niet gevonden voor match ${p1Data.club_id} vs ${p2Data.club_id}`);
                return;
            }
            
            // Maak unieke match-ID (kleinste club_id eerst)
            const clubIds = [parseInt(p1Data.club_id), parseInt(p2Data.club_id)].sort((a, b) => a - b);
            const matchId = `${clubIds[0]}-${clubIds[1]}`;
            
            // Check of match al bestaat
            const exists = state.matches.some(m => m.id === matchId);
            if (exists) {
                console.log(`⏭️ Match ${matchId} bestaat al, overslaan`);
                return;
            }
            
            // Converteer naar biljart-app formaat
            newMatches.push({
                id: matchId,
                date: apiMatch.match_date,
                time: apiMatch.match_time || '',
                table: apiMatch.table_nr || 1,
                p1: player1.name,
                p2: player2.name,
                p1_club_id: parseInt(p1Data.club_id),
                p2_club_id: parseInt(p2Data.club_id),
                target1: player1.target,
                target2: player2.target,
                discipline: apiMatch.discipline,
                cat: parseInt(apiMatch.category),
                match_type: apiMatch.match_type || 'Regular',
                completed: false,
                whitePlayer: null,
                p1Score: 0,
                p2Score: 0,
                p1Turns: [],
                p2Turns: [],
                p1Highest: 0,
                p2Highest: 0,
                synced_at: new Date().toISOString()
            });
            
            console.log(`✅ Match toegevoegd: ${player1.name} vs ${player2.name} (${apiMatch.discipline} Cat. ${apiMatch.category})`);
        });
        
        // Voeg nieuwe matchen toe aan state
        if (newMatches.length > 0) {
            state.matches.push(...newMatches);
            saveStateToStorage();
            console.log(`✅ ${newMatches.length} nieuwe matchen gesynchroniseerd!`);
        } else {
            console.log(`ℹ️ Geen nieuwe matchen gevonden.`);
        }
        
        // Refresh de UI indien nodig
        if (state.currentPage === 4) {
            loadFilteredMatches();
        } else if (state.currentPage === 7) {
            loadMatchesTabContent();
        }
        
        return true; // ✅ Succes - vertelt de navigatie dat het gelukt is
        
    } catch (error) {
        console.error('❌ Fout bij ophalen matchen:', error);
        
        // Herstel UI indien nodig
        if (state.currentPage === 4) {
            loadFilteredMatches();
        } else if (state.currentPage === 7) {
            loadMatchesTabContent();
        }
        
        return false; // ❌ Mislukt - vertelt de navigatie dat het mislukt is
    }
}


function loadFilteredMatches() {
    const matchList = document.getElementById('matchList');
    const title = document.getElementById('matchListTitle');
    const displayDate = formatDateDisplay(state.selectedDate);
    const dayOfWeek = getDayOfWeek(state.selectedDate);
    title.textContent = `Matchen-${dayOfWeek}-${displayDate}-${state.selectedGameType}-Cat. ${state.selectedCategory}`;
    
    const filtered = state.matches.filter(m => m.date === state.selectedDate && m.discipline === state.selectedGameType && m.cat === state.selectedCategory && !m.completed);
    if (filtered.length === 0) {
        matchList.innerHTML = `<div class="no-matches"><p>Geen matchen gevonden voor deze selectie</p><p><small>Maak een nieuwe match aan met de ➕ knop</small></p></div>`;
        return;
    }
    matchList.innerHTML = filtered.map(m => `<div class="match-card" onclick="selectMatch(${m.id})"><h3>${m.discipline} - Cat. ${m.cat}</h3><p class="match-info"><strong>${m.p1}</strong> vs <strong>${m.p2}</strong><br>🎯 Te maken punten: ${m.target1} - ${m.target2}<br>📅 Datum: ${formatDateDisplay(m.date)}</p></div>`).join('');
}

function showMatchesTab(tab) {
    state.currentMatchesTab = tab;
    document.querySelectorAll('#matchesTabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#matchesTabContent .tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
    document.getElementById(`tabContent${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
    loadMatchesTabContent();
}

function loadMatchesTabContent() {
    updateTabBadges();
    if (state.currentMatchesTab === 'active') loadActiveMatches();
    else if (state.currentMatchesTab === 'completed') loadCompletedMatches();
}

function updateTabBadges() {
    document.getElementById('badgeActive').textContent = state.matches.filter(m => !m.completed).length;
    document.getElementById('badgeCompleted').textContent = state.matches.filter(m => m.completed).length;
}

function loadActiveMatches() {
    const container = document.getElementById('tabContentActive');
    const active = state.matches.filter(m => !m.completed);
    if (active.length === 0) { container.innerHTML = `<div class="no-matches"><p>Geen actieve matchen</p></div>`; return; }
    
    const byDate = {}; active.forEach(m => { if(!byDate[m.date]) byDate[m.date]=[]; byDate[m.date].push(m); });
    const sortedDates = Object.keys(byDate).sort((a,b) => new Date(b) - new Date(a));
    
    let html = `<div class="matches-list-title">Actieve Matchen (${active.length})</div><button class="clear-all-btn" onclick="clearAllActiveMatches()">🗑️ Alle Actieve Matchen Verwijderen</button><div style="margin-bottom: 20px;"></div>`;
    sortedDates.forEach(date => {
        html += `<div style="margin-bottom: 20px;"><h3 style="color: #3498db; border-bottom: 1px solid #34495e; padding-bottom: 5px;">📅 ${formatDateDisplay(date)} (${byDate[date].length} matchen)</h3>`;
        byDate[date].forEach(m => {
            html += `<div class="match-card" style="cursor: default;"><button class="delete-match-btn" onclick="deleteMatch(${m.id})" title="Verwijderen">×</button><h3>${m.discipline} - Cat. ${m.cat} <span class="status-badge status-pending">In afwachting</span></h3><p class="match-info"><strong>${m.p1}</strong> vs <strong>${m.p2}</strong><br>🎯 Te maken punten: ${m.target1} - ${m.target2}<br>📅 Datum: ${formatDateDisplay(m.date)}</p><div class="match-actions"><button onclick="selectMatch(${m.id})" class="action-btn-small" style="background: #2ecc71;">▶️ Speel Match</button><button onclick="editMatch(${m.id})" class="action-btn-small" style="background: #3498db;">✏️ Bewerk</button></div></div>`;
        });
        html += `</div>`;
    });
    container.innerHTML = html;
}

function loadCompletedMatches() {
    const container = document.getElementById('tabContentCompleted');
    const completed = state.matches.filter(m => m.completed);
    if (completed.length === 0) { container.innerHTML = `<div class="no-matches"><p>Geen voltooide matchen</p></div>`; return; }
    
    const byDate = {}; completed.forEach(m => { if(!byDate[m.date]) byDate[m.date]=[]; byDate[m.date].push(m); });
    const sortedDates = Object.keys(byDate).sort((a,b) => new Date(b) - new Date(a));
    
    let html = `<div class="matches-list-title">Voltooide Matchen (${completed.length})</div><div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;"><button class="clear-all-btn" onclick="clearAllCompletedMatches()">🗑️ Alle Voltooide Matchen Verwijderen</button></div>`;
    sortedDates.forEach(date => {
        html += `<div style="margin-bottom: 20px;"><h3 style="color: #27ae60; border-bottom: 1px solid #34495e; padding-bottom: 5px;">📅 ${formatDateDisplay(date)} (${byDate[date].length} matchen)</h3>`;
        byDate[date].forEach(m => {
            const winner = m.p1Score >= m.target1 ? m.p1 : m.p2;
            html += `<div class="match-card completed" style="cursor: default;"><button class="delete-match-btn" onclick="deleteMatch(${m.id})" title="Verwijderen">×</button><h3>${m.discipline} - Cat. ${m.cat} <span class="status-badge status-completed">Voltooid</span></h3><p class="match-info"><strong>${m.p1}</strong> vs <strong>${m.p2}</strong><br>🎯 Te maken punten: ${m.target1} - ${m.target2}<br>📊 Eindscore: ${m.p1Score || 0} - ${m.p2Score || 0}<br>🏆 Winnaar: ${winner}<br>📅 Datum: ${formatDateDisplay(m.date)}</p></div>`;
        });
        html += `</div>`;
    });
    container.innerHTML = html;
}

function deleteMatch(matchId) {
    const idx = state.matches.findIndex(m => m.id === matchId);
    if (idx !== -1) {
        const m = state.matches[idx];
        if (confirm(`Match verwijderen?\n${m.p1} vs ${m.p2}`)) {
            state.matches.splice(idx, 1);
            saveStateToStorage(); 
            loadMatchesTabContent();
            if (state.currentPage === 4) loadFilteredMatches();
        }
    }
}

function clearAllActiveMatches() {
    const active = state.matches.filter(m => !m.completed);
    if (active.length === 0) return alert("Geen actieve matchen.");
    if (confirm(`ALLE ${active.length} actieve matchen verwijderen?`)) {
        state.matches = state.matches.filter(m => m.completed);
        saveStateToStorage(); loadMatchesTabContent();
    }
}

function clearAllCompletedMatches() {
    const completed = state.matches.filter(m => m.completed);
    if (completed.length === 0) return alert("Geen voltooide matchen.");
    if (confirm(`ALLE ${completed.length} voltooide matchen verwijderen?`)) {
        state.matches = state.matches.filter(m => !m.completed);
        saveStateToStorage(); loadMatchesTabContent();
    }
}

function editMatch(matchId) { selectMatch(matchId); }

// --- NIEUWE MATCH AANMAKEN ---
function createNewMatch() { showPage(9); }

function setupNewMatchPage() {
    document.getElementById('newMatchTitle').textContent = `Nieuwe Match - ${state.selectedGameType} - Cat. ${state.selectedCategory}`;
    document.getElementById('newMatchInfo').innerHTML = `Maak een nieuwe match aan voor:<br><strong>${formatDateDisplay(state.selectedDate)} - ${state.selectedGameType} - Categorie ${state.selectedCategory}</strong>`;
    state.newMatch = { player1: null, player2: null, target1: 0, target2: 0 };
    document.getElementById('player1Name').textContent = 'Niet geselecteerd';
    document.getElementById('player1Details').textContent = 'Klik om speler te selecteren';
    document.getElementById('player1Target').value = '';
    document.getElementById('player1Box').classList.remove('selected');
    document.getElementById('player2Name').textContent = 'Niet geselecteerd';
    document.getElementById('player2Details').textContent = 'Klik om speler te selecteren';
    document.getElementById('player2Target').value = '';
    document.getElementById('player2Box').classList.remove('selected');
    displayAvailablePlayers();
}

function displayAvailablePlayers() {
    const container = document.getElementById('availablePlayers');
    const available = state.players.filter(p => p.discipline.toLowerCase() === state.selectedGameType.toLowerCase() && p.category === state.selectedCategory);
    if (available.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 20px; color: #95a5a6;"><p>Geen spelers gevonden voor ${state.selectedGameType} - Categorie ${state.selectedCategory}</p></div>`;
        return;
    }
    available.sort((a, b) => a.name.localeCompare(b.name));
    window.tempAvailablePlayers = available;
    let html = '<h3 style="margin-bottom: 15px; color: #ecf0f1;">Beschikbare spelers:</h3><div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">';
    available.forEach((p, idx) => {
        const isSelected = (state.newMatch.player1 && state.newMatch.player1.name === p.name) || (state.newMatch.player2 && state.newMatch.player2.name === p.name);
        html += `<div class="player-select-box ${isSelected ? 'selected' : ''}" onclick="selectAvailablePlayerByIndex(${idx})" style="${isSelected ? 'opacity: 0.6; cursor: not-allowed;' : ''}"><h3>${p.name}</h3><p>Categorie: ${p.category}</p><p>Standaard target: ${p.target}</p>${isSelected ? '<p style="color: #e74c3c; margin-top: 5px;">✓ Al geselecteerd</p>' : ''}</div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

function selectAvailablePlayerByIndex(playerIndex) {
    const available = window.tempAvailablePlayers || state.players.filter(p => p.discipline.toLowerCase() === state.selectedGameType.toLowerCase() && p.category === state.selectedCategory);
    if (playerIndex < 0 || playerIndex >= available.length) return;
    const p = available[playerIndex];
    let selectedPlayerNum = null;
    if (!state.newMatch.player1) selectedPlayerNum = 1;
    else if (!state.newMatch.player2 && state.newMatch.player1.name !== p.name) selectedPlayerNum = 2;
    else { alert("Speler is al geselecteerd of beide spelers zijn al geselecteerd."); return; }
    
    if (selectedPlayerNum === 1) {
        state.newMatch.player1 = p; state.newMatch.target1 = p.target;
        document.getElementById('player1Name').textContent = p.name;
        document.getElementById('player1Details').innerHTML = `Categorie: ${p.category}<br>Discipline: ${p.discipline}`;
        document.getElementById('player1Target').value = p.target;
        document.getElementById('player1Box').classList.add('selected');
    } else {
        state.newMatch.player2 = p; state.newMatch.target2 = p.target;
        document.getElementById('player2Name').textContent = p.name;
        document.getElementById('player2Details').innerHTML = `Categorie: ${p.category}<br>Discipline: ${p.discipline}`;
        document.getElementById('player2Target').value = p.target;
        document.getElementById('player2Box').classList.add('selected');
    }
    displayAvailablePlayers();
    validateTargets();
}

function selectPlayerForNewMatch(playerNum) {
    if (playerNum === 1 && state.newMatch.player1) { document.getElementById('player1Target').focus(); document.getElementById('player1Target').select(); }
    else if (playerNum === 2 && state.newMatch.player2) { document.getElementById('player2Target').focus(); document.getElementById('player2Target').select(); }
    else { document.getElementById('availablePlayers').scrollIntoView({ behavior: 'smooth' }); }
}

function validateTargets() {
    const t1 = document.getElementById('player1Target'), t2 = document.getElementById('player2Target');
    state.newMatch.target1 = parseInt(t1.value) || 0;
    state.newMatch.target2 = parseInt(t2.value) || 0;
    if (t1.value) { const v = parseInt(t1.value); if(v<1) t1.value=1; if(v>200) t1.value=200; state.newMatch.target1 = parseInt(t1.value); }
    if (t2.value) { const v = parseInt(t2.value); if(v<1) t2.value=1; if(v>200) t2.value=200; state.newMatch.target2 = parseInt(t2.value); }
    const canCreate = state.newMatch.player1 && state.newMatch.player2 && state.newMatch.target1 > 0 && state.newMatch.target2 > 0 && state.newMatch.player1.name !== state.newMatch.player2.name;
    const btn = document.getElementById('createMatchBtn');
    btn.disabled = !canCreate;
    btn.style.backgroundColor = canCreate ? '#2ecc71' : '#7f8c8d';
}

function createManualMatch() {
    if (!state.newMatch.player1 || !state.newMatch.player2) return alert("Selecteer eerst beide spelers!");
    if (state.newMatch.player1.name === state.newMatch.player2.name) return alert("Kies twee verschillende spelers!");
    if (state.newMatch.target1 <= 0 || state.newMatch.target2 <= 0) return alert("Vul geldige target punten in!");
    
    const newId = state.matches.length > 0 ? Math.max(...state.matches.map(m => m.id)) + 1 : 1;
    state.matches.push({
        id: newId, date: state.selectedDate, p1: state.newMatch.player1.name, p2: state.newMatch.player2.name,
        target1: state.newMatch.target1, target2: state.newMatch.target2, discipline: state.selectedGameType, cat: state.selectedCategory,
        completed: false, whitePlayer: null, p1Score: 0, p2Score: 0, p1Turns: [], p2Turns: [], p1Highest: 0, p2Highest: 0
    });
    saveStateToStorage();
    alert(`✅ Nieuwe match aangemaakt:\n${state.newMatch.player1.name} vs ${state.newMatch.player2.name}`);
    showPage(4);
}
