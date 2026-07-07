// js/competition.js
// =========================================================================
// BLOK 1: CONFIGURATIE (Uit Excel "Algemene info")
// =========================================================================
const COMPETITION_CONFIG = {
    'Vrijspel': {
        targetPoints: 20,
        targetTurns: 20,
        minScore: -5
    },
    'Bandstoten': {
        targetPoints: 15,
        targetTurns: 20,
        minScore: -5
    },
    'Driebanden': {
        targetPoints: 13,
        targetTurns: 40,
        minScore: -5
    },
    'Dames': {
        targetPoints: 20,
        targetTurns: 20,
        minScore: -5,
        isDames: true  // ✅ Markering voor 3/2/1 systeem
    }
};


// =========================================================================
// BLOK 2: BEREKENINGEN
// =========================================================================

/**
 * Berekent de competitiepunten voor één speler in één match.
 * Volgt exact de Excel VBA logica (VBA Int() = JS Math.floor()).
 */
window.calculateCompetitionPoints = function(score, beurten, targetPoints, targetTurns, isDames = false, won = false, isDraw = false) {
    const MIN_SCORE = -5;
    
    // ✅ Dames: 3/2/1 systeem
    if (isDames) {
        if (won) return 3;      // Winnaar
        if (isDraw) return 2;   // Gelijkspel
        return 1;               // Verliezer
    }
    
    // Normale berekening voor andere disciplines
    if (beurten <= 0) return MIN_SCORE;
    
    if (score < targetPoints) {
        // ❌ Target NIET gehaald: projectie-formule
        const actualAvg = score / beurten;
        if (actualAvg === 0) return MIN_SCORE;
        const projectedTurns = targetPoints / actualAvg;
        const raw = targetTurns - projectedTurns;
        return Math.max(Math.floor(raw), MIN_SCORE);
    } else {
        // ✅ Target gehaald: simpele aftrekking
        const raw = targetTurns - beurten;
        return Math.max(Math.floor(raw), MIN_SCORE);
    }
};

/**
 * Berekent de algemene statistieken voor een speler op basis van alle gespeelde matches.
 */
window.calculatePlayerStats = function(playerId, playerName, discipline, category) {
    // Filter matches voor deze speler in deze discipline/categorie
    const playerMatches = state.matches.filter(m => 
        m.completed && 
        m.discipline === discipline && 
        m.cat === category &&
        (m.p1_club_id === playerId || m.p2_club_id === playerId)
    );

    let totalCompPoints = 0;
    let totalPointsScored = 0;
    let totalTurnsPlayed = 0;
    let highestSeries = 0;
    let matchesPlayed = 0;
    let matchesWon = 0;

    playerMatches.forEach(match => {
        const isP1 = match.p1_club_id === playerId;
        const points = isP1 ? match.p1Score : match.p2Score;
        const turns = isP1 ? match.p1Turns.length : match.p2Turns.length;
        const hr = isP1 ? match.p1Highest : match.p2Highest;
        const won = match.winner === (isP1 ? match.p1 : match.p2);

        // Bereken competitiepunten voor deze match
        // Haal persoonlijk target van de speler op (fallback: 100)
        const playerTarget = state.players.find(p => p.id === playerId)?.target || 100;
        // Bepaal targetTurns per discipline
        const targetTurns = discipline === 'Driebanden' ? 40 : 20;
        // Bereken competitiepunten met persoonlijke target
        const compPoints = window.calculateCompetitionPoints(points, turns, playerTarget, targetTurns);

        totalCompPoints += compPoints;
        totalPointsScored += points;
        totalTurnsPlayed += turns;
        if (hr > highestSeries) highestSeries = hr;
        matchesPlayed++;
        if (won) matchesWon++;
    });

    // Bereken algemeen gemiddelde
    const average = totalTurnsPlayed > 0 ? totalPointsScored / totalTurnsPlayed : 0;
    
    // Zoek TSG van de speler in state.players
    const playerData = state.players.find(p => p.id === playerId);
    let tsg = 0;
    if (playerData && playerData.tsg) {
        // TSG is opgeslagen als string met komma ("1,050"), omzetten naar float
        tsg = parseFloat(playerData.tsg.replace(',', '.'));
    }
    
    // Coëfficiënt: gespeeld gemiddelde / TSG
    const coefficient = tsg > 0 ? average / tsg : 0;

    // Bereken TSGVS (Te Spelen Gemiddelde Volgend Seizoen)
    const playerInfo = state.players.find(p => p.id === playerId);
    const mode = playerInfo?.mode || 'max -10%';
    let tsgvs;
    
    if (matchesPlayed === 0) {
        // Niet gespeeld: blijft gelijk aan TSG
        tsgvs = tsg;
    } else if (mode.startsWith('k')) {
        // "kan niet verminderen"
        tsgvs = average < tsg ? tsg : average;
    } else {
        // "max -10%"
        tsgvs = average < (tsg * 0.9) ? (tsg * 0.9) : average;
    }
    
    // Bereken PTNVS (Punten Volgend Seizoen)
    const targetTurns = discipline === 'Driebanden' ? 40 : 20;
    const ptnvs = Math.ceil(tsgvs * targetTurns);
    
    return {
        id: playerId,
        name: playerName,
        discipline: discipline,
        category: category,
        matchesPlayed: matchesPlayed,
        matchesWon: matchesWon,
        totalPointsScored: totalPointsScored,
        totalTurnsPlayed: totalTurnsPlayed,
        average: average,
        highestSeries: highestSeries,
        totalCompPoints: totalCompPoints,
        coefficient: coefficient,
        tsg: tsg,
        tsgvs: tsgvs,
        ptnvs: ptnvs,
        mode: mode
    };
};

