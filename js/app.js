// TODO: REMOVE
// 🚫 TIJDELIJK UITGESCHAKELD TIJDENS HERSCHRIJVEN
function exportAllData() { alert("⚠️ Export tijdelijk uitgeschakeld."); }
function exportOnlyMatches() { alert("⚠️ Export tijdelijk uitgeschakeld."); }
function importDataFromFile() { alert("⚠️ Import tijdelijk uitgeschakeld."); }
function importOnlyMatches() { alert("⚠️ Import tijdelijk uitgeschakeld."); }
function showSyncHelp() { alert("⚠️ Info tijdelijk uitgeschakeld."); }
function handleFileUpload() { alert("⚠️ Upload tijdelijk uitgeschakeld."); }
function handlePlayersFileUpload() { alert("⚠️ Upload tijdelijk uitgeschakeld."); }
function downloadAllResults() { alert("⚠️ Download tijdelijk uitgeschakeld."); }
function downloadSingleMatch() { alert("⚠️ Download tijdelijk uitgeschakeld."); }
function downloadFilteredResults() { alert("⚠️ Download tijdelijk uitgeschakeld."); }
function downloadMatchesAsCSV() { alert("⚠️ CSV-export tijdelijk uitgeschakeld."); }
function clearAllDataPermanently() { alert("⚠️ Wissen tijdelijk uitgeschakeld."); }
// --------------------------------------------------
        // ==================== STATE ====================
        let state = {
            currentPage: 1,
            selectedDate: '',
            selectedGameType: null,
            selectedCategory: null,
            matches: [],           // Alle matchen (actief + voltooid)
            downloadedMatches: [], // Gedownloade matchen
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
            newMatch: {
                player1: null,
                player2: null,
                target1: 0,
                target2: 0
            },
            currentMatchesTab: 'active' // Track huidig tabblad
        };

        // ==================== SYNCHRONISATIE FUNCTIES ====================
        function exportAllData() {
            const exportData = {
                players: state.players,
                matches: state.matches,
                downloadedMatches: state.downloadedMatches,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `biljart_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            alert(`✅ ALLES geëxporteerd!\n\n• Spelers: ${state.players.length}\n• Matchen: ${state.matches.length}\n• Gedownloade: ${state.downloadedMatches.length}\n\nBestand: ${link.download}`);
        }
        
        function exportOnlyMatches() {
            const exportData = {
                matches: state.matches,
                downloadedMatches: state.downloadedMatches,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `biljart_matches_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            alert(`✅ Matchen geëxporteerd!\n\n• Matchen: ${state.matches.length}\n• Gedownloade: ${state.downloadedMatches.length}`);
        }
        
        function importDataFromFile() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = function(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const importData = JSON.parse(e.target.result);
                        
                        if (confirm(`Weet je zeker dat je ALLE data wilt importeren?\n\nDit zal vervangen:\n• ${state.players.length} huidige spelers\n• ${state.matches.length} huidige matchen\n\nMet:\n• ${importData.players?.length || 0} spelers\n• ${importData.matches?.length || 0} matchen`)) {
                            // Importeer alle data
                            state.players = importData.players || [];
                            state.matches = importData.matches || [];
                            state.downloadedMatches = importData.downloadedMatches || [];
                            
                            // Sla op
                            saveStateToStorage();
                            
                            // Herlaad de pagina state
                            location.reload();
                            
                            alert(`✅ Import succesvol!\n\n• ${state.players.length} spelers\n• ${state.matches.length} matchen\n• ${state.downloadedMatches.length} gedownloade matchen`);
                        }
                    } catch (error) {
                        alert('❌ Fout bij importeren JSON bestand: ' + error.message);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }
        
        function importOnlyMatches() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = function(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const importData = JSON.parse(e.target.result);
                        
                        if (confirm(`Alleen matchen importeren?\n\nDit zal vervangen:\n• ${state.matches.length} huidige matchen\n\nMet:\n• ${importData.matches?.length || 0} matchen\n\nSpelers blijven behouden.`)) {
                            // Importeer alleen matchen
                            state.matches = importData.matches || [];
                            state.downloadedMatches = importData.downloadedMatches || [];
                            
                            // Sla op
                            saveStateToStorage();
                            
                            // Update UI
                            loadMatchesTabContent();
                            if (state.currentPage === 4) {
                                loadFilteredMatches();
                            }
                            
                            alert(`✅ Matchen geïmporteerd!\n\n• ${state.matches.length} matchen\n• ${state.downloadedMatches.length} gedownloade matchen`);
                        }
                    } catch (error) {
                        alert('❌ Fout bij importeren JSON bestand: ' + error.message);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }
        
        function showSyncHelp() {
            alert(`🔄 SYNCHRONISATIE WERKWIJZE:

1. OP DE PC (administratie):
   • Upload spelers CSV (1x per jaar)
   • Upload matchen CSV (elke week)
   • Klik "Exporteer ALLES naar JSON"
   • Sla het .json bestand op in OneDrive

2. OP DE TABLETS (wedstrijddag):
   • Open de HTML via OneDrive
   • Klik "Importeer ALLES van JSON"
   • Selecteer het .json bestand uit OneDrive
   • Alle data is nu beschikbaar!

3. NA DE WEDSTRIJD:
   • Exporteer van tablets naar JSON
   • Importeer op PC om scores te verzamelen

💡 TIP: Maak elke week een nieuwe export!`);
        }
        
        function clearAllDataPermanently() {
            if (confirm("⚠️  WARNING: Dit verwijdert ALLES PERMANENT!\n\n• Alle spelers\n• Alle matchen\n• Alle gedownloade matchen\n• Alle instellingen\n\nDit kan NIET ongedaan gemaakt worden!\n\nWeet je het 100% zeker?")) {
                // Verwijder ALLE localStorage items
                localStorage.clear();
                
                // Reset alle state variabelen
                state.players = [];
                state.matches = [];
                state.downloadedMatches = [];
                
                // Reset wachtwoord naar standaard
                setAdminPassword(DEFAULT_PASSWORD);
                
                // Herlaad de pagina
                location.reload();
            }
        }

        // ==================== SPELERS BEHEER VARIABELEN ====================
        let selectedDiscipline = null;
        let selectedPlayerCategory = null;

        // ==================== SPELERS FUNCTIES ====================
        function selectDiscipline(discipline) {
            selectedDiscipline = discipline;
        
            document.querySelectorAll('#page8 .selection-option').forEach(option => {
                option.classList.remove('selected');
            });
        
            document.getElementById(`discipline${discipline}`).classList.add('selected');
            
            updatePlayerFilterStatus();
            loadFilteredPlayers();
        }
        
        function selectPlayerCategory(category) {
            selectedPlayerCategory = category;
            
            document.querySelectorAll('#page8 .category-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            document.getElementById(`categoryOption${category}`).classList.add('selected');
            
            updatePlayerFilterStatus();
            loadFilteredPlayers();
        }
        
        function updatePlayerFilterStatus() {
            const statusDiv = document.getElementById('playerFilterStatus');
        
            if (selectedDiscipline && selectedPlayerCategory) {
                statusDiv.innerHTML = `
                    <p>Toont spelers voor: <strong>${selectedDiscipline} - Categorie ${selectedPlayerCategory}</strong></p>
                    <button class="clear-all-btn" onclick="clearSelectedFilters()" style="margin-top: 10px;">
                        🔄 Filters Wissen
                    </button>
                `;
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
            
            document.querySelectorAll('#page8 .selection-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            document.querySelectorAll('#page8 .category-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            updatePlayerFilterStatus();
            loadPlayersList();
        }

        // ==================== SPELERS FILE UPLOAD ====================
        function handlePlayersFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
        
            reader.onload = function(e) {
                try {
                    let content = e.target.result;
                    content = fixCSVEncoding(content);
                    const newPlayersCount = parsePlayersCSV(content);
                    savePlayersToStorage();
                    alert(`✅ Succes! ${newPlayersCount} spelers toegevoegd.\n\nAlle vorige spelers zijn verwijderd en vervangen door de nieuwe.`);
                    
                    if (selectedDiscipline && selectedPlayerCategory) {
                        loadFilteredPlayers();
                    } else {
                        loadPlayersList();
                    }
                } catch (error) {
                    alert(`❌ Fout bij lezen van bestand: ${error.message}\n\nUpload wordt afgebroken.`);
                    console.error(error);
                }
            };
            
            if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                reader.readAsText(file, 'UTF-8');
            } else {
                alert("Alleen CSV of TXT bestanden worden ondersteund.");
            }
        
            event.target.value = '';
        }

        function fixCSVEncoding(content) {
            const nameFixes = [
                ['Bjýrn', 'Björn'],
                ['BjÃ«rn', 'Björn'],
                ['Bjï¿½rn', 'Björn'],
                ['Michaýl', 'Michaël'],
                ['Michaï¿½l', 'Michaël'],
                ['MichaÃ«l', 'Michaël'],
                ['Noýl', 'Noël'],
                ['Noï¿½l', 'Noël'],
                ['NoÃ«l', 'Noël'],
                ['Josý', 'José'],
                ['Josï¿½', 'José'],
                ['JosÃ©', 'José'],
                ['josý', 'josé'],
                ['josï¿½', 'josé'],
                ['josÃ©', 'josé']
            ];
            
            nameFixes.forEach(([bad, good]) => {
                if (content.includes(bad)) {
                    const regex = new RegExp(bad, 'gi');
                    content = content.replace(regex, good);
                }
            });
            
            const generalReplacements = [
                ['ý', 'ë'],
                ['ï¿½', 'ë'],
                ['Ã«', 'ë'],
                ['Ã©', 'é'],
                ['Ãˆ', 'È'],
                ['Ã¨', 'è'],
                ['Ã', 'à'],
                ['Ã¯', 'ï'],
                ['Ã´', 'ô'],
                ['Ã¶', 'ö'],
                ['Ã¼', 'ü'],
                ['Ãç', 'ç'],
                ['Ã±', 'ñ'],
                ['Ã¡', 'á'],
                ['Ã­', 'í'],
                ['Ã³', 'ó'],
                ['Ãº', 'ú'],
                ['Ã', 'ã'],
                ['Ãµ', 'õ'],
                ['Ã¤', 'ä'],
                ['Ã¸', 'ø'],
                ['Ã', 'å'],
                ['Ã', 'ß'],
                ['Â', ''],
                ['â‚¬', '€'],
                ['â€™', "'"],
                ['â€œ', '"'],
                ['â€', '"']
            ];
            
            generalReplacements.forEach(([bad, good]) => {
                const regex = new RegExp(bad, 'g');
                content = content.replace(regex, good);
            });
            
            return content;
        }

	function parsePlayersCSV(csvText) {
	    console.log("=== START PARSE PLAYERS CSV ===");
	    
	    // Fix encoding
	    csvText = fixCSVEncoding(csvText);
	    
	    console.log("CSV lengte:", csvText.length);
	    console.log("Eerste 1000 karakters:", csvText.substring(0, 1000));
	    
	    // Split in regels
	    const lines = csvText.split(/\r\n|\n/);
	    console.log("Aantal regels:", lines.length);
	    
	    state.players = []; // Wis oude spelers bij upload
	    let addedCount = 0;
	    
	    for (let i = 0; i < lines.length; i++) {
	        let line = lines[i].trim();
	        
	        console.log(`\n--- Verwerk regel ${i + 1} ---`);
	        console.log(`Originele regel: "${line}"`);
	        
	        // Skip lege regels
	        if (!line || line === '') {
	            console.log(`Regel ${i + 1} overgeslagen (leeg)`);
	            continue;
	        }
	        
	        // Skip commentaar of header
	        if (line.startsWith('//') || line.startsWith('#') || line.startsWith(';')) {
	            console.log(`Regel ${i + 1} overgeslagen (commentaar)`);
	            continue;
	        }
        
	        // Skip header als het veldnamen bevat
	        if (i === 0 && (line.toLowerCase().includes('naam') || line.toLowerCase().includes('tsg') || line.toLowerCase().includes('pnt'))) {
	            console.log(`Regel ${i + 1} overgeslagen (header)`);
	            continue;
	        }
	        
	        // Gebruik puntkomma als delimiter voor spelers
	        const delimiter = ';';
	        let parts = line.split(delimiter).map(p => p.trim());
	        
	        console.log(`Geparsede delen (${parts.length}):`, parts);
	        
	        // Minimaal 4 velden nodig: Naam;TSG;PNT;Cat
	        if (parts.length < 4) {
	            console.log(`Regel ${i + 1} overgeslagen - te weinig delen (${parts.length})`);
	            continue;
	        }
	        
	        try {
	            const playerName = normalizeText(parts[0]);
	            const tsg = parts[1];
	            const pnt = parts[2];
	            const category = parts[3];
	            const discipline = parts.length >= 5 ? normalizeText(parts[4]) : "Vrijspel";
	            
	            // Parse getallen (vervang komma door punt)
	            const tsgValue = parseFloat(tsg.replace(',', '.'));
	            const pntValue = parseFloat(pnt.replace(',', '.'));
	            const categoryNum = parseInt(category);
	            
	            if (isNaN(tsgValue) || isNaN(pntValue) || isNaN(categoryNum)) {
	                console.log(`Regel ${i + 1} overgeslagen - ongeldige getallen`);
	                continue;
	            }
	            
	            // Voeg speler toe
	            state.players.push({
	                name: playerName,
	                discipline: discipline,
	                category: categoryNum,
	                target: Math.round(pntValue),
	                tsg: tsgValue.toFixed(3).replace('.', ','),
	                pnt: pntValue
	            });
	            
	            addedCount++;
	            console.log(`✅ Speler toegevoegd: ${playerName} (${discipline} Cat. ${categoryNum})`);
	            
	        } catch (error) {
	            console.error(`❌ Fout bij verwerken regel ${i + 1}:`, error);
	            console.error("Regel:", line);
	        }
	    }
    
	    console.log(`✅ Totaal ${addedCount} spelers toegevoegd`);
	    savePlayersToStorage();
	    return addedCount;
	}

        function loadFilteredPlayers() {
            if (!selectedDiscipline || !selectedPlayerCategory) {
                loadPlayersList();
                return;
            }

            const playersList = document.getElementById('playersList');
        
            const filteredPlayers = state.players.filter(player => {
                const playerDiscipline = player.discipline.toLowerCase().trim();
                const selectedDisciplineLower = selectedDiscipline.toLowerCase().trim();
                return playerDiscipline === selectedDisciplineLower && player.category === selectedPlayerCategory;
            });
        
            if (filteredPlayers.length === 0) {
                const uniqueDisciplines = [...new Set(state.players.map(p => p.discipline))];
                const disciplinesString = uniqueDisciplines.map(d => `"${d}"`).join(', ');
            
                playersList.innerHTML = `
                    <div class="no-matches">
                        <p>Geen spelers gevonden voor ${selectedDiscipline} - Categorie ${selectedPlayerCategory}</p>
                        <p><small>Controleer of discipline naam overeenkomst</small></p>
                        <p><small>Beschikbare disciplines: ${disciplinesString}</small></p>
                    </div>
                `;
                return;
            }

            filteredPlayers.sort((a, b) => a.name.localeCompare(b.name));
        
            let html = `
                <div class="matches-list-title">
                    Spelers voor ${selectedDiscipline} - Categorie ${selectedPlayerCategory} (${filteredPlayers.length})
                </div>
            `;
        
            html += `
                <div style="margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-weight: bold; padding: 10px; background: #34495e; border-radius: 8px;">
                    <div>Naam</div>
                    <div>TSG</div>
                    <div>Target</div>
                </div>
            `;

            filteredPlayers.forEach((player, index) => {
                const globalIndex = state.players.findIndex(p => 
                    p.name === player.name && 
                    p.discipline.toLowerCase() === player.discipline.toLowerCase() && 
                    p.category === player.category
                );
            
                html += `
                    <div style="padding: 15px; margin: 5px 0; background: rgba(255,255,255,0.05); border-radius: 5px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; align-items: center;">
                        <div>
                            <strong>${player.name}</strong><br>
                            <small style="color: #95a5a6;">${player.discipline} - Cat. ${player.category}</small>
                        </div>
                        <div style="text-align: center;">
                            <span style="font-size: 1.1em; color: #f1c40f;">${player.tsg || 'N/A'}</span>
                        </div>
                        <div style="text-align: center; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 1.1em; color: #2ecc71;">${player.target}</span>
                            <button class="delete-match-btn" onclick="deletePlayerByIndex(${globalIndex})" title="Speler verwijderen" style="position: relative; top: 0; right: 0;">×</button>
                        </div>
                    </div>
                `;
            });
        
            playersList.innerHTML = html;
        }

        function loadPlayersList() {
            const playersList = document.getElementById('playersList');
        
            if (state.players.length === 0) {
                playersList.innerHTML = `
                    <div class="no-matches">
                        <p>Nog geen spelers toegevoegd</p>
                        <p><small>Upload een CSV bestand met spelers</small></p>
                    </div>
                `;
                return;
            }
            
            const playersByDiscipline = {};
            state.players.forEach(player => {
                if (!playersByDiscipline[player.discipline]) {
                    playersByDiscipline[player.discipline] = {};
                }
                if (!playersByDiscipline[player.discipline][player.category]) {
                    playersByDiscipline[player.discipline][player.category] = [];
                }
                playersByDiscipline[player.discipline][player.category].push(player);
            });
            
            let html = `
                <div class="matches-list-title">
                    Alle Spelers Overzicht (${state.players.length} spelers)
                </div>
            `;
            
            html += `
                <div style="
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                ">
                    <button class="clear-all-btn" onclick="clearAllPlayers()">
                        🗑️ Alle Spelers Verwijderen
                    </button>
                    <button class="upload-btn" onclick="document.getElementById('playersFileInput').click()" style="background: #9b59b6;">
                        📁 Nieuwe Spelers Uploaden
                    </button>
                    <button class="export-btn" onclick="exportAllData()" style="background: #2ecc71;">
                        📤 Exporteer ALLES
                    </button>
                </div>
            `;
        
            const totalDisciplines = Object.keys(playersByDiscipline).length;
            let totalCategories = 0;
            Object.values(playersByDiscipline).forEach(cats => {
                totalCategories += Object.keys(cats).length;
            });
            
            html += `
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 25px;
                ">
                    <div style="
                        background: linear-gradient(135deg, #3498db, #2980b9);
                        padding: 15px;
                        border-radius: 10px;
                        text-align: center;
                        color: white;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    ">
                        <div style="font-size: 2em; font-weight: bold;">${state.players.length}</div>
                        <div>Totaal Spelers</div>
                    </div>
                    
                    <div style="
                        background: linear-gradient(135deg, #2ecc71, #27ae60);
                        padding: 15px;
                        border-radius: 10px;
                        text-align: center;
                        color: white;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    ">
                        <div style="font-size: 2em; font-weight: bold;">${totalDisciplines}</div>
                        <div>Disciplines</div>
                    </div>
                    
                    <div style="
                        background: linear-gradient(135deg, #9b59b6, #8e44ad);
                        padding: 15px;
                        border-radius: 10px;
                        text-align: center;
                        color: white;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    ">
                        <div style="font-size: 2em; font-weight: bold;">${totalCategories}</div>
                        <div>Categorie Groepen</div>
                    </div>
                </div>
            `;
            
            const desiredOrder = ["Vrijspel", "Bandstoten", "Driebanden"];
            const disciplines = Object.keys(playersByDiscipline);
            const sortedDisciplines = [];
    
            desiredOrder.forEach(discipline => {
                if (disciplines.includes(discipline)) {
                    sortedDisciplines.push(discipline);
                }
            });
            
            disciplines
                .filter(d => !sortedDisciplines.includes(d))
                .sort()
                .forEach(d => sortedDisciplines.push(d));
    
            sortedDisciplines.forEach(discipline => {
                const disciplineData = playersByDiscipline[discipline];
                const disciplineTotal = Object.values(disciplineData).flat().length;
                
                html += `
                    <div style="margin-bottom: 30px;">
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 15px;
                            padding-bottom: 10px;
                            border-bottom: 2px solid #34495e;
                        ">
                            <h3 style="color: #3498db; margin: 0;">
                                ${discipline} <span style="color: #95a5a6; font-size: 0.9em;">(${disciplineTotal} spelers)</span>
                            </h3>
                            <button onclick="selectDiscipline('${discipline}')" 
                                    style="
                                        background: #3498db;
                                        color: white;
                                        border: none;
                                        padding: 8px 15px;
                                        border-radius: 5px;
                                        font-size: 0.9em;
                                        cursor: pointer;
                                        transition: all 0.3s;
                                    "
                                    onmouseover="this.style.backgroundColor='#2980b9';"
                                    onmouseout="this.style.backgroundColor='#3498db';">
                                🔍 Toon ${discipline}
                            </button>
                        </div>
                `;
                
                Object.keys(disciplineData).sort((a, b) => a - b).forEach(category => {
                    const categoryPlayers = disciplineData[category];
                    
                    html += `
                        <div style="margin: 15px 0; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 10px; border-left: 4px solid ${getCategoryColor(category)};">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <h4 style="color: #f1c40f; margin: 0;">
                                    Categorie ${category} <span style="color: #95a5a6; font-size: 0.9em;">(${categoryPlayers.length} spelers)</span>
                                </h4>
                                <div>
                                    <button onclick="selectDisciplineAndCategory('${discipline}', ${category})" 
                                            style="
                                                background: #f39c12;
                                                color: white;
                                                border: none;
                                                padding: 6px 12px;
                                                border-radius: 5px;
                                                font-size: 0.8em;
                                                cursor: pointer;
                                                margin-right: 10px;
                                            ">
                                        👁️ Bekijk Details
                                    </button>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                    `;
                    
                    categoryPlayers.sort((a, b) => a.name.localeCompare(b.name)).forEach((player, index) => {
                        html += `
                            <div style="
                                padding: 10px;
                                background: rgba(255,255,255,0.03);
                                border-radius: 5px;
                                border-left: 3px solid #3498db;
                            ">
                                <div style="font-weight: bold; margin-bottom: 5px;">${player.name}</div>
                                <div style="display: flex; justify-content: space-between; font-size: 0.9em;">
                                    <span style="color: #f1c40f;">TSG: ${player.tsg || 'N/A'}</span>
                                    <span style="color: #2ecc71;">Target: ${player.target}</span>
                                </div>
                            </div>
                        `;
                    });
                    
                    html += `
                            </div>
                        </div>
                    `;
                });
                
                html += `</div>`;
            });
            
            playersList.innerHTML = html;
        }

        function getCategoryColor(category) {
            const colors = [
                '#e74c3c', // Cat 1 - Rood
                '#f39c12', // Cat 2 - Oranje
                '#f1c40f', // Cat 3 - Geel
                '#2ecc71', // Cat 4 - Groen
                '#3498db', // Cat 5 - Blauw
                '#9b59b6'  // Cat 6 - Paars
            ];
            return colors[category - 1] || '#95a5a6';
        }

        function selectDisciplineAndCategory(discipline, category) {
            selectedDiscipline = discipline;
            selectedPlayerCategory = category;
        
            document.querySelectorAll('#page8 .selection-option').forEach(option => {
                option.classList.remove('selected');
            });
        
            document.querySelectorAll('#page8 .category-option').forEach(option => {
                option.classList.remove('selected');
            });
        
            const disciplineElement = document.getElementById(`discipline${discipline}`);
            if (disciplineElement) {
                disciplineElement.classList.add('selected');
            }

            const categoryElement = document.getElementById(`categoryOption${category}`);
            if (categoryElement) {
                categoryElement.classList.add('selected');
            }
        
            updatePlayerFilterStatus();
            loadFilteredPlayers();
        
            document.querySelector('#page8 .selection-container').scrollIntoView({ behavior: 'smooth' });
        }
        
        function savePlayersToStorage() {
            localStorage.setItem('biljartPlayers', JSON.stringify(state.players));
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
            if (confirm("Weet je zeker dat je ALLE spelers wilt verwijderen? Dit kan niet ongedaan gemaakt worden!")) {
                state.players = [];
                savePlayersToStorage();
                loadPlayersList();
            }
        }

        // ==================== SWIPE PREVENTIE ====================
        let touchStartY = 0;
        let swipeWarningActive = false;
        let lastSwipeWarningTime = 0;
        
        function initSwipeProtection() {
            if (!('ontouchstart' in window)) return;
            
            document.addEventListener('touchstart', function(e) {
                touchStartY = e.touches[0].clientY;
                swipeWarningActive = (state.currentPage === 6 && !state.matchEnded);
            }, { passive: true });
            
            document.addEventListener('touchmove', function(e) {
                if (!swipeWarningActive) return;
                
                const touchY = e.touches[0].clientY;
                const touchDiff = touchY - touchStartY;
                const currentTime = Date.now();
                
                if (touchDiff > 100 && touchStartY < 100) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (currentTime - lastSwipeWarningTime > 2000) {
                        showSwipeWarning();
                        lastSwipeWarningTime = currentTime;
                    }
                    
                    return false;
                }
            }, { passive: false });
            
            document.addEventListener('contextmenu', function(e) {
                if (state.currentPage === 6 && !state.matchEnded) {
                    e.preventDefault();
                    return false;
                }
            });
        }
        
        function showSwipeWarning() {
            const existing = document.getElementById('swipe-warning');
            if (existing) existing.remove();
            
            const warning = document.createElement('div');
            warning.id = 'swipe-warning';
            warning.innerHTML = `
                <div style="
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    color: white;
                    padding: 15px 25px;
                    border-radius: 10px;
                    z-index: 9999;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    text-align: center;
                    font-weight: bold;
                    max-width: 90%;
                    animation: slideDown 0.3s ease-out;
                ">
                    ⚠️ Niet naar beneden swipen!<br>
                    <small>Match kan onderbroken worden</small>
                </div>
            `;
            
            document.body.appendChild(warning);
            
            setTimeout(() => {
                if (warning.parentNode) {
                    warning.style.animation = 'slideUp 0.3s ease-out';
                    setTimeout(() => warning.remove(), 300);
                }
            }, 2000);
        }

        // ==================== ADMIN PASSWORD FUNCTIES ====================
        const DEFAULT_PASSWORD = "admin123";

        function getAdminPassword() {
            const savedPassword = localStorage.getItem('biljartAdminPassword');
            return savedPassword || DEFAULT_PASSWORD;
        }

        function setAdminPassword(newPassword) {
            if (newPassword && newPassword.trim() !== '') {
                localStorage.setItem('biljartAdminPassword', newPassword.trim());
                return true;
            }
            return false;
        }

        function togglePasswordField() {
            const passwordField = document.getElementById('adminPassword');
            const manageBtn = document.querySelector('.upload-btn');
            
            if (passwordField.style.display === 'none' || passwordField.style.display === '') {
                passwordField.style.display = 'block';
                passwordField.focus();
                manageBtn.textContent = '🔓 Toegang';
            } else {
                passwordField.style.display = 'none';
                manageBtn.textContent = '📤 Beheer Matchen';
                passwordField.value = '';
            }
        }

        function checkPassword() {
            const passwordField = document.getElementById('adminPassword');
            const currentPassword = getAdminPassword();
            
            if (passwordField.style.display === 'none' || passwordField.style.display === '') {
                togglePasswordField();
                return;
            }
            
            const enteredPassword = passwordField.value.trim();
            
            if (enteredPassword === '') {
                alert("Voer een wachtwoord in");
                return;
            }
            
            if (enteredPassword === currentPassword) {
                passwordField.value = '';
                passwordField.style.display = 'none';
                document.querySelector('.upload-btn').textContent = '📤 Beheer Matchen';
                showPage(7);
            } else {
                alert("❌ Onjuist wachtwoord!");
                passwordField.value = '';
                passwordField.focus();
            }
        }

        function changeAdminPassword() {
            const currentPassword = getAdminPassword();
            const oldPassword = prompt("Voer huidig wachtwoord in:");
            
            if (oldPassword === null) return;
            
            if (oldPassword !== currentPassword) {
                alert("❌ Huidig wachtwoord is onjuist!");
                return;
            }
            
            const newPassword1 = prompt("Voer nieuw wachtwoord in (min. 4 tekens):");
            if (newPassword1 === null) return;
            
            if (newPassword1.length < 4) {
                alert("❌ Wachtwoord moet minimaal 4 tekens lang zijn!");
                return;
            }
            
            const newPassword2 = prompt("Herhaal nieuw wachtwoord:");
            if (newPassword2 === null) return;
            
            if (newPassword1 !== newPassword2) {
                alert("❌ Wachtwoorden komen niet overeen!");
                return;
            }
            
            if (setAdminPassword(newPassword1)) {
                alert("✅ Wachtwoord succesvol gewijzigd!");
            } else {
                alert("❌ Fout bij wijzigen wachtwoord");
            }
        }

        // ==================== HELPER FUNCTIES ====================
        function findPlayerIndex(name, discipline) {
            return state.players.findIndex(p => p.name === name && p.discipline === discipline);
        }




	function normalizeText(text) {
	    if (!text) return '';
	    
	    // Vervang veelvoorkomende encoding fouten
	    const replacements = {
	        'Ã«': 'ë',
	        'Ã©': 'é',
	        'Ã¨': 'è',
	        'Ãª': 'ê',
	        'Ã': 'à',
	        'Ã¢': 'â',
	        'Ã¤': 'ä',
	        'Ã¥': 'å',
	        'Ãç': 'ç',
	        'Ã¯': 'ï',
	        'Ã®': 'î',
	        'Ã´': 'ô',
	        'Ã¶': 'ö',
	        'Ã¹': 'ù',
	        'Ã»': 'û',
	        'Ã¼': 'ü',
	        'Ã±': 'ñ',
	        'â‚¬': '€'
	    };
    
	    let normalized = text.toString();
	    
	    Object.keys(replacements).forEach(bad => {
	        const regex = new RegExp(bad, 'g');
	        normalized = normalized.replace(regex, replacements[bad]);
	    });
	    
	    return normalized;
	}



	function fixForCSVExport(text) {
	    if (!text) return '';
	    
	    // Zet speciale tekens om naar UTF-8 compatibele vorm
	    const replacements = {
	        'Ã«': 'ë',
	        'Ã©': 'é',
	        'Ã¨': 'è',
	        'Ãª': 'ê',
	        'Ã«': 'ë',
	        'Ã': 'à',
	        'Ã¢': 'â',
	        'Ã¤': 'ä',
	        'Ã¥': 'å',
	        'Ãç': 'ç',
	        'Ã¯': 'ï',
	        'Ã®': 'î',
	        'Ã´': 'ô',
	        'Ã¶': 'ö',
	        'Ã¹': 'ù',
	        'Ã»': 'û',
	        'Ã¼': 'ü',
	        'Ãÿ': 'ÿ',
	        'Ã±': 'ñ',
	        'Ã': 'Á',
	        'Ã': 'á',
	        'Ã': 'È',
	        'Ã': 'É',
	        'Ã': 'Í',
	        'Ã': 'Ó',
	        'Ã': 'Ú',
	        'Ã': 'Ý',
	        'â‚¬': '€',
	        'â€š': '‚',
	        'â€ž': '„',
	        'â€¦': '…',
	        'â€¡': '‡',
	        'â€°': '‰',
	        'â€¹': '‹',
	        'â€˜': '‘',
	        'â€™': '’',
	        'â€œ': '“',
	        'â€¢': '•',
	        'â€"': '–',
	        'â€"': '—',
	        'â„¢': '™',
	        'â€º': '›',
	        'â€¦': '…'
	    };
    
	    let fixedText = text.toString();
	    
	    // Vervang alle speciale tekens
	    Object.keys(replacements).forEach(bad => {
	        const regex = new RegExp(bad, 'g');
	        fixedText = fixedText.replace(regex, replacements[bad]);
	    });
	    
	    // Extra zekerheid: UTF-8 encoding
	    try {
	        fixedText = decodeURIComponent(escape(fixedText));
	    } catch (e) {
	        // Negeer fouten, gebruik de gefixeerde tekst
	    }
	    
	    return fixedText;
	}

        // ==================== DATUM FUNCTIES ====================
        function formatDateForInput(date) {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        function parseDDMMYYYY(dateStr) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                return new Date(year, month, day);
            }
            return new Date();
        }
        
        function getDayOfWeek(dateStr) {
            const days = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const date = new Date(parts[0], parts[1] - 1, parts[2]);
                return days[date.getDay()];
            }
            return "";
        }

        function formatDateDisplay(dateStr) {
            if (!dateStr) return '';
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return dateStr;
        }

        function formatDateForCSV(dateStr) {
            return formatDateDisplay(dateStr);
        }

        // ==================== PAGINA FUNCTIES ====================
        function showPage(pageNum) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(`page${pageNum}`).classList.add('active');
            state.currentPage = pageNum;
            
            document.querySelectorAll('.page').forEach(p => {
                if (p.id !== 'page6') {
                    p.style.overflowY = 'auto';
                    p.style.overflow = 'auto';
                    p.style.touchAction = 'auto';
                }
            });
            
            if (pageNum === 1) {
                document.querySelectorAll('.selection-option').forEach(opt => opt.classList.remove('selected'));
                document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('selected'));
                state.selectedGameType = null;
                state.selectedCategory = null;
            
                const passwordField = document.getElementById('adminPassword');
                if (passwordField.style.display === 'block') {
                    passwordField.style.display = 'none';
                    passwordField.value = '';
                    document.querySelector('.upload-btn').textContent = '📤 Beheer Matchen';
                }
            } else if (pageNum === 4) {
                loadFilteredMatches();
            } else if (pageNum === 5) {
                updateBallSelectionPage();
            } else if (pageNum === 7) {
                loadMatchesTabContent();
                document.getElementById('filterDate').value = formatDateForInput(new Date());
            } else if (pageNum === 8) {
                selectedDiscipline = null;
                selectedPlayerCategory = null;
                document.querySelectorAll('#page8 .selection-option').forEach(opt => opt.classList.remove('selected'));
                document.querySelectorAll('#page8 .category-option').forEach(opt => opt.classList.remove('selected'));
                updatePlayerFilterStatus();
                loadPlayersList();
            } else if (pageNum === 9) {
                setupNewMatchPage();
            } else if (pageNum === 10) {
                // Update stats display
                const container = document.getElementById('page10');
                const stats = container.querySelector('.data-transfer-section');
                if (stats) {
                    stats.innerHTML = stats.innerHTML.replace(
                        /\${state\.players\.length}/g, state.players.length
                    ).replace(
                        /\${state\.matches\.filter\(m => !m\.completed\)\.length}/g, 
                        state.matches.filter(m => !m.completed).length
                    ).replace(
                        /\${state\.matches\.filter\(m => m\.completed\)\.length}/g,
                        state.matches.filter(m => m.completed).length
                    ).replace(
                        /\${state\.downloadedMatches\.length}/g,
                        state.downloadedMatches.length
                    );
                }
            }
        }

        function goToPage2() {
            const dateInput = document.getElementById('dateSelect');
            const selectedDate = dateInput.value;
            
            if (!selectedDate) {
                alert("Selecteer eerst een datum!");
                return;
            }
            
            state.selectedDate = selectedDate;
            showPage(2);
        }

        function selectGameType(gameType) {
            state.selectedGameType = gameType;
            
            document.querySelectorAll('.selection-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            event.currentTarget.classList.add('selected');
            
            setTimeout(() => {
                showPage(3);
            }, 300);
        }

        function selectCategory(category) {
            state.selectedCategory = category;
            
            document.querySelectorAll('.category-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            event.currentTarget.classList.add('selected');
            
            setTimeout(() => {
                showPage(4);
            }, 300);
        }

        function loadFilteredMatches() {
            const matchList = document.getElementById('matchList');
            const title = document.getElementById('matchListTitle');
            
            const displayDate = formatDateDisplay(state.selectedDate);
            const dayOfWeek = getDayOfWeek(state.selectedDate);
            title.textContent = `Matchen-${dayOfWeek}-${displayDate}-${state.selectedGameType}-Cat. ${state.selectedCategory}`;

            const filteredMatches = state.matches.filter(match => {
                return match.date === state.selectedDate && 
                       match.discipline === state.selectedGameType && 
                       match.cat === state.selectedCategory &&
                       !match.completed;
            });
            
            if (filteredMatches.length === 0) {
                matchList.innerHTML = `
                    <div class="no-matches">
                        <p>Geen matchen gevonden voor deze selectie</p>
                        <p><small>Upload matchen via het beheer menu (📤 knop rechtsboven)</small></p>
                        <p><small>Of maak een nieuwe match aan met de ➕ knop</small></p>
                    </div>
                `;
                return;
            }
            
            matchList.innerHTML = filteredMatches.map(match => `
                <div class="match-card" onclick="selectMatch(${match.id})">
                    <h3>${match.discipline} - Cat. ${match.cat}</h3>
                    <p class="match-info">
                        <strong>${match.p1}</strong> vs <strong>${match.p2}</strong><br>
                        🎯 Te maken punten: ${match.target1} - ${match.target2}<br>
                        📅 Datum: ${formatDateDisplay(match.date)}
                    </p>
                </div>
            `).join('');
        }

        // ==================== MATCHES TAB FUNCTIES ====================
        function showMatchesTab(tab) {
            state.currentMatchesTab = tab;
            
            document.querySelectorAll('#matchesTabs .tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.querySelectorAll('#matchesTabContent .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
            document.getElementById(`tabContent${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
            
            loadMatchesTabContent();
        }

        function loadMatchesTabContent() {
            updateTabBadges();
            
            if (state.currentMatchesTab === 'active') {
                loadActiveMatches();
            } else if (state.currentMatchesTab === 'completed') {
                loadCompletedMatches();
            } else if (state.currentMatchesTab === 'downloaded') {
                loadDownloadedMatches();
            }
        }

        function updateTabBadges() {
            const activeCount = state.matches.filter(m => !m.completed).length;
            const completedCount = state.matches.filter(m => m.completed).length;
            const downloadedCount = state.downloadedMatches.length;
            
            document.getElementById('badgeActive').textContent = activeCount;
            document.getElementById('badgeCompleted').textContent = completedCount;
            document.getElementById('badgeDownloaded').textContent = downloadedCount;
        }

        function loadActiveMatches() {
            const container = document.getElementById('tabContentActive');
            const activeMatches = state.matches.filter(match => !match.completed);
            
            if (activeMatches.length === 0) {
                container.innerHTML = `
                    <div class="no-matches">
                        <p>Geen actieve matchen</p>
                        <p><small>Upload of maak nieuwe matchen aan</small></p>
                    </div>
                `;
                return;
            }
            
            const matchesByDate = {};
            activeMatches.forEach(match => {
                if (!matchesByDate[match.date]) {
                    matchesByDate[match.date] = [];
                }
                matchesByDate[match.date].push(match);
            });
            
            const sortedDates = Object.keys(matchesByDate).sort((a, b) => new Date(b) - new Date(a));
            
            let html = '<div class="matches-list-title">Actieve Matchen (' + activeMatches.length + ')</div>';
            
            html += `
                <button class="clear-all-btn" onclick="clearAllActiveMatches()">
                    🗑️ Alle Actieve Matchen Verwijderen
                </button>
                <div style="margin-bottom: 20px;"></div>
            `;
            
            sortedDates.forEach(date => {
                const displayDate = formatDateDisplay(date);
                const dateMatches = matchesByDate[date];
                
                html += `
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #3498db; border-bottom: 1px solid #34495e; padding-bottom: 5px;">
                            📅 ${displayDate} (${dateMatches.length} matchen)
                        </h3>
                `;
                
                dateMatches.forEach(match => {
                    html += `
                        <div class="match-card" style="cursor: default;">
                            <button class="delete-match-btn" onclick="deleteMatch(${match.id})" title="Match verwijderen">×</button>
                            <h3>${match.discipline} - Cat. ${match.cat}
                                <span class="status-badge status-pending">In afwachting</span>
                            </h3>
                            <p class="match-info">
                                <strong>${match.p1}</strong> vs <strong>${match.p2}</strong><br>
                                🎯 Te maken punten: ${match.target1} - ${match.target2}<br>
                                📅 Datum: ${formatDateDisplay(match.date)}
                            </p>
                            <div class="match-actions">
                                <button onclick="selectMatch(${match.id})" class="action-btn-small" style="background: #2ecc71;">
                                    ▶️ Speel Match
                                </button>
                                <button onclick="editMatch(${match.id})" class="action-btn-small" style="background: #3498db;">
                                    ✏️ Bewerk
                                </button>
                            </div>
                        </div>
                    `;
                });
                
                html += `</div>`;
            });
            
            container.innerHTML = html;
        }

        function loadCompletedMatches() {
            const container = document.getElementById('tabContentCompleted');
            const completedMatches = state.matches.filter(match => match.completed);
            
            if (completedMatches.length === 0) {
                container.innerHTML = `
                    <div class="no-matches">
                        <p>Geen voltooide matchen</p>
                        <p><small>Speel eerst matchen om ze hier te zien</small></p>
                    </div>
                `;
                return;
            }
            
            const matchesByDate = {};
            completedMatches.forEach(match => {
                if (!matchesByDate[match.date]) {
                    matchesByDate[match.date] = [];
                }
                matchesByDate[match.date].push(match);
            });
            
            const sortedDates = Object.keys(matchesByDate).sort((a, b) => new Date(b) - new Date(a));
            
            let html = '<div class="matches-list-title">Voltooide Matchen (' + completedMatches.length + ')</div>';
            
            html += `
                <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="download-btn" onclick="downloadAllResults()">
                        📥 Download Alles
                    </button>
                    <button class="clear-all-btn" onclick="clearAllCompletedMatches()">
                        🗑️ Alle Voltooide Matchen Verwijderen
                    </button>
                </div>
            `;
            
            sortedDates.forEach(date => {
                const displayDate = formatDateDisplay(date);
                const dateMatches = matchesByDate[date];
                
                html += `
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #27ae60; border-bottom: 1px solid #34495e; padding-bottom: 5px;">
                            📅 ${displayDate} (${dateMatches.length} matchen)
                        </h3>
                `;
                
                dateMatches.forEach(match => {
                    const winner = match.p1Score >= match.target1 ? match.p1 : match.p2;
                    
                    html += `
                        <div class="match-card completed" style="cursor: default;">
                            <button class="delete-match-btn" onclick="deleteMatch(${match.id})" title="Match verwijderen">×</button>
                            <h3>${match.discipline} - Cat. ${match.cat}
                                <span class="status-badge status-completed">Voltooid</span>
                            </h3>
                            <p class="match-info">
                                <strong>${match.p1}</strong> vs <strong>${match.p2}</strong><br>
                                🎯 Te maken punten: ${match.target1} - ${match.target2}<br>
                                📊 Eindscore: ${match.p1Score || 0} - ${match.p2Score || 0}<br>
                                🏆 Winnaar: ${winner}<br>
                                📅 Datum: ${formatDateDisplay(match.date)}
                            </p>
                            <div class="match-actions">
                                <button onclick="downloadSingleMatch(${match.id})" class="action-btn-small" style="background: #2ecc71;">
                                    📥 Download
                                </button>
                                <button onclick="moveToDownloaded(${match.id})" class="action-btn-small" style="background: #3498db;">
                                    📋 Verplaats naar Gedownload
                                </button>
                            </div>
                        </div>
                    `;
                });
                
                html += `</div>`;
            });
            
            container.innerHTML = html;
        }

        function loadDownloadedMatches() {
            const container = document.getElementById('tabContentDownloaded');
            
            if (state.downloadedMatches.length === 0) {
                container.innerHTML = `
                    <div class="no-matches">
                        <p>Geen gedownloade matchen</p>
                        <p><small>Download voltooide matchen om ze hier te zien</small></p>
                    </div>
                `;
                return;
            }
            
            const matchesByDate = {};
            state.downloadedMatches.forEach(match => {
                if (!matchesByDate[match.date]) {
                    matchesByDate[match.date] = [];
                }
                matchesByDate[match.date].push(match);
            });
            
            const sortedDates = Object.keys(matchesByDate).sort((a, b) => new Date(b) - new Date(a));
            
            let html = '<div class="matches-list-title">Gedownloade Matchen (' + state.downloadedMatches.length + ')</div>';
            
            html += `
                <button class="clear-all-btn" onclick="clearAllDownloadedMatches()">
                    🗑️ Alle Gedownloade Matchen Verwijderen
                </button>
                <div style="margin-bottom: 20px;"></div>
            `;
            
            sortedDates.forEach(date => {
                const displayDate = formatDateDisplay(date);
                const dateMatches = matchesByDate[date];
                
                html += `
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #3498db; border-bottom: 1px solid #34495e; padding-bottom: 5px;">
                            📅 ${displayDate} (${dateMatches.length} matchen)
                        </h3>
                `;
                
                dateMatches.forEach((match, index) => {
                    const globalIndex = state.downloadedMatches.findIndex(m => 
                        m.id === match.id && 
                        m.date === match.date
                    );
                    
                    const winner = match.p1Score >= match.target1 ? match.p1 : match.p2;
                    
                    html += `
                        <div class="match-card downloaded" style="cursor: default;">
                            <button class="delete-match-btn" onclick="deleteDownloadedMatch(${globalIndex})" title="Match verwijderen">×</button>
                            <h3>${match.discipline} - Cat. ${match.cat}
                                <span class="status-badge status-downloaded">Gedownload</span>
                            </h3>
                            <p class="match-info">
                                <strong>${match.p1}</strong> vs <strong>${match.p2}</strong><br>
                                🎯 Te maken punten: ${match.target1} - ${match.target2}<br>
                                📊 Eindscore: ${match.p1Score || 0} - ${match.p2Score || 0}<br>
                                🏆 Winnaar: ${winner}<br>
                                📅 Datum: ${formatDateDisplay(match.date)}
                            </p>
                            <div class="match-actions">
                                <button onclick="reDownloadMatch(${globalIndex})" class="action-btn-small" style="background: #2ecc71;">
                                    🔄 Opnieuw Downloaden
                                </button>
                                <button onclick="restoreMatch(${globalIndex})" class="action-btn-small" style="background: #f39c12;">
                                    ↩️ Herstel naar Voltooid
                                </button>
                            </div>
                        </div>
                    `;
                });
                
                html += `</div>`;
            });
            
            container.innerHTML = html;
        }

        function moveToDownloaded(matchId) {
            const matchIndex = state.matches.findIndex(m => m.id === matchId);
            if (matchIndex !== -1 && state.matches[matchIndex].completed) {
                const match = state.matches[matchIndex];
                if (confirm(`Match verplaatsen naar gedownloade matchen?\n\n${match.p1} vs ${match.p2}`)) {
                    state.downloadedMatches.push({
                        ...match,
                        downloadedDate: new Date().toISOString()
                    });
                    state.matches.splice(matchIndex, 1);
                    saveStateToStorage();
                    loadMatchesTabContent();
                    alert('Match verplaatst naar gedownloade matchen');
                }
            }
        }

        function restoreMatch(downloadedIndex) {
            if (downloadedIndex >= 0 && downloadedIndex < state.downloadedMatches.length) {
                const match = state.downloadedMatches[downloadedIndex];
                if (confirm(`Match herstellen naar voltooide matchen?\n\n${match.p1} vs ${match.p2}`)) {
                    state.matches.push(match);
                    state.downloadedMatches.splice(downloadedIndex, 1);
                    saveStateToStorage();
                    loadMatchesTabContent();
                    alert('Match hersteld naar voltooide matchen');
                }
            }
        }

        function reDownloadMatch(downloadedIndex) {
            if (downloadedIndex >= 0 && downloadedIndex < state.downloadedMatches.length) {
                const match = state.downloadedMatches[downloadedIndex];
                downloadMatchesAsCSV([match], `herdownload_${match.p1}_vs_${match.p2}`);
            }
        }

        function fixCSVEncoding(content) {
            console.log("=== FIXING CSV ENCODING ===");
            
            // Eerst BOM verwijderen als aanwezig
            if (content.charCodeAt(0) === 0xFEFF || content.charCodeAt(0) === 0xFFFE) {
                content = content.substring(1);
            }
            
            // SPECIFIEKE NAMEN eerst fixen
            const nameFixes = [
                // Noël cases
                ['NoÃ«l', 'Noël'],
                ['Noël', 'Noël'], // Al goed
                ['Noel', 'Noël'], // Zonder accent
                ['Noël', 'Noël'], // Met accent
                
                // Björn cases
                ['BjÃ¶rn', 'Björn'],
                ['Björn', 'Björn'],
                ['Bjorn', 'Björn'],
                
                // Michaël cases  
                ['MichaÃ«l', 'Michaël'],
                ['Michaël', 'Michaël'],
                ['Michael', 'Michaël'],
                
                // José cases
                ['JosÃ©', 'José'],
                ['José', 'José'],
                ['Jose', 'José'],
                
                // Andere veelvoorkomende namen
                ['DÃ©sirÃ©', 'Désiré'],
                ['RenÃ©', 'René'],
                ['AndrÃ©', 'André'],
                ['FrÃ©dÃ©ric', 'Frédéric'],
                ['JÃ©rÃ´me', 'Jérôme'],
                ['StÃ©phane', 'Stéphane'],
                ['HÃ©lÃ¨ne', 'Hélène'],
                ['FranÃ§ois', 'François'],
                ['Ã‰ric', 'Éric'],
                ['Ãˆve', 'Ève']
            ];
            
            nameFixes.forEach(([bad, good]) => {
                if (content.includes(bad)) {
                    console.log(`Specifieke vervanging: "${bad}" -> "${good}"`);
                    const regex = new RegExp(bad, 'gi');
                    content = content.replace(regex, good);
                }
            });
    
            // ALGEMENE VERVANGINGEN
            const generalReplacements = [
                // ë cases
                ['Ã«', 'ë'],
                
                // é cases
                ['Ã©', 'é'],
                
                // è cases
                ['Ã¨', 'è'],
                
                // ê cases
                ['Ãª', 'ê'],
                
                // à cases
                ['Ã ', 'à '],
                    
                // ç cases
                ['Ãç', 'ç'],
                
                // î cases
                ['Ã®', 'î'],
                
                // ô cases
                ['Ã´', 'ô'],
                
                // û cases
                ['Ã»', 'û'],
                
                // ï cases
                ['Ã¯', 'ï'],
                
                // ü cases
                ['Ã¼', 'ü'],
                
                // ö cases
                ['Ã¶', 'ö'],
                
                // ä cases
                ['Ã¤', 'ä'],
                
                // ñ cases
                ['Ã±', 'ñ'],
                
                // ÿ cases
                ['Ãÿ', 'ÿ'],
                
                // Euro teken
                ['â‚¬', '€'],
                
                // Enkele/dubbele aanhalingstekens
                ['â€˜', "'"],
                ['â€™', "'"],
                ['â€œ', '"'],
                ['â€', '"'],
                
                // Andere speciale tekens
                ['â€"', '—'],
                ['â€"', '–'],
                ['â€¢', '•'],
                ['â€¦', '…'],
                ['â€¡', '‡'],
                ['â€°', '‰'],
                ['â„¢', '™'],
                ['Â', ''],   // Onzichtbare char
                ['â€', ''],  // Lege char
            ];
        
            generalReplacements.forEach(([bad, good]) => {
                const regex = new RegExp(bad, 'g');
                content = content.replace(regex, good);
            });
            
            // UTF-8 replacement characters fixen
            content = content.replace(/Ã¯Â¿Â½/g, '');
            content = content.replace(/ï¿½/g, '');
            content = content.replace(/�/g, '');
            
            // Extra: decode URI component voor speciale tekens
            try {
                content = decodeURIComponent(escape(content));
            } catch (e) {
                // Negeer als het niet werkt
            }
            
            // Final cleanup: dubbele spaties en rare tekens
            content = content.replace(/\s+/g, ' ');
            content = content.replace(/[^\x00-\x7F\u00A0-\u00FF\u0100-\u017F\u0180-\u024F]/g, '');
            
            console.log("=== NA ENCODING FIX ===");
            console.log("Voorbeeld namen:");
            const testNames = ['Noël', 'Michaël', 'Björn', 'José', 'René', 'André', 'François'];
            testNames.forEach(name => {
                if (content.includes(name)) {
                    console.log(`  ✅ "${name}" aanwezig`);
                }
            });
        
            return content;
        }

        // ==================== MATCH BEHEER FUNCTIES ====================
        function deleteMatch(matchId) {
            const matchIndex = state.matches.findIndex(m => m.id === matchId);
            if (matchIndex !== -1) {
                const match = state.matches[matchIndex];
                if (confirm(`Weet je zeker dat je deze match wilt verwijderen?\n\n${match.p1} vs ${match.p2}`)) {
                    state.matches.splice(matchIndex, 1);
                    saveStateToStorage();
                    loadMatchesTabContent();
                    
                    if (state.currentPage === 4) {
                        loadFilteredMatches();
                    }
                }
            }
        }

        function deleteDownloadedMatch(downloadedIndex) {
            if (downloadedIndex >= 0 && downloadedIndex < state.downloadedMatches.length) {
                const match = state.downloadedMatches[downloadedIndex];
                if (confirm(`Weet je zeker dat je deze gedownloade match wilt verwijderen?\n\n${match.p1} vs ${match.p2}`)) {
                    state.downloadedMatches.splice(downloadedIndex, 1);
                    saveStateToStorage();
                    loadMatchesTabContent();
                }
            }
        }

        function clearAllActiveMatches() {
            const activeMatches = state.matches.filter(m => !m.completed);
            if (activeMatches.length === 0) {
                alert("Geen actieve matchen om te verwijderen.");
                return;
            }
            
            if (confirm(`Weet je zeker dat je ALLE ${activeMatches.length} actieve matchen wilt verwijderen? Dit kan niet ongedaan gemaakt worden!`)) {
                state.matches = state.matches.filter(m => m.completed);
                saveStateToStorage();
                loadMatchesTabContent();
                alert(`${activeMatches.length} actieve matchen verwijderd.`);
            }
        }

        function clearAllCompletedMatches() {
            const completedMatches = state.matches.filter(m => m.completed);
            if (completedMatches.length === 0) {
                alert("Geen voltooide matchen om te verwijderen.");
                return;
            }
            
            if (confirm(`Weet je zeker dat je ALLE ${completedMatches.length} voltooide matchen wilt verwijderen? Dit kan niet ongedaan gemaakt worden!`)) {
                state.matches = state.matches.filter(m => !m.completed);
                saveStateToStorage();
                loadMatchesTabContent();
                alert(`${completedMatches.length} voltooide matchen verwijderd.`);
            }
        }

        function clearAllDownloadedMatches() {
            if (state.downloadedMatches.length === 0) {
                alert("Geen gedownloade matchen om te verwijderen.");
                return;
            }
            
            if (confirm(`Weet je zeker dat je ALLE ${state.downloadedMatches.length} gedownloade matchen wilt verwijderen? Dit kan niet ongedaan gemaakt worden!`)) {
                state.downloadedMatches = [];
                saveStateToStorage();
                loadMatchesTabContent();
                alert(`${state.downloadedMatches.length} gedownloade matchen verwijderd.`);
            }
        }

        function editMatch(matchId) {
            selectMatch(matchId);
        }

        function saveStateToStorage() {
            const stateToSave = {
                players: state.players,
                matches: state.matches,
                downloadedMatches: state.downloadedMatches,
                adminPassword: localStorage.getItem('biljartAdminPassword') || DEFAULT_PASSWORD
            };
            localStorage.setItem('billiardTournamentState', JSON.stringify(stateToSave));
        }

        function loadStateFromStorage() {
            const saved = localStorage.getItem('billiardTournamentState');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    state.players = parsed.players || [];
                    state.matches = parsed.matches || [];
                    state.downloadedMatches = parsed.downloadedMatches || [];
                } catch (e) {
                    console.error('Fout bij laden opgeslagen staat:', e);
                }
            }
            
            // Laad ook spelers apart (voor backward compatibility)
            const savedPlayers = localStorage.getItem('biljartPlayers');
            if (savedPlayers && state.players.length === 0) {
                try {
                    state.players = JSON.parse(savedPlayers);
                } catch (e) {
                    console.error('Fout bij laden spelers:', e);
                }
            }
            
            // Zet de huidige datum
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            state.selectedDate = `${yyyy}-${mm}-${dd}`;
        }

        // ==================== BAL KLEUR SELECTIE ====================
        function updateBallSelectionPage() {
            if (!state.currentMatch) return;
            
            document.getElementById('whiteBall1Text').textContent = state.currentMatch.p1;
            document.getElementById('whiteBall2Text').textContent = state.currentMatch.p2;
            document.getElementById('whiteBall1Label').textContent = state.currentMatch.p1;
            document.getElementById('whiteBall2Label').textContent = state.currentMatch.p2;
            
            document.querySelectorAll('.ball-circle').forEach(ball => {
                ball.classList.remove('selected');
            });
            
            const startBtn = document.getElementById('startMatchBtn');
            startBtn.disabled = state.selectedWhitePlayer === null;
            startBtn.className = state.selectedWhitePlayer === null ? 
                'start-match-btn disabled-btn' : 'start-match-btn';
        }

        function selectWhitePlayer(player) {
            state.selectedWhitePlayer = player;
            
            document.querySelectorAll('.ball-circle').forEach(ball => {
                ball.classList.remove('selected');
            });
            
            const selectedBall = player === 1 ? 
                document.getElementById('whiteBall1') : 
                document.getElementById('whiteBall2');
            
            if (selectedBall) {
                selectedBall.classList.add('selected');
            }
            
            const startBtn = document.getElementById('startMatchBtn');
            startBtn.disabled = false;
            startBtn.className = 'start-match-btn';
        }

        function startMatch() {
            if (!state.selectedWhitePlayer) {
                alert("Selecteer eerst wie met wit speelt!");
                return;
            }
            
            const whitePlayer = state.selectedWhitePlayer;
            
            state.player1 = { score: 0, turns: [], target: 0, beurtNummer: 1, highestSeries: 0, isWhite: false };
            state.player2 = { score: 0, turns: [], target: 0, beurtNummer: 1, highestSeries: 0, isWhite: false };
            
            state.currentMatch.originalP1 = state.currentMatch.p1;
            state.currentMatch.originalP2 = state.currentMatch.p2;
            state.currentMatch.originalTarget1 = state.currentMatch.target1;
            state.currentMatch.originalTarget2 = state.currentMatch.target2;
            
            if (whitePlayer === 2) {
                [state.currentMatch.p1, state.currentMatch.p2] = [state.currentMatch.p2, state.currentMatch.p1];
                [state.currentMatch.target1, state.currentMatch.target2] = [state.currentMatch.target2, state.currentMatch.target1];
                
                state.player1.isWhite = true;
                state.player2.isWhite = false;
                state.player1.target = state.currentMatch.target1;
                state.player2.target = state.currentMatch.target2;
                
                state.currentMatch.whitePlayer = 2;
            } else {
                state.player1.isWhite = true;
                state.player2.isWhite = false;
                state.player1.target = state.currentMatch.target1;
                state.player2.target = state.currentMatch.target2;
                state.currentMatch.whitePlayer = 1;
            }
            
            state.currentPlayer = 1;
            state.turnNumber = 1;
            state.matchEnded = false;
            state.isFirstPlayerInRound = true;
            state.pendingEnd = false;
            state.currentInput = 0;
            
            document.getElementById('matchEndedAlert').style.display = 'none';
            
            document.getElementById('matchTitle').textContent = 
                `${state.currentMatch.discipline} - Cat. ${state.currentMatch.cat}`;

            document.getElementById('homeMenuBtn').classList.remove('hidden-btn');
            document.getElementById('backBtn').classList.remove('hidden-btn');
            
            showPage(6);
            updateScoringPage();
        }

        // ==================== FILE UPLOAD ====================
        function handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const newMatchesCount = parseCSV(content);
                    saveStateToStorage();
                    alert(`✅ Succes! ${newMatchesCount} matches toegevoegd.\n\nTotaal: ${state.matches.length} matchen.`);
                    loadMatchesTabContent();
                } catch (error) {
                    alert("❌ Fout bij lezen van bestand. Zorg dat het CSV formaat correct is.\n\nFormaat per regel:\nDD/MM/YYYY,Speler1,Speler2,Target1,Target2,Discipline,Categorie");
                    console.error(error);
                }
            };
            
            if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                reader.readAsText(file);
            } else {
                alert("Alleen CSV of TXT bestanden worden ondersteund.");
            }
            
            event.target.value = '';
        }
        
        function parseCSV(csvText) {
            console.log("=== START PARSE CSV ===");
            
            // 1. BOM verwijderen
            if (csvText.charCodeAt(0) === 0xFEFF) {
                csvText = csvText.substring(1);
            }
            
            // 2. Fix encoding
            csvText = fixCSVEncoding(csvText);
            
            console.log("CSV lengte:", csvText.length);
            console.log("Eerste 200 chars:", csvText.substring(0, 200));
            
            // 3. Split in regels
            const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
            console.log("Aantal regels:", lines.length);
            
            const newMatches = [];
            let idCounter = state.matches.length > 0 ? 
                Math.max(...state.matches.map(m => m.id)) + 1 : 1;
            
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].trim();
                
                if (!line) continue;
                console.log(`Regel ${i}: "${line}"`);
                
                // 4. JOUW FORMAAT: datum;speler1;speler2;target1;target2;discipline;cat
                // Voorbeeld: "13/01/2026;COUDIJSER Jozef;LIEFOOGHE Dominique;16;14Bandstoten;4"
                
                // Split op puntkomma
                const parts = line.split(';').map(p => p.trim());
                
                console.log(`Geparsede delen (${parts.length}):`, parts);
                
                // We hebben minstens 6 delen nodig
                if (parts.length < 6) {
                    console.log(`Regel ${i} overgeslagen - te weinig delen (${parts.length})`);
                    continue;
                }
                
                try {
                    // Parse datum (DD/MM/YYYY)
                    const dateStr = parts[0];
                    let matchDate;
                    
                    if (dateStr.match(/\d{2}\/\d{2}\/\d{4}/)) {
                        const [day, month, year] = dateStr.split('/');
                        matchDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    } else {
                        // Gebruik vandaag als datum ongeldig
                        matchDate = new Date().toISOString().split('T')[0];
                    }
                    
                    // Spelers
                    const p1 = parts[1];
                    const p2 = parts[2];
                    
                    // Target 1
                    const target1 = parseInt(parts[3]) || 0;
                    
                    // Target 2 en discipline kunnen gecombineerd zijn
                    let target2 = 0;
                    let discipline = "Vrijspel";
                    let cat = 1;
                    
                    const target2Str = parts[4];
                    
                    // Check of het "14Bandstoten" formaat is
                    const match = target2Str.match(/^(\d+)([A-Za-z]+)$/);
                    if (match) {
                        target2 = parseInt(match[1]) || 0;
                        discipline = match[2];
                        cat = parseInt(parts[5]) || 1;
                    } else {
                        target2 = parseInt(target2Str) || 0;
                        discipline = parts[5] || "Vrijspel";
                        cat = parseInt(parts[6]) || 1;
                    }
                    
                    console.log(`✅ Match gevonden: ${p1} vs ${p2}, ${target1}-${target2}, ${discipline} Cat. ${cat}`);
                    
                    // Controleer of niet bestaat
                    const exists = state.matches.some(m => 
                        m.date === matchDate && 
                        m.p1 === p1 && 
                        m.p2 === p2 && 
                        m.discipline === discipline
                    );
                    
                    if (!exists) {
                        newMatches.push({
                            id: idCounter++,
                            date: matchDate,
                            p1: p1,
                            p2: p2,
                            target1: target1,
                            target2: target2,
                            discipline: discipline,
                            cat: cat,
                            completed: false,
                            whitePlayer: null,
                            p1Score: 0,
                            p2Score: 0,
                            p1Turns: [],
                            p2Turns: [],
                            p1Highest: 0,
                            p2Highest: 0
                        });
                        console.log("✅ Match toegevoegd");
                    }
                    
                } catch (error) {
                    console.error(`Fout in regel ${i}:`, error);
                }
            }
            
            if (newMatches.length > 0) {
                state.matches.push(...newMatches);
                saveStateToStorage();
                alert(`✅ ${newMatches.length} matchen geïmporteerd!`);
                loadMatchesTabContent();
            }
            
            return newMatches.length;
        }

        // ==================== DOWNLOAD FUNCTIES ====================
        function downloadAllResults() {
            const completedMatches = state.matches.filter(m => m.completed);
    
            if (completedMatches.length === 0) {
                alert("Geen voltooide matches om te downloaden.");
                return;
            }
            
            if (confirm(`Er zijn ${completedMatches.length} voltooide matches gevonden. Wilt u deze downloaden en naar gedownloade matchen verplaatsen?`)) {
                downloadMatchesAsCSV(completedMatches, 'voltooide_resultaten');
                
                completedMatches.forEach(match => {
                    state.downloadedMatches.push({
                        ...match,
                        downloadedDate: new Date().toISOString()
                    });
                });
                
                state.matches = state.matches.filter(m => !m.completed);
                
                saveStateToStorage();
                loadMatchesTabContent();
                
                alert(`✅ ${completedMatches.length} matches gedownload en naar gedownloade matchen verplaatst.`);
            }
        }

        function downloadSingleMatch(matchId) {
            const matchIndex = state.matches.findIndex(m => m.id === matchId);
            if (matchIndex !== -1 && state.matches[matchIndex].completed) {
                const match = state.matches[matchIndex];
                if (confirm(`Wilt u de match tussen ${match.p1} en ${match.p2} downloaden en naar gedownloade matchen verplaatsen?`)) {
                    downloadMatchesAsCSV([match], `match_${match.p1}_vs_${match.p2}`);
                    
                    state.downloadedMatches.push({
                        ...match,
                        downloadedDate: new Date().toISOString()
                    });
                    
                    state.matches.splice(matchIndex, 1);
                    
                    saveStateToStorage();
                    loadMatchesTabContent();
                    
                    alert(`Match gedownload en naar gedownloade matchen verplaatst.`);
                }
            }
        }

        function downloadFilteredResults() {
            const filterDate = document.getElementById('filterDate').value;
            let filteredMatches;
            
            if (filterDate) {
                filteredMatches = state.matches.filter(m => m.completed && m.date === filterDate);
            } else {
                filteredMatches = state.matches.filter(m => m.completed);
            }
            
            if (filteredMatches.length === 0) {
                alert("Geen voltooide matches gevonden voor deze filter.");
                return;
            }
            
            const dateStr = filterDate || 'alle';
            if (confirm(`Er zijn ${filteredMatches.length} voltooide matches gevonden. Wilt u deze downloaden en naar gedownloade matchen verplaatsen?`)) {
                downloadMatchesAsCSV(filteredMatches, `resultaten_${dateStr}`);
                
                filteredMatches.forEach(match => {
                    state.downloadedMatches.push({
                        ...match,
                        downloadedDate: new Date().toISOString()
                    });
                });
                
                state.matches = state.matches.filter(m => !(m.completed && (!filterDate || m.date === filterDate)));
                
                saveStateToStorage();
                loadMatchesTabContent();
                
                alert(`✅ ${filteredMatches.length} matches gedownload en naar gedownloade matchen verplaatst.`);
            }
        }

        function downloadMatchesAsCSV(matches, filename) {
            // Begin met UTF-8 BOM voor Excel compatibiliteit
            let csvContent = "\uFEFF"; // UTF-8 BOM
            
            csvContent += "Datum;Match ID;Speler 1;Speler 2;Doel 1;Doel 2;Score 1;Score 2;Winnende Speler;Discipline;Categorie;Wit Speler;Hoogste Reeks 1;Hoogste Reeks 2;Gemiddelde 1;Gemiddelde 2;Beurten 1;Beurten 2\n";

            matches.forEach(match => {
                const p1 = fixForCSVExport(match.originalP1 || match.p1);
                const p2 = fixForCSVExport(match.originalP2 || match.p2);
                const target1 = match.originalTarget1 || match.target1;
                const target2 = match.originalTarget2 || match.target2;
                const p1Score = match.p1Score || 0;
                const p2Score = match.p2Score || 0;
                
                const p1TurnsCount = match.p1Turns ? match.p1Turns.length : 0;
                const p2TurnsCount = match.p2Turns ? match.p2Turns.length : 0;
                
                const avg1 = p1TurnsCount > 0 ? 
                    (p1Score / p1TurnsCount).toFixed(2).replace('.', ',') : "0,00";
                const avg2 = p2TurnsCount > 0 ? 
                    (p2Score / p2TurnsCount).toFixed(2).replace('.', ',') : "0,00";
                
                const witSpeler = match.whitePlayer === 1 ? 
                    fixForCSVExport(match.originalP1 || match.p1) : 
                    fixForCSVExport(match.originalP2 || match.p2);
                
                const winnaar = fixForCSVExport(p1Score >= target1 ? p1 : p2);
                const discipline = fixForCSVExport(match.discipline);
                
                csvContent += `${formatDateForCSV(match.date)};${match.id};"${p1}";"${p2}";${target1};${target2};`;
                csvContent += `${p1Score};${p2Score};`;
                csvContent += `"${winnaar}";"${discipline}";${match.cat};`;
                csvContent += `"${witSpeler}";`;
                csvContent += `${match.p1Highest || 0};${match.p2Highest || 0};${avg1};${avg2};`;
                csvContent += `${p1TurnsCount};${p2TurnsCount}\n`;
            });
        
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `biljart_${filename}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // ==================== NIEUWE MATCH CREËREN ====================
        function createNewMatch() {
            showPage(9);
        }

        function setupNewMatchPage() {
            document.getElementById('newMatchTitle').textContent = 
                `Nieuwe Match - ${state.selectedGameType} - Cat. ${state.selectedCategory}`;
            
            document.getElementById('newMatchInfo').innerHTML = 
                `Maak een nieuwe match aan voor:<br>
                <strong>${formatDateDisplay(state.selectedDate)} - ${state.selectedGameType} - Categorie ${state.selectedCategory}</strong>`;
            
            state.newMatch = {
                player1: null,
                player2: null,
                target1: 0,
                target2: 0
            };
            
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
            
            const availablePlayers = state.players.filter(player => {
                return player.discipline.toLowerCase() === state.selectedGameType.toLowerCase() && 
                       player.category === state.selectedCategory;
            });
            
            if (availablePlayers.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #95a5a6;">
                        <p>Geen spelers gevonden voor ${state.selectedGameType} - Categorie ${state.selectedCategory}</p>
                        <p><small>Upload eerst spelers via het beheer menu</small></p>
                    </div>
                `;
                return;
            }
            
            availablePlayers.sort((a, b) => a.name.localeCompare(b.name));
            
            window.tempAvailablePlayers = availablePlayers;
            
            let html = '<h3 style="margin-bottom: 15px; color: #ecf0f1;">Beschikbare spelers:</h3>';
            html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">';
            
            availablePlayers.forEach((player, index) => {
                const isSelected = (state.newMatch.player1 && state.newMatch.player1.name === player.name) ||
                                 (state.newMatch.player2 && state.newMatch.player2.name === player.name);
                
                html += `
                    <div class="player-select-box ${isSelected ? 'selected' : ''}" 
                         onclick="selectAvailablePlayerByIndex(${index})"
                         style="${isSelected ? 'opacity: 0.6; cursor: not-allowed;' : ''}">
                        <h3>${player.name}</h3>
                        <p>Categorie: ${player.category}</p>
                        <p>Standaard target: ${player.target}</p>
                        ${isSelected ? '<p style="color: #e74c3c; margin-top: 5px;">✓ Al geselecteerd</p>' : ''}
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
        }

        function selectAvailablePlayerByIndex(playerIndex) {
            const availablePlayers = window.tempAvailablePlayers || state.players.filter(player => 
                player.discipline.toLowerCase() === state.selectedGameType.toLowerCase() && 
                player.category === state.selectedCategory
            );
            
            if (playerIndex < 0 || playerIndex >= availablePlayers.length) return;
            
            const player = availablePlayers[playerIndex];
            
            let selectedPlayerNum = null;
            if (!state.newMatch.player1) {
                selectedPlayerNum = 1;
            } else if (!state.newMatch.player2 && state.newMatch.player1.name !== player.name) {
                selectedPlayerNum = 2;
            } else {
                alert("Speler is al geselecteerd of beide spelers zijn al geselecteerd.");
                return;
            }
            
            if (selectedPlayerNum === 1) {
                state.newMatch.player1 = player;
                state.newMatch.target1 = player.target;
                
                document.getElementById('player1Name').textContent = player.name;
                document.getElementById('player1Details').innerHTML = `
                    Categorie: ${player.category}<br>
                    Discipline: ${player.discipline}
                `;
                document.getElementById('player1Target').value = player.target;
                document.getElementById('player1Box').classList.add('selected');
            } else {
                state.newMatch.player2 = player;
                state.newMatch.target2 = player.target;
                
                document.getElementById('player2Name').textContent = player.name;
                document.getElementById('player2Details').innerHTML = `
                    Categorie: ${player.category}<br>
                    Discipline: ${player.discipline}
                `;
                document.getElementById('player2Target').value = player.target;
                document.getElementById('player2Box').classList.add('selected');
            }
            
            displayAvailablePlayers();
            validateTargets();
        }

        function selectPlayerForNewMatch(playerNum) {
            if (playerNum === 1 && state.newMatch.player1) {
                document.getElementById('player1Target').focus();
                document.getElementById('player1Target').select();
            } else if (playerNum === 2 && state.newMatch.player2) {
                document.getElementById('player2Target').focus();
                document.getElementById('player2Target').select();
            } else {
                document.getElementById('availablePlayers').scrollIntoView({ behavior: 'smooth' });
            }
        }

        function validateTargets() {
            const target1Input = document.getElementById('player1Target');
            const target2Input = document.getElementById('player2Target');
            
            state.newMatch.target1 = parseInt(target1Input.value) || 0;
            state.newMatch.target2 = parseInt(target2Input.value) || 0;
            
            if (target1Input.value) {
                const val = parseInt(target1Input.value);
                if (val < 1) target1Input.value = 1;
                if (val > 200) target1Input.value = 200;
                state.newMatch.target1 = parseInt(target1Input.value);
            }
            
            if (target2Input.value) {
                const val = parseInt(target2Input.value);
                if (val < 1) target2Input.value = 1;
                if (val > 200) target2Input.value = 200;
                state.newMatch.target2 = parseInt(target2Input.value);
            }
            
            const canCreate = state.newMatch.player1 && 
                            state.newMatch.player2 && 
                            state.newMatch.target1 > 0 && 
                            state.newMatch.target2 > 0 &&
                            state.newMatch.player1.name !== state.newMatch.player2.name;
            
            const createBtn = document.getElementById('createMatchBtn');
            createBtn.disabled = !canCreate;
            createBtn.style.backgroundColor = canCreate ? '#2ecc71' : '#7f8c8d';
        }

        function createManualMatch() {
            if (!state.newMatch.player1 || !state.newMatch.player2) {
                alert("Selecteer eerst beide spelers!");
                return;
            }
            
            if (state.newMatch.player1.name === state.newMatch.player2.name) {
                alert("Kies twee verschillende spelers!");
                return;
            }
            
            if (state.newMatch.target1 <= 0 || state.newMatch.target2 <= 0) {
                alert("Vul geldige target punten in!");
                return;
            }
            
            const newId = state.matches.length > 0 ? Math.max(...state.matches.map(m => m.id)) + 1 : 1;
            
            const newMatch = {
                id: newId,
                date: state.selectedDate,
                p1: state.newMatch.player1.name,
                p2: state.newMatch.player2.name,
                target1: state.newMatch.target1,
                target2: state.newMatch.target2,
                discipline: state.selectedGameType,
                cat: state.selectedCategory,
                completed: false,
                whitePlayer: null,
                p1Score: 0,
                p2Score: 0,
                p1Turns: [],
                p2Turns: [],
                p1Highest: 0,
                p2Highest: 0
            };
            
            state.matches.push(newMatch);
            saveStateToStorage();
            
            alert(`✅ Nieuwe match aangemaakt:\n${state.newMatch.player1.name} vs ${state.newMatch.player2.name}\nTargets: ${state.newMatch.target1} - ${state.newMatch.target2}`);
            
            showPage(4);
        }

        // ==================== SCORING FUNCTIES ====================
        function changeScore(delta) {
            state.currentInput = Math.max(0, state.currentInput + delta);
            updateCurrentScoreDisplay();
            updateDynamicNeededDisplay();
        }

        function updateCurrentScoreDisplay() {
            document.getElementById('currentScore').textContent = state.currentInput;
        }

        function updateDynamicNeededDisplay() {
            document.querySelectorAll('.dynamic-needed').forEach(el => el.remove());
            
            const player = state.currentPlayer === 1 ? state.player1 : state.player2;
            const target = state.currentPlayer === 1 ? state.player1.target : state.player2.target;
            const dynamicNeeded = Math.max(0, target - player.score - state.currentInput);
            
            if (dynamicNeeded <= 5 && dynamicNeeded > 0) {
                const playerCard = state.currentPlayer === 1 ? 
                    document.getElementById('player1Card') : 
                    document.getElementById('player2Card');
                
                const dynamicDisplay = document.createElement('div');
                dynamicDisplay.className = 'dynamic-needed';
                dynamicDisplay.innerHTML = `🎯 Nog ${dynamicNeeded} punt${dynamicNeeded !== 1 ? 'en' : ''} nodig`;
                
                if (dynamicNeeded <= 3) {
                    dynamicDisplay.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                    dynamicDisplay.innerHTML = `🔥 Nog ${dynamicNeeded} punt${dynamicNeeded !== 1 ? 'en' : ''} nodig!`;
                }
                
                playerCard.appendChild(dynamicDisplay);
            }
            
            updateStaticNeededValues();
        }

        function updateStaticNeededValues() {
            const needed1 = Math.max(0, state.player1.target - state.player1.score - 
                (state.currentPlayer === 1 ? state.currentInput : 0));
            const statValue1 = document.querySelector('#player1Card .stat-item:nth-child(5) .stat-value');
            if (statValue1) {
                statValue1.textContent = needed1;
                if (needed1 <= 5 && needed1 > 0) {
                    statValue1.style.color = '#e74c3c';
                    statValue1.style.fontWeight = 'bold';
                } else {
                    statValue1.style.color = '';
                    statValue1.style.fontWeight = '';
                }
            }
            
            const needed2 = Math.max(0, state.player2.target - state.player2.score - 
                (state.currentPlayer === 2 ? state.currentInput : 0));
            const statValue2 = document.querySelector('#player2Card .stat-item:nth-child(5) .stat-value');
            if (statValue2) {
                statValue2.textContent = needed2;
                if (needed2 <= 5 && needed2 > 0) {
                    statValue2.style.color = '#e74c3c';
                    statValue2.style.fontWeight = 'bold';
                } else {
                    statValue2.style.color = '';
                    statValue2.style.fontWeight = '';
                }
            }
        }

        function addScore() {
            if (state.matchEnded) {
                alert("Match is afgelopen! Klik op hoofdmenu om nieuwe match te spelen");
                return;
            }
            
            const score = state.currentInput;
            const player = state.currentPlayer === 1 ? state.player1 : state.player2;
            
            player.score += score;
            player.turns.push(score);
            
            if (score > player.highestSeries) {
                player.highestSeries = score;
            }
            
            player.beurtNummer++;
            
            // VERBERG MENU KNOPPEN NA EERSTE SCORE - NIEUWE CODE
            const totalTurns = state.player1.turns.length + state.player2.turns.length;
            if (totalTurns === 1) {
                document.getElementById('homeMenuBtn').style.display = 'none';
                document.getElementById('backBtn').style.display = 'none';
                console.log("✅ Menu knoppen verborgen na eerste score");
            }
            // EINDE NIEUWE CODE
            
            const targetReached = player.score >= (state.currentPlayer === 1 ? state.player1.target : state.player2.target);
            
            if (targetReached) {
                if (state.currentPlayer === 1) {
                    if (state.isFirstPlayerInRound) {
                        state.currentPlayer = 2;
                        state.isFirstPlayerInRound = false;
                        state.pendingEnd = true;
                    } else {
                        endMatch();
                    }
                } else {
                    endMatch();
                }
            } else {
                if (state.pendingEnd) {
                    endMatch();
                } else {
                    if (state.isFirstPlayerInRound) {
                        state.currentPlayer = 2;
                        state.isFirstPlayerInRound = false;
                    } else {
                        state.currentPlayer = 1;
                        state.isFirstPlayerInRound = true;
                        state.turnNumber++;
                    }
                }
            }
            
            state.currentInput = 0;
            updateCurrentScoreDisplay();
            document.querySelectorAll('.dynamic-needed').forEach(el => el.remove());
            updateScoringPage();
        }

        function recalculateHighestSeries(player) {
            if (player.turns.length === 0) {
                player.highestSeries = 0;
                return;
            }
            player.highestSeries = Math.max(...player.turns);
        }

        function endMatch() {
            state.matchEnded = true;
            state.currentMatch.completed = true;
        
            const originalP1 = state.currentMatch.originalP1;
            const originalP2 = state.currentMatch.originalP2;
            const originalTarget1 = state.currentMatch.originalTarget1;
            const originalTarget2 = state.currentMatch.originalTarget2;
        
            let finalScore1, finalScore2;
            
            if (state.currentMatch.whitePlayer === 1) {
                finalScore1 = state.player1.score;
                finalScore2 = state.player2.score;
            } else {
                finalScore1 = state.player2.score;
                finalScore2 = state.player1.score;
            }
            
            const winnerName = finalScore1 >= originalTarget1 ? originalP1 : originalP2;
            
            state.currentMatch.p1Score = finalScore1;
            state.currentMatch.p2Score = finalScore2;
            
            if (state.currentMatch.whitePlayer === 1) {
                state.currentMatch.p1Turns = [...state.player1.turns];
                state.currentMatch.p2Turns = [...state.player2.turns];
                state.currentMatch.p1Highest = state.player1.highestSeries;
                state.currentMatch.p2Highest = state.player2.highestSeries;
            } else {
                state.currentMatch.p1Turns = [...state.player2.turns];
                state.currentMatch.p2Turns = [...state.player1.turns];
                state.currentMatch.p1Highest = state.player2.highestSeries;
                state.currentMatch.p2Highest = state.player1.highestSeries;
            }

            document.getElementById('homeMenuBtn').style.display = 'block';
        
            saveStateToStorage();
            
            const matchEndedAlert = document.getElementById('matchEndedAlert');
            matchEndedAlert.style.display = 'block';
            matchEndedAlert.textContent = `🏁 MATCH AFGELOPEN! Winnaar: ${winnerName}`;
        
            document.querySelectorAll('.dynamic-needed').forEach(el => el.remove());
            updateScoringPage();
        }
        
        function undoLast() {
            if (!confirm("Weet je zeker dat je de laatste beurt ongedaan wilt maken?")) {
                return;
            }
            
            document.querySelectorAll('.dynamic-needed').forEach(el => el.remove());
            
            const player1Turns = state.player1.turns.length;
            const player2Turns = state.player2.turns.length;
            
            if (player1Turns === 0 && player2Turns === 0) {
                alert("Geen beurten om ongedaan te maken");
                return;
            }
            
            let lastPlayer;
            if (player1Turns > player2Turns) {
                lastPlayer = 1;
            } else if (player2Turns > player1Turns) {
                lastPlayer = 2;
            } else {
                lastPlayer = state.currentPlayer;
            }
            
            const player = lastPlayer === 1 ? state.player1 : state.player2;
            
            const lastScore = player.turns.pop();
            player.score -= lastScore;
            player.beurtNummer--;
            
            recalculateHighestSeries(player);
            state.currentPlayer = lastPlayer;
            
            if (player1Turns === player2Turns) {
                state.currentPlayer = 1;
                state.isFirstPlayerInRound = true;
            } else if (player1Turns > player2Turns) {
                state.currentPlayer = 2;
                state.isFirstPlayerInRound = false;
            } else {
                state.currentPlayer = 1;
                state.isFirstPlayerInRound = true;
            }
            
            state.matchEnded = false;
            state.pendingEnd = false;
            state.currentInput = 0;
            
            if (state.currentMatch) {
                state.currentMatch.completed = false;
                delete state.currentMatch.p1Score;
                delete state.currentMatch.p2Score;
            }
            
            document.getElementById('matchEndedAlert').style.display = 'none';
            updateScoringPage();
        }

        function updateScoringPage() {
            const player1Card = document.getElementById('player1Card');
            const player2Card = document.getElementById('player2Card');
            
            const currentName = state.currentPlayer === 1 ? state.currentMatch.p1 : state.currentMatch.p2;
            const btnNameElement = document.getElementById('currentPlayerBtnName');
            if (btnNameElement) {
                btnNameElement.textContent = currentName;
            }
            
            player1Card.className = state.player1.isWhite ? 
                'player-card player-white' : 'player-card player-yellow';
            player2Card.className = state.player2.isWhite ? 
                'player-card player-white' : 'player-card player-yellow';
            
            if (state.currentPlayer === 1) {
                player1Card.classList.add('player-active');
                player2Card.classList.add('player-inactive');
            } else {
                player1Card.classList.add('player-inactive');
                player2Card.classList.add('player-active');
            }
            
            const avg1 = state.player1.turns.length > 0 ? 
                (state.player1.score / state.player1.turns.length).toFixed(2) : '0.00';
            const avg2 = state.player2.turns.length > 0 ? 
                (state.player2.score / state.player2.turns.length).toFixed(2) : '0.00';
            const needed1 = Math.max(0, state.player1.target - state.player1.score);
            const needed2 = Math.max(0, state.player2.target - state.player2.score);
            
            const player1TurnsReversed = [...state.player1.turns].reverse();
            const player2TurnsReversed = [...state.player2.turns].reverse();
            
            player1Card.innerHTML = `
                <div>
                    <h3>${state.currentMatch.p1} ${state.player1.isWhite ? '⚪' : '🟡'}</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-icon">🏁</div>
                            <div>Doel:</div>
                            <div class="stat-value">${state.player1.target}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">📊</div>
                            <div>Huidig:</div>
                            <div class="stat-value">${state.player1.score}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">🔢</div>
                            <div>Beurten:</div>
                            <div class="stat-value">${state.player1.turns.length}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">📈</div>
                            <div>Gemiddelde:</div>
                            <div class="stat-value">${avg1}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">🎯</div>
                            <div>Nog nodig:</div>
                            <div class="stat-value">${needed1}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">⭐</div>
                            <div>Hoogste reeks:</div>
                            <div class="stat-value">${state.player1.highestSeries}</div>
                        </div>
                    </div>
                </div>
                <div class="turns-scroll-container">
                    <div class="turns-list">
                        ${player1TurnsReversed.map((turn, index) => {
                            const beurtNummer = state.player1.turns.length - index;
                            return `
                                <div class="turn-row">
                                    <span>Beurt ${beurtNummer}:</span>
                                    <span>${turn} punt${turn !== 1 ? 'en' : ''}</span>
                                </div>
                            `;
                        }).join('')}
                        ${state.player1.turns.length === 0 ? 
                            '<div style="text-align: center; color: #666; padding: 10px; font-size: 0.9em;">Geen beurten</div>' : 
                            ''}
                    </div>
                </div>
            `;
            
            player2Card.innerHTML = `
                <div>
                    <h3>${state.currentMatch.p2} ${state.player2.isWhite ? '⚪' : '🟡'}</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-icon">🏁</div>
                            <div>Doel:</div>
                            <div class="stat-value">${state.player2.target}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">📊</div>
                            <div>Huidig:</div>
                            <div class="stat-value">${state.player2.score}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">🔢</div>
                            <div>Beurten:</div>
                            <div class="stat-value">${state.player2.turns.length}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">📈</div>
                            <div>Gemiddelde:</div>
                            <div class="stat-value">${avg2}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">🎯</div>
                            <div>Nog nodig:</div>
                            <div class="stat-value">${needed2}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">⭐</div>
                            <div>Hoogste reeks:</div>
                            <div class="stat-value">${state.player2.highestSeries}</div>
                        </div>
                    </div>
                </div>
                <div class="turns-scroll-container">
                    <div class="turns-list">
                        ${player2TurnsReversed.map((turn, index) => {
                            const beurtNummer = state.player2.turns.length - index;
                            return `
                                <div class="turn-row">
                                    <span>Beurt ${beurtNummer}:</span>
                                    <span>${turn} punt${turn !== 1 ? 'en' : ''}</span>
                                </div>
                            `;
                        }).join('')}
                        ${state.player2.turns.length === 0 ? 
                            '<div style="text-align: center; color: #666; padding: 10px; font-size: 0.9em;">Geen beurten</div>' : 
                            ''}
                    </div>
                </div>
            `;
            
            const currentColor = (state.currentPlayer === 1 && state.player1.isWhite) || 
                               (state.currentPlayer === 2 && state.player2.isWhite) ? 'Wit' : 'Geel';
            const currentBeurtNummer = state.currentPlayer === 1 ? state.player1.beurtNummer : state.player2.beurtNummer;
            
            document.getElementById('currentPlayerDisplay').innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px; font-size: 1.1em;">
                    Beurt ${currentBeurtNummer} voor ${currentName}
                </div>
                <div style="margin: 8px 0;">
                    <span style="background: ${currentColor === 'Wit' ? 'white' : '#f1c40f'}; 
                              color: ${currentColor === 'Wit' ? 'black' : 'black'}; 
                              padding: 6px 15px; 
                              border-radius: 20px; 
                              font-size: 0.9em;
                              font-weight: bold;">
                        ${currentColor}
                    </span>
                </div>
                ${state.pendingEnd ? 
                    '<div style="margin-top: 18px; color: #e74c3c; font-size: 0.8em; font-weight: bold;">⏱️ Nabeurt! Leg de ballen klaar voor opzet</div>' : 
                    ''}
            `;
            
            updateDynamicNeededDisplay();
        }

        // ==================== SELECT MATCH ====================
        function selectMatch(matchId) {
            const match = state.matches.find(m => m.id === matchId);
            if (match && match.completed) {
                alert("Deze match is al afgerond. Kies een andere match.");
                return;
            }
            
            state.currentMatch = match;
            state.selectedWhitePlayer = null;
            
            document.getElementById('matchTitleSelect').textContent = `${match.discipline} - Cat. ${match.cat}`;
            
            showPage(5);
        }

        // ==================== INITIALISATIE ====================
        window.onload = function() {
            loadStateFromStorage();
            
            if (!localStorage.getItem('biljartAdminPassword')) {
                setAdminPassword(DEFAULT_PASSWORD);
            }
            
            const dateInput = document.getElementById('dateSelect');
            if (dateInput) {
                dateInput.value = state.selectedDate;
                dateInput.addEventListener('change', function() {
                    state.selectedDate = this.value;
                });
                dateInput.addEventListener('input', function() {
                    state.selectedDate = this.value;
                });
            }
            
            initSwipeProtection();
            
            const passwordField = document.getElementById('adminPassword');
            if (passwordField) {
                passwordField.addEventListener('keypress', function(event) {
                    if (event.key === 'Enter') {
                        checkPassword();
                    }
                });
            }
            
            updateCurrentScoreDisplay();
        };
