// js/players.js
let selectedDiscipline = null;
let selectedPlayerCategory = null;

// --- API KOPPELING MET PLANNING APP ---
async function fetchPlayersFromAPI() {
    const apiUrl = "https://kpbc.pythonanywhere.com/api/export/users";
    
    try {
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = `<div class="no-matches"><p>🔄 Spelers ophalen van planning app...</p></div>`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const users = await response.json();
        console.log("📥 Ruwe API data ontvangen:", users);
        
        state.players = [];
        
        users.forEach(user => {
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
            
            if (user.stats && user.stats.length > 0) {
                user.stats.forEach(stat => {
                    const clubId = parseInt(stat.club_id);
                    console.log(`✅ Speler: ${fullName} | Club ID: ${clubId} | Discipline: ${stat.discipline}`);
                    
                    state.players.push({
                        id: clubId,
                        user_id: user.id,
                        name: fullName,
                        email: user.email || '',
                        discipline: stat.discipline || 'Vrijspel',
                        category: parseInt(stat.category) || 1,
                        target: parseInt(stat.target) || 50,
                        tsg: stat.tsg ? parseFloat(stat.tsg).toFixed(3).replace('.', ',') : '0,000',
                        pnt: parseInt(stat.target) || 50
                    });
                });
            } else {
                console.warn(`⚠️ Geen stats gevonden voor ${fullName}`);
                state.players.push({
                    id: user.id,
                    name: fullName,
                    email: user.email || '',
                    discipline: 'Vrijspel',
                    category: 1,
                    target: 50,
                    tsg: '0,000',
                    pnt: 50
                });
            }
        });
        
        console.log("📦 Uiteindelijke state.players (eerste 3):", state.players.slice(0, 3));
        
        localStorage.removeItem('biljartPlayers');
        savePlayersToStorage();
        
        
        
        if (selectedDiscipline && selectedPlayerCategory) {
            loadFilteredPlayers();
        } else {
            loadPlayersList();
        }
        
    } catch (error) {
        console.error('❌ Fout bij ophalen spelers:', error);
        alert(`❌ Kon spelers niet ophalen.\n\nFout: ${error.message}`);
        if (selectedDiscipline && selectedPlayerCategory) { 
            loadFilteredPlayers(); 
        } else { 
            loadPlayersList(); 
        }
    }
}

// --- BESTAANDE FUNCTIES (ongewijzigd) ---
function selectDiscipline(discipline) {
    selectedDiscipline = discipline;
    document.querySelectorAll('#page8 .selection-option').forEach(option => option.classList.remove('selected'));
    document.getElementById(`discipline${discipline}`).classList.add('selected');
    updatePlayerFilterStatus();
    loadFilteredPlayers();
}

function selectPlayerCategory(category) {
    selectedPlayerCategory = category;
    document.querySelectorAll('#page8 .category-option').forEach(option => option.classList.remove('selected'));
    document.getElementById(`categoryOption${category}`).classList.add('selected');
    updatePlayerFilterStatus();
    loadFilteredPlayers();
}

window.updatePlayerFilterStatus = function() {
    const statusDiv = document.getElementById('playerFilterStatus');
    if (!statusDiv) return; // Element bestaat niet meer, dus skip
    
    if (selectedDiscipline && selectedPlayerCategory) {
        statusDiv.innerHTML = `<p>Toont spelers voor: <strong>${selectedDiscipline} - Categorie ${selectedPlayerCategory}</strong></p><button class="clear-all-btn" onclick="clearSelectedFilters()" style="margin-top: 10px;">🔄 Filters Wissen</button>`;
    } else if (selectedDiscipline) {
        statusDiv.innerHTML = `<p>Geselecteerd: <strong>${selectedDiscipline}</strong><br>Selecteer ook een categorie</p>`;
    } else if (selectedPlayerCategory) {
        statusDiv.innerHTML = `<p>Geselecteerd: <strong>Categorie ${selectedPlayerCategory}</strong><br>Selecteer ook een discipline</p>`;
    } else {
        statusDiv.innerHTML = `<p>Selecteer eerst een discipline en categorie om spelers te zien</p>`;
    }
};

function clearSelectedFilters() {
    selectedDiscipline = null; 
    selectedPlayerCategory = null;
    document.querySelectorAll('#page8 .selection-option').forEach(o => o.classList.remove('selected'));
    document.querySelectorAll('#page8 .category-option').forEach(o => o.classList.remove('selected'));
    updatePlayerFilterStatus();
    loadPlayersList();
}

