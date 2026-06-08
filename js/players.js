// js/players.js
let selectedDiscipline = null;
let selectedPlayerCategory = null;

// --- TOEKOMSTIGE API KOPPELING ---
async function fetchPlayersFromAPI() {
    // TODO: Hier komt later de fetch naar jouw planning-app
    // Voor nu tonen we een melding dat dit de nieuwe methode wordt
    console.log("🔄 Spelers ophalen via API (nog te implementeren)");
    alert("De spelers worden binnenkort automatisch gesynchroniseerd met de planning-app!");
}

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

function updatePlayerFilterStatus() {
    const statusDiv = document.getElementById('playerFilterStatus');
    if (selectedDiscipline && selectedPlayerCategory) {
        statusDiv.innerHTML = `<p>Toont spelers voor: <strong>${selectedDiscipline} - Categorie ${selectedPlayerCategory}</strong></p><button class="clear-all-btn" onclick="clearSelectedFilters()" style="margin-top: 10px;">🔄 Filters Wissen</button>`;
    } else if (selectedDiscipline) {
        statusDiv.innerHTML = `<p>Geselecteerd: <strong>${selectedDiscipline}</strong><br>Selecteer ook een categorie</p>`;
    } else if (selectedPlayerCategory) {
        statusDiv.innerHTML = `<p>Geselecteerd: <strong>Categorie ${selectedPlayerCategory}</strong><br>Selecteer ook een discipline</p>`;
    } else {
        statusDiv.innerHTML = `<p>Selecteer eerst een discipline en categorie om spelers te zien</p>`;
    }
}

function clearSelectedFilters() {
    selectedDiscipline = null; 
    selectedPlayerCategory = null;
    document.querySelectorAll('#page8 .selection-option').forEach(o => o.classList.remove('selected'));
    document.querySelectorAll('#page8 .category-option').forEach(o => o.classList.remove('selected'));
    updatePlayerFilterStatus();
    loadPlayersList();
}

function loadFilteredPlayers() {
    if (!selectedDiscipline || !selectedPlayerCategory) { 
        loadPlayersList(); 
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
    let html = `<div class="matches-list-title">Spelers voor ${selectedDiscipline} - Categorie ${selectedPlayerCategory} (${filtered.length})</div>`;
    html += `<div style="margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-weight: bold; padding: 10px; background: #34495e; border-radius: 8px;"><div>Naam</div><div>TSG</div><div>Target</div></div>`;
    
    filtered.forEach(player => {
        const globalIndex = state.players.findIndex(p => p.name === player.name && p.discipline.toLowerCase() === player.discipline.toLowerCase() && p.category === player.category);
        html += `<div style="padding: 15px; margin: 5px 0; background: rgba(255,255,255,0.05); border-radius: 5px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; align-items: center;">
            <div><strong>${player.name}</strong><br><small style="color: #95a5a6;">${player.discipline} - Cat. ${player.category}</small></div>
            <div style="text-align: center;"><span style="font-size: 1.1em; color: #f1c40f;">${player.tsg || 'N/A'}</span></div>
            <div style="text-align: center; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 1.1em; color: #2ecc71;">${player.target}</span>
                <button class="delete-match-btn" onclick="deletePlayerByIndex(${globalIndex})" title="Verwijderen">×</button>
            </div>
        </div>`;
    });
    playersList.innerHTML = html;
}

function loadPlayersList() {
    const playersList = document.getElementById('playersList');
    if (state.players.length === 0) {
        playersList.innerHTML = `<div class="no-matches"><p>Nog geen spelers toegevoegd</p><p><small>Spelers worden binnenkort gesynchroniseerd met de planning-app.</small></p></div>`;
        return;
    }
    
    const playersByDiscipline = {};
    state.players.forEach(player => {
        if (!playersByDiscipline[player.discipline]) playersByDiscipline[player.discipline] = {};
        if (!playersByDiscipline[player.discipline][player.category]) playersByDiscipline[player.discipline][player.category] = [];
        playersByDiscipline[player.discipline][player.category].push(player);
    });
    
    let html = `<div class="matches-list-title">Alle Spelers Overzicht (${state.players.length} spelers)</div>`;
    html += `<div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
        <button class="clear-all-btn" onclick="clearAllPlayers()">🗑️ Alle Spelers Verwijderen</button>
        <button class="upload-btn" onclick="fetchPlayersFromAPI()" style="background: #2ecc71;">🔄 Sync met Planning App</button>
    </div>`;
    
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
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">`;
            
            categoryPlayers.sort((a, b) => a.name.localeCompare(b.name)).forEach(player => {
                html += `<div style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 5px; border-left: 3px solid #3498db;">
                    <div style="font-weight: bold; margin-bottom: 5px;">${player.name}</div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.9em;">
                        <span style="color: #f1c40f;">TSG: ${player.tsg || 'N/A'}</span>
                        <span style="color: #2ecc71;">Target: ${player.target}</span>
                    </div>
                </div>`;
            });
            html += `</div></div>`;
        });
        html += `</div>`;
    });
    playersList.innerHTML = html;
}

function selectDisciplineAndCategory(discipline, category) {
    selectedDiscipline = discipline; 
    selectedPlayerCategory = category;
    document.querySelectorAll('#page8 .selection-option').forEach(o => o.classList.remove('selected'));
    document.querySelectorAll('#page8 .category-option').forEach(o => o.classList.remove('selected'));
    const dEl = document.getElementById(`discipline${discipline}`); if(dEl) dEl.classList.add('selected');
    const cEl = document.getElementById(`categoryOption${category}`); if(cEl) cEl.classList.add('selected');
    updatePlayerFilterStatus(); 
    loadFilteredPlayers();
    document.querySelector('#page8 .selection-container').scrollIntoView({ behavior: 'smooth' });
}

function deletePlayerByIndex(playerIndex) {
    if (playerIndex >= 0 && playerIndex < state.players.length) {
        const player = state.players[playerIndex];
        if (confirm(`Weet je zeker dat je ${player.name} (${player.discipline}) wilt verwijderen?`)) {
            state.players.splice(playerIndex, 1);
            saveStateToStorage();
            loadPlayersList();
        }
    }
}

function clearAllPlayers() {
    if (confirm("Weet je zeker dat je ALLE spelers wilt verwijderen?")) {
        state.players = [];
        saveStateToStorage();
        loadPlayersList();
    }
}
