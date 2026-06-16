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