window.loadFilteredPlayers = function() {
    // Als geen selectie, toon alle spelers
    if (!selectedDiscipline || !selectedPlayerCategory) {
        const playersList = document.getElementById('playersList');
        const allPlayers = [...state.players].sort((a, b) => a.name.localeCompare(b.name));
        
        if (allPlayers.length === 0) {
            playersList.innerHTML = '<div class="no-matches"><p>Geen spelers gevonden</p></div>';
            return;
        }
        
        let html = `<div class="matches-list-title">Alle Spelers (${allPlayers.length})</div>`;
        html += `<div style="margin-bottom: 20px; display: grid; grid-template-columns: 60px 1fr 70px 90px; gap: 10px; font-weight: bold; padding: 10px; background: #34495e; border-radius: 8px; text-align: center; font-size: 0.9em;">
            <div>Club ID</div>
            <div style="text-align: left;">Naam</div>
            <div>TSG</div>
            <div>Target</div>
        </div>`;
        
        allPlayers.forEach(player => {
            const globalIndex = state.players.findIndex(p => p.id === player.id);
            
            html += `<div style="padding: 20px; min-height: 80px; background: rgba(255,255,255,0.03); border-radius: 8px; border-left: 4px solid #3498db; display: grid; grid-template-columns: minmax(150px, 1fr) 80px 80px; gap: 15px; align-items: center; font-size: 1em;">
			    <div style="text-align: left; line-height: 1.3;">
			        <strong style="font-size: 1.1em;">${player.name}</strong><br>
			        <small style="color: #95a5a6; font-size: 0.85em;">${player.discipline} - Cat. ${player.category}</small>
			    </div>
			    <div style="text-align: center; font-size: 1.1em; color: #f1c40f; font-weight: bold;">
			        ${player.tsg || 'N/A'}
			    </div>
			    <div style="text-align: center; display: flex; justify-content: center; align-items: center; gap: 8px;">
			        <span style="font-size: 1.1em; color: #2ecc71; font-weight: bold;">${player.target}</span>
			        <button class="delete-match-btn" onclick="deletePlayerByIndex(${globalIndex})" title="Verwijderen" style="position: relative; top: 0; right: 0; width: 28px; height: 28px; border-radius: 6px; font-size: 16px; display: flex; align-items: center; justify-content: center; padding: 0;">🗑️</button>
			    </div>
			</div>`;
        });
        playersList.innerHTML = html;
        return;
    }
    const playersList = document.getElementById('playersList');
    const filtered = state.players.filter(p => 
        p.discipline.toLowerCase().trim() === selectedDiscipline.toLowerCase().trim() && 
        p.category === selectedPlayerCategory
    );
    
    if (filtered.length === 0) {
        playersList.innerHTML = `<div class="no-matches"><p>Geen spelers gevonden voor ${selectedDiscipline} - Categorie ${selectedPlayerCategory}</p></div>`;
        return;
    }
    
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    // COMPACTE 4-KOLOMS GRID: 60px | Rest | 70px | 90px
    let html = `<div class="matches-list-title">Spelers voor ${selectedDiscipline} - Categorie ${selectedPlayerCategory} (${filtered.length})</div>`;
    html += `<div style="margin-bottom: 20px; display: grid; grid-template-columns: 60px 1fr 70px 90px; gap: 10px; font-weight: bold; padding: 10px; background: #34495e; border-radius: 8px; text-align: center; font-size: 0.9em;">
        <div>Club ID</div>
        <div style="text-align: left;">Naam</div>
        <div>TSG</div>
        <div>Target</div>
    </div>`;
    
    filtered.forEach(player => {
        const globalIndex = state.players.findIndex(p => p.id === player.id);
        
        html += `<div style="padding: 12px; margin: 5px 0; background: rgba(255,255,255,0.05); border-radius: 5px; display: grid; grid-template-columns: 60px 1fr 70px 90px; gap: 10px; align-items: center; font-size: 0.95em;">
            <div style="text-align: center; font-family: monospace; font-size: 1em; color: #f39c12;">
                ${player.id}
            </div>
            <div style="text-align: left; line-height: 1.3;">
                <strong>${player.name}</strong><br>
                <small style="color: #95a5a6; font-size: 0.85em;">${player.discipline} - Cat. ${player.category}</small>
            </div>
            <div style="text-align: center; font-size: 1em; color: #f1c40f;">
                ${player.tsg || 'N/A'}
            </div>
            <div style="text-align: center; display: flex; justify-content: center; align-items: center; gap: 8px;">
                <span style="font-size: 1em; color: #2ecc71;">${player.target}</span>
                <button class="delete-match-btn" onclick="deletePlayerByIndex(${globalIndex})" title="Verwijderen" style="position: relative; top: 0; right: 0; width: 28px; height: 28px; border-radius: 6px; font-size: 16px; display: flex; align-items: center; justify-content: center; padding: 0;">🗑️</button>
            </div>
        </div>`;
    });
    playersList.innerHTML = html;
};

