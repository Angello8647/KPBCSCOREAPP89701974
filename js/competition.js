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
