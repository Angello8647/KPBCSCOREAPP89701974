// js/competition.js
// =========================================================================
// BLOK 1: CONFIGURATIE (Uit Excel "Algemene info")
// =========================================================================
const COMPETITION_CONFIG = {
    'Vrijspel': {
        targetPoints: 20,      // Minimum punten
        targetTurns: 20,       // Beurten (AQ2)
        minScore: -5           // Maximum minpunten (AQ3)
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
    }
};


// =========================================================================
// BLOK 2: BEREKENINGEN
// =========================================================================

/**
 * Berekent de competitiepunten voor één speler in één match.
 * Volgt exact de Excel VBA logica (VBA Int() = JS Math.floor()).
 */
window.calculateCompetitionPoints = function(points, turns, discipline) {
    const config = COMPETITION_CONFIG[discipline];
    if (!config) {
        console.warn(`⚠️ Geen configuratie gevonden voor discipline: ${discipline}`);
        return 0;
    }

    const { targetPoints, targetTurns, minScore } = config;

    // Veiligheidscheck voor delen door nul
    if (turns <= 0) return minScore;

    let rawPoints;

    if (points >= targetPoints) {
        // Scenario A: Target gehaald (simpele aftrekking)
        rawPoints = targetTurns - turns;
    } else {
        // Scenario B: Target NIET gehaald (projectie-formule)
        const actualAverage = points / turns;
        const projectedTurns = targetPoints / actualAverage;
        rawPoints = targetTurns - projectedTurns;
        
        // VBA's Int() rondt af naar beneden (naar het dichtstbijzijnde lagere gehele getal)
        // In JS is dit Math.floor()
        rawPoints = Math.floor(rawPoints);
    }

    // Toepassen van de minimum cap (AQ3)
    return Math.max(rawPoints, minScore);
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
        const compPoints = window.calculateCompetitionPoints(points, turns, discipline);

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
        tsg: tsg
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
    if (!currentCompDiscipline || !currentCompCategory) return;

    const container = document.getElementById('competitionLeaderboard');
    
    // 1. Filter spelers
    const players = state.players.filter(p => p.discipline === currentCompDiscipline && p.category === currentCompCategory);
    
    if (players.length === 0) {
        container.innerHTML = `<div class="no-matches"><p>Geen spelers gevonden voor ${currentCompDiscipline} - Categorie ${currentCompCategory}</p></div>`;
        return;
    }

    // 2. Bereken stats voor elke speler
    let leaderboard = players.map(p => calculatePlayerStats(p.id, p.name, currentCompDiscipline, currentCompCategory));

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
                <th>COEF</th>
                <th>MPTN</th>
                <th>HR</th>
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
            <td>${p.totalPointsScored}</td>
            <td>${p.totalTurnsPlayed}</td>
            <td>${p.average.toFixed(3).replace('.', ',')}</td>
            <td>${p.coefficient.toFixed(4).replace('.', ',')}</td>
            <td class="${mptnClass}">${mptnText}</td>
            <td>${p.highestSeries}</td>
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
    if (!currentCrossDiscipline || !currentCrossCategory) return;

    const container = document.getElementById('crossTableContainer');
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
    const playerStats = players.map(p => calculatePlayerStats(p.id, p.name, currentCrossDiscipline, currentCrossCategory));

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
                const match = state.matches.find(m => 
                    m.completed && 
                    m.discipline === currentCrossDiscipline && 
                    m.cat === currentCrossCategory &&
                    ((m.p1_club_id === player1.id && m.p2_club_id === player2.id) ||
                     (m.p1_club_id === player2.id && m.p2_club_id === player1.id))
                );

                if (match) {
                    const isP1 = match.p1_club_id === player1.id;
                    const points = isP1 ? match.p1Score : match.p2Score;
                    const turns = isP1 ? match.p1Turns.length : match.p2Turns.length;
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
                const match = state.matches.find(m => 
                    m.completed && 
                    m.discipline === currentCrossDiscipline && 
                    m.cat === currentCrossCategory &&
                    ((m.p1_club_id === player1.id && m.p2_club_id === player2.id) ||
                     (m.p1_club_id === player2.id && m.p2_club_id === player1.id))
                );

                if (match) {
                    const isP1 = match.p1_club_id === player1.id;
                    const points = isP1 ? match.p1Score : match.p2Score;
                    const turns = isP1 ? match.p1Turns.length : match.p2Turns.length;
                    const compPoints = calculateCompetitionPoints(points, turns, currentCrossDiscipline);
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
};