// =========================================================================
// BLOK 3: UI - LEADERBOARD (KLASSEMENT)
// =========================================================================

let currentCompDiscipline = null;
let currentCompCategory = null;

// Hulpfuncties voor de knoppen
window.loadLeaderboard = function(discipline) {
    currentCompDiscipline = discipline;
    document.querySelectorAll('#page20 .selection-option').forEach(o => o.classList.remove('selected'));
    document.getElementById(`compDisc${discipline === 'Vrijspel' ? 'VS' : discipline === 'Bandstoten' ? 'BS' : 'DB'}`).classList.add('selected');
    if (currentCompCategory) renderCompetitionLeaderboard();
};

window.loadLeaderboardCategory = function(category) {
    currentCompCategory = category;
    document.querySelectorAll('#page20 .category-option').forEach(o => o.classList.remove('selected'));
    document.getElementById(`compCat${category}`).classList.add('selected');
    if (currentCompDiscipline) renderCompetitionLeaderboard();
};

/**
 * Genereert en toont het klassement op Pagina 20
 */
window.renderCompetitionLeaderboard = function() {
    currentCompDiscipline = document.getElementById('compDisc').value;
    currentCompCategory = parseInt(document.getElementById('compCat').value);
    if (!currentCompDiscipline || !currentCompCategory) return;

    const container = document.getElementById('competitionLeaderboard');
    // ✅ FIX: filter matches zonder players-array weg (lokale matches hebben een ander
    // formaat dan de API-matches en lieten calculatePlayerStatsFromAPI crashen)
    const allMatchesRaw = state.completedMatches && state.completedMatches.length > 0 ? state.completedMatches : state.matches.filter(m => m.completed);
    const allMatches = allMatchesRaw.filter(m => m && Array.isArray(m.players));
    
    // 1. Filter spelers
    const players = state.players.filter(p => p.discipline === currentCompDiscipline && p.category === currentCompCategory);
    
    if (players.length === 0) {
        container.innerHTML = `<div class="no-matches"><p>Geen spelers gevonden voor ${currentCompDiscipline} - Categorie ${currentCompCategory}</p></div>`;
        return;
    }

    // 2. Bereken stats voor elke speler
    let leaderboard = players.map(p => calculatePlayerStatsFromAPI(p.id, p.name, currentCompDiscipline, currentCompCategory, allMatches));

    // 3. Sorteer (Tie-breakers: 1. Comp Punten, 2. Coëfficiënt, 3. Hoogste Reeks)
    leaderboard.sort((a, b) => {
        if (b.totalCompPoints !== a.totalCompPoints) return b.totalCompPoints - a.totalCompPoints;
        if (b.coefficient !== a.coefficient) return b.coefficient - a.coefficient;
        return b.highestSeries - a.highestSeries;
    });

    // 4. Bouw de HTML tabel
    let html = `<div class="matches-list-title">🏆 Klassement: ${currentCompDiscipline} - Categorie ${currentCompCategory}</div>`;
    html += `<table class="competition-table">
        <thead>
            <tr>
                <th>nr</th>
                <th>NAAM</th>
                <th>GSM</th>
                <th>TSG</th>
                <th>PTN</th>
                <th>BRTN</th>
                <th>GGEM</th>
                <th>MPTN</th>
                <th>HR</th>
                <th>TSGVS</th>
                <th>PTNVS</th>
                <th>Mode</th>
            </tr>
        </thead>
        <tbody>`;

    leaderboard.forEach((p, index) => {
        const rank = index + 1;
        let rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
        
        // Kleur voor MPTN (Competitiepunten)
        let mptnClass = p.totalCompPoints > 0 ? 'comp-pts-positive' : p.totalCompPoints < 0 ? 'comp-pts-negative' : 'comp-pts-zero';
        let mptnText = p.totalCompPoints > 0 ? `+${p.totalCompPoints}` : p.totalCompPoints;

        html += `<tr class="${rankClass}">
            <td>${rank}</td>
            <td>${p.name}</td>
            <td>${p.matchesPlayed}</td>
            <td>${p.tsg.toFixed(3).replace('.', ',')}</td>
            <td class="${p.totalPointsScored >= p.ptnvs ? 'pts-met-doel' : 'pts-onder-doel'}">${p.totalPointsScored}</td>
            <td>${p.totalTurnsPlayed}</td>
            <td>${p.average.toFixed(3).replace('.', ',')}</td>
            <td class="${mptnClass}">${mptnText}</td>
            <td>${p.highestSeries}</td>
            <td>${p.tsgvs.toFixed(3).replace('.', ',')}</td>
            <td>${p.ptnvs}</td>
            <td>${p.mode}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
};


// =========================================================================
// BLOK 4: UI - KRUISTABEL
// =========================================================================

let currentCrossDiscipline = null;
let currentCrossCategory = null;

// Hulpfuncties voor de knoppen
window.loadCrossTable = function(discipline) {
    currentCrossDiscipline = discipline;
    document.querySelectorAll('#page21 .selection-option').forEach(o => o.classList.remove('selected'));
    document.getElementById(`crossDisc${discipline === 'Vrijspel' ? 'VS' : discipline === 'Bandstoten' ? 'BS' : 'DB'}`).classList.add('selected');
    if (currentCrossCategory) renderCrossTable();
};

window.loadCrossTableCategory = function(category) {
    currentCrossCategory = category;
    document.querySelectorAll('#page21 .category-option').forEach(o => o.classList.remove('selected'));
    document.getElementById(`crossCat${category}`).classList.add('selected');
    if (currentCrossDiscipline) renderCrossTable();
};

/**
 * Genereert de volledige kruistabel met correcte 2x2 blokken en TOT structuur
 */
window.renderCrossTable = function() {
    currentCrossDiscipline = document.getElementById('compDisc').value;
    currentCrossCategory = parseInt(document.getElementById('compCat').value);
    if (!currentCrossDiscipline || !currentCrossCategory) return;

    const container = document.getElementById('crossTableContainer');
    // ✅ FIX: zelfde beveiliging als bij de rangschikking
    const allMatchesRaw = state.completedMatches && state.completedMatches.length > 0 ? state.completedMatches : state.matches.filter(m => m.completed);
    const allMatches = allMatchesRaw.filter(m => m && Array.isArray(m.players));
        
    // Hulpfunctie: "Wouter BOEDTS" wordt "W. BOEDTS"
    const formatShortName = (fullName) => {
        const parts = fullName.trim().split(' ');
        if (parts.length < 2) return fullName;
        const voorletter = parts[0].charAt(0).toUpperCase();
        const achternaam = parts.slice(1).join(' ');
        return `${voorletter}. ${achternaam}`;
    };
    
    // 1. Filter spelers
    const players = state.players.filter(p => p.discipline === currentCrossDiscipline && p.category === currentCrossCategory);
    
    if (players.length === 0) {
        container.innerHTML = `<div class="no-matches"><p>Geen spelers gevonden voor ${currentCrossDiscipline} - Categorie ${currentCrossCategory}</p></div>`;
        return;
    }

    // Sorteer spelers op naam
    players.sort((a, b) => a.name.localeCompare(b.name));

    // 2. Bereken stats voor elke speler (voor TOT kolommen)
    const playerStats = players.map(p => calculatePlayerStatsFromAPI(p.id, p.name, currentCrossDiscipline, currentCrossCategory, allMatches));

    // 3. Bouw de kruistabel
    let html = `<div class="matches-list-title">📊 Kruistabel: ${currentCrossDiscipline} - Categorie ${currentCrossCategory}</div>`;
    html += `<div style="overflow-x: auto;"><table class="cross-table"><thead>`;
    
    // HEADER RIJ 1: Nummers + TOT
    html += `<tr><th rowspan="3">Nr</th><th rowspan="3">Naam + Coëff.</th>`;
    players.forEach((p, idx) => {
        html += `<th colspan="2">${idx + 1}</th>`;
    });
    html += `<th colspan="5" class="tot-header">TOT</th></tr>`;
    
    // HEADER RIJ 2: Persoonlijke Targets + TOT labels (Pt, Gem)
    html += `<tr>`;
    players.forEach(p => {
        // ✅ FIX: Gebruik het persoonlijke target van de speler (p.target)
        html += `<th colspan="2">${p.target}</th>`;
    });
    html += `<th class="tot-sub">Pt</th><th class="tot-sub" colspan="2">Gem</th><th colspan="2"></th></tr>`;
    
    // HEADER RIJ 3: Coëfficiënten + TOT labels (Bt, MP, HR)
    html += `<tr>`;
    players.forEach(p => {
        const playerData = state.players.find(sp => sp.id === p.id);
        const coef = playerData && playerData.tsg ? parseFloat(playerData.tsg.replace(',', '.')) : 0;
        html += `<th colspan="2">${coef.toFixed(4).replace('.', ',')}</th>`;
    });
    html += `<th class="tot-sub">Bt</th><th class="tot-sub">MP</th><th class="tot-sub">HR</th><th colspan="2"></th></tr>`;
    
    html += `</thead><tbody>`;

    // 4. BODY: Per speler 2 rijen
    players.forEach((player1, rowIndex) => {
        const stats = playerStats[rowIndex];
        const playerData = state.players.find(sp => sp.id === player1.id);
        const coef = playerData && playerData.tsg ? parseFloat(playerData.tsg.replace(',', '.')) : 0;
        
        // --- RIJ 1: Nr + Naam + Punten/Gemiddelde + TOT (Pt, Gem) ---
        // Bepaal of dit een even of oneven speler is voor de zebra-kleur
        const rowClass = rowIndex % 2 === 0 ? 'row-even' : 'row-odd';

        // --- RIJ 1: Nr + Naam + Punten/Gemiddelde + TOT (Pt, Gem) ---
        html += `<tr class="${rowClass}">`;
        html += `<td class="player-nr" rowspan="2">${rowIndex + 1}</td>`;
        html += `<td class="player-name">${formatShortName(player1.name)}</td>`;
        
        players.forEach((player2, colIndex) => {
            if (rowIndex === colIndex) {
                // Eigen cel (diagonaal) - beslaat 2x2
                html += `<td class="self-cell" rowspan="2" colspan="2"></td>`;
            } else {
                const match = allMatches.find(m => {
                    const isCorrectDiscipline = m.discipline === currentCrossDiscipline;
                    const isCorrectCategory = String(m.category) === String(currentCrossCategory);
                    const isCorrectPlayers = m.players.some(p => String(p.club_id) === String(player1.id)) &&
                                             m.players.some(p => String(p.club_id) === String(player2.id));
                    return isCorrectDiscipline && isCorrectCategory && isCorrectPlayers;
                });

                if (match) {
                    const playerData = match.players.find(p => String(p.club_id) === String(player1.id));
                    const points = playerData.score;
                    const turns = playerData.beurten;
                    const average = turns > 0 ? (points / turns).toFixed(2).replace('.', ',') : '0,00';
                    
                    html += `<td class="match-pts">${points}</td>`;
                    html += `<td class="match-avg">${average}</td>`;
                } else {
                    // Niet gespeeld - beslaat 2 kolommen in deze rij
                    html += `<td class="not-played" colspan="2"></td>`;
                }
            }
        });
        
        // TOT kolommen voor Rij 1 (Pt en Gem)
        html += `<td class="tot-pts">${stats.totalPointsScored}</td>`;
        html += `<td class="tot-avg" colspan="2">${stats.average.toFixed(3).replace('.', ',')}</td>`;
        html += `<td colspan="2"></td>`;
        html += `</tr>`;
        

        // --- RIJ 2: Coëfficiënt + Beurten/Comp.Punten + TOT (Bt, MP, HR) ---
        html += `<tr class="${rowClass}">`;
        // Nr heeft al rowspan=2, dus die slaan we over
        // ✅ FIX: Gebruik de berekende coëfficiënt uit de stats (Gespeeld Gem / TSG)
        html += `<td class="player-coef">${stats.coefficient.toFixed(4).replace('.', ',')}</td>`;
        
        players.forEach((player2, colIndex) => {
            if (rowIndex === colIndex) {
                // Eigen cel - al gedaan in Rij 1 met rowspan, dus niets doen
            } else {
                const match = allMatches.find(m => {
                    const isCorrectDiscipline = m.discipline === currentCrossDiscipline;
                    const isCorrectCategory = String(m.category) === String(currentCrossCategory);
                    const isCorrectPlayers = m.players.some(p => String(p.club_id) === String(player1.id)) &&
                                             m.players.some(p => String(p.club_id) === String(player2.id));
                    return isCorrectDiscipline && isCorrectCategory && isCorrectPlayers;
                });

                if (match) {
                    const playerData = match.players.find(p => String(p.club_id) === String(player1.id));
                    const points = playerData.score;
                    const turns = playerData.beurten;
                    
                    // ✅ Check voor gelijkspel (Dames)
                    const opponentData = match.players.find(p => String(p.club_id) !== String(player1.id));
                    const isDraw = opponentData && opponentData.score === points;
                    const won = String(match.winner_club_id) === String(player1.id);
                    
                    // Haal persoonlijk target van de speler op (fallback: 100)
                    const playerTarget = state.players.find(p => p.id === player1.id)?.target || 100;
                    // Bepaal targetTurns per discipline
                    const targetTurns = currentCrossDiscipline === 'Driebanden' ? 40 : 20;
                    
                    // ✅ Dames: 3/2/1 systeem
                    const isDames = currentCrossDiscipline === 'Dames';
                    const compPoints = calculateCompetitionPoints(points, turns, playerTarget, targetTurns, isDames, won, isDraw);
                    const compPointsClass = compPoints > 0 ? 'comp-pts-positive' : compPoints < 0 ? 'comp-pts-negative' : '';
                    const compPointsText = compPoints > 0 ? `+${compPoints}` : compPoints;
                    
                    html += `<td class="match-turns">${turns}</td>`;
                    html += `<td class="${compPointsClass}">${compPointsText}</td>`;
                } else {
                    // NIET GESPEELD: colspan in rij 1 neemt alleen rij 1 in!
                    // Dus in rij 2 moeten we nog steeds 2 cellen renderen
                    html += `<td class="not-played"></td>`;
                    html += `<td class="not-played"></td>`;
                }
            }
        });
        
        // TOT kolommen voor Rij 2 (Bt, MP, HR)
        html += `<td class="tot-turns">${stats.totalTurnsPlayed}</td>`;
        // ✅ Bepaal de kleurklasse voor de totaalscore
        let mpClass = 'tot-mp';
        if (stats.totalCompPoints > 0) mpClass += ' comp-pts-positive'; // Groen
        else if (stats.totalCompPoints < 0) mpClass += ' comp-pts-negative'; // Rood
        
        html += `<td class="${mpClass}">${stats.totalCompPoints > 0 ? '+' + stats.totalCompPoints : stats.totalCompPoints}</td>`;
        html += `<td class="tot-hr">${stats.highestSeries}</td>`;
        html += `<td colspan="2"></td>`;
        html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;


    // ✅ NIEUW: Automatisch lettertype verkleinen als de naam niet in 200px past
    const nameCells = container.querySelectorAll('.player-name');
    nameCells.forEach(cell => {
        let fontSize = 14; // Startgrootte in pixels (ongeveer 0.9em)
        cell.style.fontSize = fontSize + 'px';
        
        // Blijf verkleinen zolang de tekst breder is dan de cel, met een minimum van 10px
        while (cell.scrollWidth > cell.clientWidth && fontSize > 10) {
            fontSize--;
            cell.style.fontSize = fontSize + 'px';
        }
    });

    // ✅ NIEUW: Schaal de volledige tabel zodat ze op het scherm past (geen scrollen meer nodig,
    // ook niet bij veel spelers). Draait na elke render, dus ook telkens je met de
    // afstandsbediening naar een andere discipline/categorie bladert.
    window.fitCrossTableToScreen();
};

/**
 * ✅ NIEUW: Verkleint de kruistabel proportioneel (transform: scale) zodat ze past
 * binnen de beschikbare breedte én hoogte van het scherm. Gaat niet verder omlaag
 * dan MIN_SCALE — daaronder wordt tekst onleesbaar, dan valt hij terug op scrollen.
 */
window.fitCrossTableToScreen = function() {
    const container = document.getElementById('crossTableContainer');
    const table = container.querySelector('table.cross-table');
    if (!table) return;

    const MIN_SCALE = 0.5;

    // Reset om de natuurlijke, ongeschaalde afmetingen te kunnen meten
    table.style.transform = 'none';
    container.style.height = '';

    const availableWidth = container.clientWidth - 10; // iets meer buffer tegen afronding/scrollbar
    // Beschikbare hoogte = van de bovenkant van de tabel tot onderaan het scherm, min wat marge
    const availableHeight = window.innerHeight - container.getBoundingClientRect().top - 30;

    const tableWidth = table.scrollWidth;
    const tableHeight = table.scrollHeight;

    let scale = Math.min(availableWidth / tableWidth, availableHeight / tableHeight, 1);
    // ✅ NIEUW: kleine veiligheidsmarge (3%) zodat afrondingsfouten nooit net de rand afsnijden
    scale *= 0.97;

    if (scale < MIN_SCALE) {
        scale = MIN_SCALE;
        container.style.overflow = 'auto'; // past écht niet: val terug op scrollen
    } else {
        container.style.overflow = 'hidden';
    }

    table.style.transformOrigin = 'top left';
    table.style.transform = `scale(${scale})`;
    // Compenseer de ruimte: transform verandert het uiterlijk, niet de layout-hoogte,
    // dus zonder dit zou er een lege ruimte onder de verkleinde tabel overblijven.
    container.style.height = (tableHeight * scale) + 'px';
};
/**
 * ✅ NIEUW: Herbereken de kruistabel-schaal wanneer het venster van grootte verandert
 * (bv. F11 volledig scherm aan/uit), maar alleen als de kruistabel op dat moment
 * ook echt zichtbaar is — anders zou dit ook draaien terwijl je de rangschikking bekijkt.
 */
function refitCrossTableIfVisible() {
    const view = document.getElementById('viewCrossTable');
    if (view && view.style.display !== 'none') {
        // Kleine vertraging: bij F11 is de vensterovergang soms nog niet volledig
        // afgerond op het exacte moment van het event zelf.
        setTimeout(() => {
            if (typeof window.fitCrossTableToScreen === 'function') {
                window.fitCrossTableToScreen();
            }
        }, 100);
    }
}
// ✅ NIEUW: luister zowel naar 'resize' als naar 'fullscreenchange' — F11 triggert
// niet in elke browser op hetzelfde moment/dezelfde manier een resize-event.
window.addEventListener('resize', refitCrossTableIfVisible);
document.addEventListener('fullscreenchange', refitCrossTableIfVisible);

// =========================================================================
// BLOK 5: UI - HEADER CONTROLS & NAVIGATIE
// =========================================================================

/**
 * Initialiseert de dropdowns wanneer Pagina 20 wordt geopend
 */
window.initCompetitionPage = function() {
    // ✅ NIEUW: haal de gespeelde matches op van de server. Dit is async; de pagina
    // rendert eerst met wat er lokaal is, en fetchMatchResultsFromAPI rendert daarna
    // automatisch opnieuw zodra de data binnen is (die checkt zelf op currentPage 20/21).
    if (typeof window.fetchMatchResultsFromAPI === 'function') {
        window.fetchMatchResultsFromAPI();
    }

    // ✅ 1. RESET: Zet dropdowns terug naar standaard (met jouw aangepaste tekst)
    const discSelect = document.getElementById('compDisc');
    discSelect.value = ""; // Forceer dat er niets geselecteerd is
    discSelect.innerHTML = '<option value="">🏅 Kies Discipline</option>';
    
    document.getElementById('compCat').innerHTML = '<option value="">📜 Kies Categorie</option>';
    
    // ✅ 2. RESET: Standaard weergave instellen (Rangschikking zichtbaar, Kruistabel verborgen)
    document.getElementById('viewLeaderboard').style.display = 'block';
    document.getElementById('viewCrossTable').style.display = 'none';
    
    // ✅ 3. RESET: Knoppen terugzetten (Rangschikking actief)
    document.getElementById('btnLeaderboard').classList.add('active');
    document.getElementById('btnCrossTable').classList.remove('active');
    
    // ✅ 4. RESET: Inhoud van de tabellen wissen en melding tonen
    const emptyMsg = '<div class="no-matches"><p>Selecteer een discipline en categorie.</p></div>';
    document.getElementById('competitionLeaderboard').innerHTML = emptyMsg;
    document.getElementById('crossTableContainer').innerHTML = emptyMsg;
    
    // ✅ 5. VUL: Discipline dropdown opnieuw met de beschikbare opties
    // Haal unieke disciplines op
    const disciplines = [...new Set(state.players.map(p => p.discipline))];
    
    // ✅ Definieer de gewenste volgorde
    const disciplineOrder = ['Vrijspel', 'Bandstoten', 'Driebanden', 'Dames'];
    
    // ✅ Sorteer volgens deze volgorde
    const sortedDisciplines = disciplines.sort((a, b) => {
        const indexA = disciplineOrder.indexOf(a);
        const indexB = disciplineOrder.indexOf(b);
        // Als discipline niet in de lijst staat, zet hem achteraan
        const posA = indexA === -1 ? 999 : indexA;
        const posB = indexB === -1 ? 999 : indexB;
        return posA - posB;
    });
    
    // Vul de dropdown
    sortedDisciplines.forEach(d => {
        discSelect.innerHTML += `<option value="${d}">🏅 ${d}</option>`;
    });

    // ✅ NIEUW: bouw de doorloop-lijst voor de afstandsbediening en toon meteen
    // de eerste combinatie, zodat er altijd direct iets te zien is.
    window.buildCompComboList();
    if (window.compComboList.length > 0) {
        window.goToCompCombo(0);
    } else {
        const label = document.getElementById('compCurrentLabel');
        if (label) label.textContent = 'Geen spelers gevonden';
    }
};

/**
 * ✅ NIEUW: Bouwt de platte, doorlopende lijst van alle discipline+categorie
 * combinaties, in dezelfde volgorde als de (voormalige) dropdowns.
 */
window.buildCompComboList = function() {
    const disciplineOrder = ['Vrijspel', 'Bandstoten', 'Driebanden', 'Dames'];
    const disciplines = [...new Set(state.players.map(p => p.discipline))];
    const sortedDisciplines = disciplines.sort((a, b) => {
        const indexA = disciplineOrder.indexOf(a);
        const indexB = disciplineOrder.indexOf(b);
        const posA = indexA === -1 ? 999 : indexA;
        const posB = indexB === -1 ? 999 : indexB;
        return posA - posB;
    });

    const list = [];
    sortedDisciplines.forEach(disc => {
        const cats = [...new Set(state.players.filter(p => p.discipline === disc).map(p => p.category))].sort((a, b) => a - b);
        cats.forEach(cat => list.push({ discipline: disc, category: cat }));
    });

    window.compComboList = list;
};

/**
 * ✅ NIEUW: Toont de discipline+categorie op de gegeven positie in de doorloop-lijst.
 * Springt rond (wrap-around) aan begin en einde van de volledige lijst.
 */
window.goToCompCombo = function(index) {
    const list = window.compComboList;
    if (!list || list.length === 0) return;

    const len = list.length;
    window.compComboIndex = ((index % len) + len) % len;
    const combo = list[window.compComboIndex];

    const discSelect = document.getElementById('compDisc');
    const catSelect = document.getElementById('compCat');

    discSelect.value = combo.discipline;

    // Categorie-opties opbouwen voor deze discipline (los van updateCompCategories,
    // want die reset de categorie altijd naar leeg — hier willen we een specifieke waarde zetten)
    catSelect.innerHTML = '';
    const cats = [...new Set(state.players.filter(p => p.discipline === combo.discipline).map(p => p.category))].sort((a, b) => a - b);
    cats.forEach(c => {
        catSelect.innerHTML += `<option value="${c}">📜 Cat. ${c}</option>`;
    });
    catSelect.value = combo.category;

    window.updateCompCurrentLabel();
    window.handleCategoryChange();
};

/**
 * ✅ NIEUW: Werkt het grote leesbare label bij (vervangt de dropdown-tekst visueel).
 */
window.updateCompCurrentLabel = function() {
    const label = document.getElementById('compCurrentLabel');
    if (!label) return;
    const disc = document.getElementById('compDisc').value;
    const cat = document.getElementById('compCat').value;
    label.textContent = (disc && cat) ? `🏅 ${disc} • 📜 Categorie ${cat}` : 'Geen gegevens';
};

/**
 * ✅ NIEUW: Wisselt Rangschikking ↔ Kruistabel voor de huidige combinatie (voor Tab).
 */
window.toggleCompView = function() {
    const isLeaderboard = document.getElementById('viewLeaderboard').style.display !== 'none';
    window.switchCompView(isLeaderboard ? 'crosstable' : 'leaderboard');
};

/**
 * Update de categorie-dropdown op basis van de gekozen discipline
 */
window.updateCompCategories = function() {
    const disc = document.getElementById('compDisc').value;
    const catSelect = document.getElementById('compCat');
    
    catSelect.innerHTML = '<option value="">📜Kies Categorie</option>';
    if(!disc) return;
    
    const cats = [...new Set(state.players.filter(p => p.discipline === disc).map(p => p.category))].sort((a,b) => a-b);
    cats.forEach(c => {
        catSelect.innerHTML += `<option value="${c}">📜 Cat. ${c}</option>`;
    });
    
    handleCategoryChange();
};

/**
 * Wordt aangeroepen als de categorie verandert
 */
window.handleCategoryChange = function() {
    const disc = document.getElementById('compDisc').value;
    const cat = document.getElementById('compCat').value;
    
    if(disc && cat) {
        // Bepaal welke view momenteel actief is en render die
        const activeView = document.getElementById('viewLeaderboard').style.display !== 'none' ? 'leaderboard' : 'crosstable';
        switchCompView(activeView);
    }
};

/**
 * Wisselt tussen Rangschikking en Kruistabel
 */
window.switchCompView = function(view) {
    const disc = document.getElementById('compDisc').value;
    const cat = document.getElementById('compCat').value;
    
    // Toggle zichtbaarheid
    document.getElementById('viewLeaderboard').style.display = view === 'leaderboard' ? 'block' : 'none';
    document.getElementById('viewCrossTable').style.display = view === 'crosstable' ? 'block' : 'none';
    
    // Toggle knop styling
    document.getElementById('btnLeaderboard').classList.toggle('active', view === 'leaderboard');
    document.getElementById('btnCrossTable').classList.toggle('active', view === 'crosstable');
    
    // Render de actieve view als er een keuze is gemaakt
    if(disc && cat) {
        if(view === 'leaderboard') renderCompetitionLeaderboard();
        if(view === 'crosstable') renderCrossTable();
    }
};



/**
 * Berekent stats voor een speler op basis van API match results
 * Werkt met de players array structuur van /api/match-results
 */
window.calculatePlayerStatsFromAPI = function(playerId, playerName, discipline, category, allMatches) {
    // Filter matches voor deze speler in deze discipline/categorie
    const playerMatches = allMatches.filter(m => {
        const isCorrectDiscipline = m.discipline === discipline;
        const isCorrectCategory = String(m.category) === String(category);
        const isPlayerInMatch = m.players.some(p => String(p.club_id) === String(playerId));
        return isCorrectDiscipline && isCorrectCategory && isPlayerInMatch;
    });

    let totalCompPoints = 0;
    let totalPointsScored = 0;
    let totalTurnsPlayed = 0;
    let highestSeries = 0;
    let matchesPlayed = 0;
    let matchesWon = 0;

    playerMatches.forEach(match => {
        // Zoek de speler in de players array
        const playerData = match.players.find(p => String(p.club_id) === String(playerId));
        if (!playerData) return;

        const points = playerData.score;
        const turns = playerData.beurten;
        const hr = playerData.hoogste_reeks;
        const won = String(match.winner_club_id) === String(playerId);
        
        // ✅ Check voor gelijkspel (Dames)
        const opponentData = match.players.find(p => String(p.club_id) !== String(playerId));
        const isDraw = opponentData && opponentData.score === points;

        // Bereken competitiepunten voor deze match
        // Haal persoonlijk target van de speler op (fallback: 100)
        const playerTarget = state.players.find(p => p.id === playerId)?.target || 100;
        // Bepaal targetTurns per discipline
        const targetTurns = discipline === 'Driebanden' ? 40 : 20;
        
        // ✅ Dames: 3/2/1 systeem
        const isDames = discipline === 'Dames';
        const compPoints = window.calculateCompetitionPoints(points, turns, playerTarget, targetTurns, isDames, won, isDraw);

        totalCompPoints += compPoints;
        totalPointsScored += points;
        totalTurnsPlayed += turns;
        if (hr > highestSeries) highestSeries = hr;
        matchesPlayed++;
        if (won) matchesWon++;
    });

    // Bereken algemeen gemiddelde
    const average = totalTurnsPlayed > 0 ? totalPointsScored / totalTurnsPlayed : 0;
    
    // Zoek TSG van de speler
    const playerData = state.players.find(p => p.id === playerId);
    let tsg = 0;
    if (playerData && playerData.tsg) {
        tsg = parseFloat(playerData.tsg.replace(',', '.'));
    }
    
    // Coëfficiënt: gespeeld gemiddelde / TSG
    const coefficient = tsg > 0 ? average / tsg : 0;

    // Bereken TSGVS (Te Spelen Gemiddelde Volgend Seizoen)
    const playerInfo = state.players.find(p => p.id === playerId);
    const mode = playerInfo?.mode || 'max -10%';
    let tsgvs;
    let ptnvs;
    
    // ✅ Dames: Vaste waarden
    if (discipline === 'Dames') {
        tsgvs = 20.0;
        ptnvs = 1;
    } else {
        // Normale berekening
        if (matchesPlayed === 0) {
            // Niet gespeeld: blijft gelijk aan TSG
            tsgvs = tsg;
        } else if (mode.startsWith('k')) {
            // "kan niet verminderen"
            tsgvs = average < tsg ? tsg : average;
        } else {
            // "max -10%"
            tsgvs = average < (tsg * 0.9) ? (tsg * 0.9) : average;
        }
        
        // Bereken PTNVS (Punten Volgend Seizoen)
        const targetTurns = discipline === 'Driebanden' ? 40 : 20;
        ptnvs = Math.ceil(tsgvs * targetTurns);
    }
    
    return {
        id: playerId,
        name: playerName,
        discipline: discipline,
        category: category,
        matchesPlayed: matchesPlayed,
        matchesWon: matchesWon,
        totalPointsScored: totalPointsScored,
        totalTurnsPlayed: totalTurnsPlayed,
        average: average,
        highestSeries: highestSeries,
        totalCompPoints: totalCompPoints,
        coefficient: coefficient,
        tsg: tsg,
        tsgvs: tsgvs,
        ptnvs: ptnvs,
        mode: mode
    };
};
