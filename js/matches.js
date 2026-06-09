// js/matches.js
async function fetchMatchesFromAPI() {
    const apiUrl = "https://kpbc.pythonanywhere.com/api/export/matches";
    
    try {
        console.log("🎯 START SYNC. Geselecteerde datum in app:", state.selectedDate);
        
        const matchList = document.getElementById('matchList');
        if (matchList) {
            matchList.innerHTML = `<div class="no-matches"><p>🔄 Eerst spelers synchroniseren...</p></div>`;
        }
        
        await fetchPlayersFromAPI(); 
        
        if (matchList) {
            matchList.innerHTML = `<div class="no-matches"><p>🔄 Nu matchen ophalen van planning app...</p></div>`;
        }

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const apiMatches = await response.json();
        console.log(`📥 ${apiMatches.length} matchen ontvangen van API`);
        
        // 🧹 STAP 1: HARDE CLEANUP VOOR DE GESELECTEERDE DATUM
        console.log(`🧹 Start cleanup voor datum: '${state.selectedDate}'`);
        const beforeCount = state.matches.filter(m => m.date === state.selectedDate && !m.completed).length;
        console.log(`   - Matchen voor deze datum vóór cleanup: ${beforeCount}`);
        
        // Verwijder ALLE niet-voltooide matchen die exact overeenkomen met de geselecteerde datum
        state.matches = state.matches.filter(m => {
            return m.date !== state.selectedDate || m.completed === true;
        });
        
        const afterCount = state.matches.filter(m => m.date === state.selectedDate && !m.completed).length;
        console.log(`   - Matchen voor deze datum ná cleanup: ${afterCount}`);
        
        if (beforeCount > 0 && afterCount === 0) {
            console.log("✅ Cleanup succesvol: oude matchen voor deze datum zijn verwijderd!");
        } else if (beforeCount > 0 && afterCount > 0) {
            console.warn("⚠️ LET OP: Sommige matchen zijn NIET verwijderd. Controleer datum-formaat!");
        }

        // 🏗️ STAP 2: Bouw de lijst opnieuw op met de verse data uit de API
        const newMatches = [];
        
        apiMatches.forEach(apiMatch => {
            // Alleen verwerken als de match overeenkomt met de geselecteerde datum
            // (De API stuurt soms alle toekomstige matchen, we filteren lokaal op de gekozen dag)
            if (apiMatch.match_date !== state.selectedDate) {
                return; 
            }

            const [p1Data, p2Data] = apiMatch.players;
            const refData = apiMatch.referee;
            
            const player1 = state.players.find(p => String(p.id) === String(p1Data.club_id));
            const player2 = state.players.find(p => String(p.id) === String(p2Data.club_id));
            
            const p1Name = player1 ? player1.name : `ONBEKEND (ID: ${p1Data.club_id})`;
            const p2Name = player2 ? player2.name : `ONBEKEND (ID: ${p2Data.club_id})`;
            const target1 = player1 ? player1.target : 0;
            const target2 = player2 ? player2.target : 0;
            
            let refName = null;
            if (refData && refData.club_id) {
                const referee = state.players.find(p => String(p.id) === String(refData.club_id));
                refName = referee ? referee.name : `Scheids (ID: ${refData.club_id})`;
            }
            
            const clubIds = [parseInt(p1Data.club_id), parseInt(p2Data.club_id)].sort((a, b) => a - b);
            const matchId = `${clubIds[0]}-${clubIds[1]}`;
            
            newMatches.push({
                id: matchId,
                date: apiMatch.match_date,
                time: apiMatch.match_time || '',
                table: apiMatch.table_nr || 1,
                p1: p1Name,
                p2: p2Name,
                referee: refName,
                p1_club_id: parseInt(p1Data.club_id),
                p2_club_id: parseInt(p2Data.club_id),
                target1: target1,
                target2: target2,
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
        });
        
        if (newMatches.length > 0) {
            state.matches.push(...newMatches);
            console.log(`✅ ${newMatches.length} verse matchen toegevoegd voor ${state.selectedDate}`);
        } else {
            console.log(`ℹ️ Geen nieuwe matchen gevonden voor ${state.selectedDate} in de API.`);
        }
        
        // 💾 STAP 3: Altijd opslaan na een sync-actie
        saveStateToStorage();
        
        if (state.currentPage === 4) {
            loadFilteredMatches();
        } else if (state.currentPage === 7) {
            loadMatchesTabContent();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Fout bij ophalen matchen:', error);
        return false;
    }
}

function loadFilteredMatches() {
    const matchList = document.getElementById('matchList');
    const title = document.getElementById('matchListTitle');
    
    if (!matchList) return;

    const displayDate = formatDateDisplay(state.selectedDate);
    const dayOfWeek = getDayOfWeek(state.selectedDate);
    
    if (title) title.textContent = `Matchen - ${dayOfWeek} ${displayDate}`;
    
    const filtered = state.matches.filter(m => m.date === state.selectedDate && !m.completed);
    
    if (filtered.length === 0) {
        matchList.innerHTML = `<div class="no-matches"><p>Geen matchen gevonden voor ${dayOfWeek} ${displayDate}</p></div>`;
        return;
    }
    
    // Groepeer op Tijd en Tafel
    const grouped = {};
    filtered.forEach(m => {
        const timeStr = m.time || "00:00";
        const tableNum = m.table || 1;
        const sortKey = `${timeStr}-${String(tableNum).padStart(2, '0')}`;
        
        if (!grouped[sortKey]) {
            grouped[sortKey] = {
                displayTitle: `Tafel ${tableNum} • ⏰ ${timeStr}`,
                matches: []
            };
        }
        grouped[sortKey].matches.push(m);
    });
    
    const sortedKeys = Object.keys(grouped).sort();
    let html = `<div class="matches-list-title">${filtered.length} matchen voor ${dayOfWeek} ${displayDate}</div>`;
    
    sortedKeys.forEach(key => {
        const group = grouped[key];
        
        html += `<div style="margin-bottom: 30px; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 10px; border-left: 4px solid #3498db;">`;
        html += `<h3 style="color: #f1c40f; margin: 0 0 15px 0; font-size: 1.2em; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                    🎱 ${group.displayTitle} <span style="color: #95a5a6; font-size: 0.8em;">(${group.matches.length} matchen)</span>
                 </h3>`;
        
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">`;
        
        group.matches.forEach(m => {
            const refLine = m.referee ? `<br>👔 Scheids: ${m.referee}` : '';
            const discCatLine = `<br>🎱 ${m.discipline} - Cat. ${m.cat}`;
            
            // ⚠️ BELANGRIJK: window.selectMatch met aanhalingstekens rond '${m.id}'
            html += `<div class="match-card" onclick="window.selectMatch('${m.id}')" style="margin: 0; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                <h3 style="font-size: 1.05em; margin-bottom: 8px; line-height: 1.3;">
                    ${m.p1} <span style="color:#95a5a6; font-size: 0.9em;">vs</span> ${m.p2}
                </h3>
                <p class="match-info" style="font-size: 0.9em; line-height: 1.4; margin: 0;">
                    🎯 <strong>${m.target1}</strong> - <strong>${m.target2}</strong>
                    ${discCatLine}
                    ${refLine}
                </p>
            </div>`;
        });
        
        html += `</div></div>`;
    });
    
    matchList.innerHTML = html;
    console.log("✅ loadFilteredMatches uitgevoerd, aantal matchen:", filtered.length);
}


// ============================================
// MATCH SELECTIE
// ============================================
window.selectMatch = function(matchId) {
    console.log("🎯 selectMatch aangeroepen met ID:", matchId);
    
    const idStr = String(matchId).trim();
    const match = state.matches.find(m => String(m.id).trim() === idStr);
    
    if (!match) {
        console.error("❌ Match NIET gevonden!");
        alert("Fout: Match niet gevonden.");
        return;
    }
    
    if (match.completed) {
        alert("Deze match is al voltooid.");
        return;
    }
    
    state.currentMatch = match;
    state.selectedWhitePlayer = null;
    
    const titleEl = document.getElementById('matchTitleSelect');
    if (titleEl) {
        titleEl.textContent = `${match.p1} ⚔️ ${match.p2}`;
    }
    
    console.log("🚀 Doorsturen naar Pagina 4 (Bal selectie)...");
    showPage(4);
};
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