window.loadPlayersList = function() {
    const playersList = document.getElementById('playersList');
    
    // START MET DE KNOPPEN (altijd zichtbaar)
    let html = `<div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
        <button class="upload-btn" onclick="fetchPlayersFromAPI()" style="background: #2ecc71;">🔄 Sync met Planning App</button>`;
    
    if (state.players.length > 0) {
        html += `<button class="clear-all-btn" onclick="clearAllPlayers()">🗑️ Alle Spelers Verwijderen</button>`;
    }
    
    html += `</div>`;
    
    // CHECK OF ER SPELERS ZIJN
    if (state.players.length === 0) {
        html += `<div class="no-matches"><p>Nog geen spelers geladen</p><p><small>Klik op "🔄 Sync met Planning App" om spelers op te halen</small></p></div>`;
        playersList.innerHTML = html;
        return;
    }
    
    // ALS ER WEL SPELERS ZIJN, TOON DE LIJST
    const playersByDiscipline = {};
    state.players.forEach(player => {
        if (!playersByDiscipline[player.discipline]) playersByDiscipline[player.discipline] = {};
        if (!playersByDiscipline[player.discipline][player.category]) playersByDiscipline[player.discipline][player.category] = [];
        playersByDiscipline[player.discipline][player.category].push(player);
    });
    
    html += `<div class="matches-list-title">Alle Spelers Overzicht (${state.players.length} spelers)</div>`;
    
    const desiredOrder = ["Vrijspel", "Bandstoten", "Driebanden"];
    const disciplines = Object.keys(playersByDiscipline);
    const sortedDisciplines = [];
    desiredOrder.forEach(d => { if (disciplines.includes(d)) sortedDisciplines.push(d); });
    disciplines.filter(d => !sortedDisciplines.includes(d)).sort().forEach(d => sortedDisciplines.push(d));
    
    sortedDisciplines.forEach(discipline => {
        const disciplineData = playersByDiscipline[discipline];
        const disciplineTotal = Object.values(disciplineData).flat().length;
        html += `<div style="margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #34495e;">
                <h3 style="color: #3498db; margin: 0;">${discipline} <span style="color: #95a5a6; font-size: 0.9em;">(${disciplineTotal} spelers)</span></h3>
                <button onclick="selectDiscipline('${discipline}')" style="background: #3498db; color: white; border: none; padding: 8px 15px; border-radius: 5px; font-size: 0.9em; cursor: pointer;">🔍 Toon ${discipline}</button>
            </div>`;
        
        Object.keys(disciplineData).sort((a, b) => a - b).forEach(category => {
            const categoryPlayers = disciplineData[category];
            html += `<div style="margin: 15px 0; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 10px; border-left: 4px solid ${getCategoryColor(category)};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="color: #f1c40f; margin: 0;">Categorie ${category} <span style="color: #95a5a6; font-size: 0.9em;">(${categoryPlayers.length} spelers)</span></h4>
                    <button onclick="selectDisciplineAndCategory('${discipline}', ${category})" style="background: #f39c12; color: white; border: none; padding: 6px 12px; border-radius: 5px; font-size: 0.8em; cursor: pointer;">👁️ Bekijk Details</button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 15px;">`;
            
            categoryPlayers.sort((a, b) => a.name.localeCompare(b.name)).forEach(player => {
				html += `<div style="padding: 20px; min-height: 80px; background: rgba(255,255,255,0.03); border-radius: 8px; border-left: 4px solid #3498db; display: grid; grid-template-columns: minmax(180px, 1fr) 80px 80px; gap: 15px; align-items: center; font-size: 1.1em;">
					<div style="font-weight: bold; white-space: normal; line-height: 1.3; font-size: 1.1em;" title="${player.name}">${player.name}</div>
					<div style="text-align: center; color: #f1c40f; font-size: 1.1em; font-weight: bold;">${player.tsg || 'N/A'}</div>
					<div style="text-align: center; color: #2ecc71; font-size: 1.1em; font-weight: bold;">${player.target}</div>
				</div>`;
			});
            html += `</div></div>`;
        });
        html += `</div>`;
    });
    playersList.innerHTML = html;
};
function selectDisciplineAndCategory(discipline, category) {
    selectedDiscipline = discipline; 
    selectedPlayerCategory = category;
    document.querySelectorAll('#page8 .selection-option').forEach(o => o.classList.remove('selected'));
    document.querySelectorAll('#page8 .category-option').forEach(o => o.classList.remove('selected'));
    const dEl = document.getElementById(`discipline${discipline}`); if(dEl) dEl.classList.add('selected');
    const cEl = document.getElementById(`categoryOption${category}`); if(cEl) cEl.classList.add('selected');
    updatePlayerFilterStatus(); 
    loadFilteredPlayers();
    const statusDiv = document.getElementById('playerFilterStatus');
	if (statusDiv) statusDiv.scrollIntoView({ behavior: 'smooth' });
}

function deletePlayerByIndex(playerIndex) {
    if (playerIndex >= 0 && playerIndex < state.players.length) {
        const player = state.players[playerIndex];
        if (confirm(`Weet je zeker dat je ${player.name} (${player.discipline}) wilt verwijderen?`)) {
            state.players.splice(playerIndex, 1);
            savePlayersToStorage();
            loadPlayersList();
        }
    }
}

function clearAllPlayers() {
    if (confirm("Weet je zeker dat je ALLE spelers wilt verwijderen?")) {
        state.players = [];
        savePlayersToStorage();
        loadPlayersList();
    }
}
