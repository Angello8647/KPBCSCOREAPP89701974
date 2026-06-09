// js/scoring.js
function updateBallSelectionPage() {
    if (!state.currentMatch) return;
    document.getElementById('whiteBall1Text').textContent = state.currentMatch.p1;
    document.getElementById('whiteBall2Text').textContent = state.currentMatch.p2;
    document.getElementById('whiteBall1Label').textContent = state.currentMatch.p1;
    document.getElementById('whiteBall2Label').textContent = state.currentMatch.p2;
    document.querySelectorAll('.ball-circle').forEach(ball => ball.classList.remove('selected'));
    const startBtn = document.getElementById('startMatchBtn');
    startBtn.disabled = state.selectedWhitePlayer === null;
    startBtn.className = state.selectedWhitePlayer === null ? 'start-match-btn disabled-btn' : 'start-match-btn';
}

function selectWhitePlayer(player) {
    state.selectedWhitePlayer = player;
    document.querySelectorAll('.ball-circle').forEach(ball => ball.classList.remove('selected'));
    const selectedBall = player === 1 ? document.getElementById('whiteBall1') : document.getElementById('whiteBall2');
    if (selectedBall) selectedBall.classList.add('selected');
    const startBtn = document.getElementById('startMatchBtn');
    startBtn.disabled = false;
    startBtn.className = 'start-match-btn';
}

function startMatch() {
    if (!state.selectedWhitePlayer) return alert("Selecteer eerst wie met wit speelt!");
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
        state.player1.isWhite = true; state.player2.isWhite = false;
        state.player1.target = state.currentMatch.target1; state.player2.target = state.currentMatch.target2;
        state.currentMatch.whitePlayer = 2;
    } else {
        state.player1.isWhite = true; state.player2.isWhite = false;
        state.player1.target = state.currentMatch.target1; state.player2.target = state.currentMatch.target2;
        state.currentMatch.whitePlayer = 1;
    }
    state.currentPlayer = 1; state.turnNumber = 1; state.matchEnded = false;
    state.isFirstPlayerInRound = true; state.pendingEnd = false; state.currentInput = 0;
    document.getElementById('matchEndedAlert').style.display = 'none';
    document.getElementById('matchTitle').textContent = `${state.currentMatch.discipline} - Cat. ${state.currentMatch.cat}`;
    document.getElementById('homeMenuBtn').classList.remove('hidden-btn');
    document.getElementById('backBtn').classList.remove('hidden-btn');
    showPage(6);
    updateScoringPage();
}

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
        const playerCard = state.currentPlayer === 1 ? document.getElementById('player1Card') : document.getElementById('player2Card');
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
    const needed1 = Math.max(0, state.player1.target - state.player1.score - (state.currentPlayer === 1 ? state.currentInput : 0));
    const statValue1 = document.querySelector('#player1Card .stat-item:nth-child(5) .stat-value');
    if (statValue1) {
        statValue1.textContent = needed1;
        statValue1.style.color = (needed1 <= 5 && needed1 > 0) ? '#e74c3c' : '';
        statValue1.style.fontWeight = (needed1 <= 5 && needed1 > 0) ? 'bold' : '';
    }
    const needed2 = Math.max(0, state.player2.target - state.player2.score - (state.currentPlayer === 2 ? state.currentInput : 0));
    const statValue2 = document.querySelector('#player2Card .stat-item:nth-child(5) .stat-value');
    if (statValue2) {
        statValue2.textContent = needed2;
        statValue2.style.color = (needed2 <= 5 && needed2 > 0) ? '#e74c3c' : '';
        statValue2.style.fontWeight = (needed2 <= 5 && needed2 > 0) ? 'bold' : '';
    }
}

function addScore() {
    if (state.matchEnded) return alert("Match is afgelopen! Klik op hoofdmenu om nieuwe match te spelen");
    const score = state.currentInput;
    const player = state.currentPlayer === 1 ? state.player1 : state.player2;
    player.score += score;
    player.turns.push(score);
    if (score > player.highestSeries) player.highestSeries = score;
    player.beurtNummer++;
    
    const totalTurns = state.player1.turns.length + state.player2.turns.length;
    if (totalTurns === 1) {
        document.getElementById('homeMenuBtn').style.display = 'none';
        document.getElementById('backBtn').style.display = 'none';
    }
    
    const targetReached = player.score >= (state.currentPlayer === 1 ? state.player1.target : state.player2.target);
    if (targetReached) {
        if (state.currentPlayer === 1) {
            if (state.isFirstPlayerInRound) {
                state.currentPlayer = 2; state.isFirstPlayerInRound = false; state.pendingEnd = true;
            } else { endMatch(); }
        } else { endMatch(); }
    } else {
        if (state.pendingEnd) { endMatch(); }
        else {
            if (state.isFirstPlayerInRound) { state.currentPlayer = 2; state.isFirstPlayerInRound = false; }
            else { state.currentPlayer = 1; state.isFirstPlayerInRound = true; state.turnNumber++; }
        }
    }
    state.currentInput = 0;
    updateCurrentScoreDisplay();
    document.querySelectorAll('.dynamic-needed').forEach(el => el.remove());
    updateScoringPage();
}

function recalculateHighestSeries(player) {
    if (player.turns.length === 0) { player.highestSeries = 0; return; }
    player.highestSeries = Math.max(...player.turns);
}

function endMatch() {
    state.matchEnded = true;
    state.currentMatch.completed = true;
    const originalP1 = state.currentMatch.originalP1, originalP2 = state.currentMatch.originalP2;
    const originalTarget1 = state.currentMatch.originalTarget1, originalTarget2 = state.currentMatch.originalTarget2;
    let finalScore1, finalScore2;
    if (state.currentMatch.whitePlayer === 1) { finalScore1 = state.player1.score; finalScore2 = state.player2.score; }
    else { finalScore1 = state.player2.score; finalScore2 = state.player1.score; }
    const winnerName = finalScore1 >= originalTarget1 ? originalP1 : originalP2;
    
    state.currentMatch.p1Score = finalScore1; state.currentMatch.p2Score = finalScore2;
    if (state.currentMatch.whitePlayer === 1) {
        state.currentMatch.p1Turns = [...state.player1.turns]; state.currentMatch.p2Turns = [...state.player2.turns];
        state.currentMatch.p1Highest = state.player1.highestSeries; state.currentMatch.p2Highest = state.player2.highestSeries;
    } else {
        state.currentMatch.p1Turns = [...state.player2.turns]; state.currentMatch.p2Turns = [...state.player1.turns];
        state.currentMatch.p1Highest = state.player2.highestSeries; state.currentMatch.p2Highest = state.player1.highestSeries;
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
    if (!confirm("Weet je zeker dat je de laatste beurt ongedaan wilt maken?")) return;
    document.querySelectorAll('.dynamic-needed').forEach(el => el.remove());
    const p1Turns = state.player1.turns.length, p2Turns = state.player2.turns.length;
    if (p1Turns === 0 && p2Turns === 0) return alert("Geen beurten om ongedaan te maken");
    
    let lastPlayer;
    if (p1Turns > p2Turns) lastPlayer = 1;
    else if (p2Turns > p1Turns) lastPlayer = 2;
    else lastPlayer = state.currentPlayer;
    
    const player = lastPlayer === 1 ? state.player1 : state.player2;
    const lastScore = player.turns.pop();
    player.score -= lastScore;
    player.beurtNummer--;
    recalculateHighestSeries(player);
    state.currentPlayer = lastPlayer;
    if (p1Turns === p2Turns) { state.currentPlayer = 1; state.isFirstPlayerInRound = true; }
    else if (p1Turns > p2Turns) { state.currentPlayer = 2; state.isFirstPlayerInRound = false; }
    else { state.currentPlayer = 1; state.isFirstPlayerInRound = true; }
    
    state.matchEnded = false; state.pendingEnd = false; state.currentInput = 0;
    if (state.currentMatch) {
        state.currentMatch.completed = false;
        delete state.currentMatch.p1Score; delete state.currentMatch.p2Score;
    }
    document.getElementById('matchEndedAlert').style.display = 'none';
    updateScoringPage();
}

function updateScoringPage() {
    const player1Card = document.getElementById('player1Card');
    const player2Card = document.getElementById('player2Card');
    const currentName = state.currentPlayer === 1 ? state.currentMatch.p1 : state.currentMatch.p2;
    const btnNameElement = document.getElementById('currentPlayerBtnName');
    if (btnNameElement) btnNameElement.textContent = currentName;
    
    player1Card.className = state.player1.isWhite ? 'player-card player-white' : 'player-card player-yellow';
    player2Card.className = state.player2.isWhite ? 'player-card player-white' : 'player-card player-yellow';
    if (state.currentPlayer === 1) { player1Card.classList.add('player-active'); player2Card.classList.add('player-inactive'); }
    else { player1Card.classList.add('player-inactive'); player2Card.classList.add('player-active'); }
    
    const avg1 = state.player1.turns.length > 0 ? (state.player1.score / state.player1.turns.length).toFixed(2) : '0.00';
    const avg2 = state.player2.turns.length > 0 ? (state.player2.score / state.player2.turns.length).toFixed(2) : '0.00';
    const needed1 = Math.max(0, state.player1.target - state.player1.score);
    const needed2 = Math.max(0, state.player2.target - state.player2.score);
    const p1TurnsReversed = [...state.player1.turns].reverse();
    const p2TurnsReversed = [...state.player2.turns].reverse();
    
    player1Card.innerHTML = `<div><h3>${state.currentMatch.p1} ${state.player1.isWhite ? '⚪' : '🟡'}</h3><div class="stats-grid"><div class="stat-item"><div class="stat-icon">🏁</div><div>Doel:</div><div class="stat-value">${state.player1.target}</div></div><div class="stat-item"><div class="stat-icon">📊</div><div>Huidig:</div><div class="stat-value">${state.player1.score}</div></div><div class="stat-item"><div class="stat-icon">🔢</div><div>Beurten:</div><div class="stat-value">${state.player1.turns.length}</div></div><div class="stat-item"><div class="stat-icon">📈</div><div>Gemiddelde:</div><div class="stat-value">${avg1}</div></div><div class="stat-item"><div class="stat-icon">🎯</div><div>Nog nodig:</div><div class="stat-value">${needed1}</div></div><div class="stat-item"><div class="stat-icon">⭐</div><div>Hoogste reeks:</div><div class="stat-value">${state.player1.highestSeries}</div></div></div></div><div class="turns-scroll-container"><div class="turns-list">${p1TurnsReversed.map((turn, index) => `<div class="turn-row"><span>Beurt ${state.player1.turns.length - index}:</span><span>${turn} punt${turn !== 1 ? 'en' : ''}</span></div>`).join('')}${state.player1.turns.length === 0 ? '<div style="text-align: center; color: #666; padding: 10px; font-size: 0.9em;">Geen beurten</div>' : ''}</div></div>`;
    
    player2Card.innerHTML = `<div><h3>${state.currentMatch.p2} ${state.player2.isWhite ? '⚪' : '🟡'}</h3><div class="stats-grid"><div class="stat-item"><div class="stat-icon">🏁</div><div>Doel:</div><div class="stat-value">${state.player2.target}</div></div><div class="stat-item"><div class="stat-icon">📊</div><div>Huidig:</div><div class="stat-value">${state.player2.score}</div></div><div class="stat-item"><div class="stat-icon">🔢</div><div>Beurten:</div><div class="stat-value">${state.player2.turns.length}</div></div><div class="stat-item"><div class="stat-icon">📈</div><div>Gemiddelde:</div><div class="stat-value">${avg2}</div></div><div class="stat-item"><div class="stat-icon">🎯</div><div>Nog nodig:</div><div class="stat-value">${needed2}</div></div><div class="stat-item"><div class="stat-icon">⭐</div><div>Hoogste reeks:</div><div class="stat-value">${state.player2.highestSeries}</div></div></div></div><div class="turns-scroll-container"><div class="turns-list">${p2TurnsReversed.map((turn, index) => `<div class="turn-row"><span>Beurt ${state.player2.turns.length - index}:</span><span>${turn} punt${turn !== 1 ? 'en' : ''}</span></div>`).join('')}${state.player2.turns.length === 0 ? '<div style="text-align: center; color: #666; padding: 10px; font-size: 0.9em;">Geen beurten</div>' : ''}</div></div>`;
    
    const currentColor = (state.currentPlayer === 1 && state.player1.isWhite) || (state.currentPlayer === 2 && state.player2.isWhite) ? 'Wit' : 'Geel';
    const currentBeurtNummer = state.currentPlayer === 1 ? state.player1.beurtNummer : state.player2.beurtNummer;
    document.getElementById('currentPlayerDisplay').innerHTML = `<div style="font-weight: bold; margin-bottom: 8px; font-size: 1.1em;">Beurt ${currentBeurtNummer} voor ${currentName}</div><div style="margin: 8px 0;"><span style="background: ${currentColor === 'Wit' ? 'white' : '#f1c40f'}; color: black; padding: 6px 15px; border-radius: 20px; font-size: 0.9em; font-weight: bold;">${currentColor}</span></div>${state.pendingEnd ? '<div style="margin-top: 18px; color: #e74c3c; font-size: 0.8em; font-weight: bold;">⏱️ Nabeurt! Leg de ballen klaar voor opzet</div>' : ''}`;
    updateDynamicNeededDisplay();
}

function selectMatch(matchId) {
    const match = state.matches.find(m => m.id === matchId);
    if (match && match.completed) return alert("Deze match is al afgerond. Kies een andere match.");
    state.currentMatch = match;
    state.selectedWhitePlayer = null;
    document.getElementById('matchTitleSelect').textContent = `${match.discipline} - Cat. ${match.cat}`;
    showPage(5);
}


// js/scoring.js

// ==========================================
// SCORE SCHERM UPDATES
// ==========================================
function updateScoringPage() {
    if (!state.currentMatch) return;

    // 1. Header update
    document.getElementById('headerTarget1').textContent = state.player1.target;
    document.getElementById('headerTarget2').textContent = state.player2.target;
    document.getElementById('headerName1').textContent = state.currentMatch.p1;
    document.getElementById('headerName2').textContent = state.currentMatch.p2;

    // 2. Spelerkaarten & Beurtenlijst (4-koloms)
    const p1Card = document.getElementById('player1Card');
    const p2Card = document.getElementById('player2Card');
    
    p1Card.className = `player-card ${state.player1.isWhite ? 'player-white' : 'player-yellow'} ${state.currentPlayer === 1 ? 'player-active' : 'player-inactive'}`;
    p2Card.className = `player-card ${state.player2.isWhite ? 'player-white' : 'player-yellow'} ${state.currentPlayer === 2 ? 'player-active' : 'player-inactive'}`;

    const renderTurns = (turns) => {
        if (!turns || turns.length === 0) return '<div style="text-align:center;color:#666;padding:20px;font-size:0.9em;">Nog geen beurten</div>';
        return [...turns].reverse().map((t, i) => 
            `<div class="turn-row"><span>B${turns.length - i}: ${t}</span></div>`
        ).join('');
    };

    p1Card.innerHTML = `<h3>${state.currentMatch.p1} ${state.player1.isWhite ? '⚪' : '🟡'}</h3><div class="turns-scroll-container"><div class="turns-list">${renderTurns(state.player1.turns)}</div></div>`;
    p2Card.innerHTML = `<h3>${state.currentMatch.p2} ${state.player2.isWhite ? '⚪' : '🟡'}</h3><div class="turns-scroll-container"><div class="turns-list">${renderTurns(state.player2.turns)}</div></div>`;

    // 3. Middenblok: Beurt info
    let currentBeurt = state.currentPlayer === 1 ? state.player1.beurtNummer : state.player2.beurtNummer;
    if (state.matchEnded) currentBeurt = Math.max(1, currentBeurt - 1);
    
    const currentColor = (state.currentPlayer === 1 && state.player1.isWhite) || (state.currentPlayer === 2 && state.player2.isWhite) ? 'Wit' : 'Geel';
    let extraInfo = '';
    if (state.isNabeurt) extraInfo = '<div style="margin-top:15px;font-size:1.2rem;color:#ffcc00;font-weight:bold;">⚠️ NABEURT</div>';
    else if (state.firstToTarget === 1) extraInfo = '<div style="margin-top:15px;font-size:1.2rem;color:#ffcc00;font-weight:bold;">✅ Laatste beurt voor speler 2</div>';

    document.getElementById('currentPlayerDisplay').innerHTML = `
        <div style="text-align:center;">
            <div style="font-size:5rem;font-weight:900;color:white;line-height:1;">B ${currentBeurt}</div>
            <div style="margin-top:15px;">
                <span style="background:${currentColor === 'Wit' ? 'white' : '#f1c40f'}; color:black; font-size:1.5rem; font-weight:bold; padding:10px 40px; border-radius:50px; display:inline-block;">${currentColor}</span>
            </div>
            ${extraInfo}
        </div>`;

    // 4. Update alle cijfers en stats
    updateCurrentScoreDisplay();
    updateHeaderButtons();
}

function updateCurrentScoreDisplay() {
    const p1CurrentEl = document.getElementById('p1CurrentVal');
    const p2CurrentEl = document.getElementById('p2CurrentVal');
    const p1NeededEl = document.getElementById('p1NeededVal');
    const p2NeededEl = document.getElementById('p2NeededVal');
    
    const p1CurrentCell = document.getElementById('p1CurrentCell');
    const p2CurrentCell = document.getElementById('p2CurrentCell');
    const p1NeededCell = document.getElementById('p1NeededCell');
    const p2NeededCell = document.getElementById('p2NeededCell');

    // Huidige invoer
    if (p1CurrentEl) p1CurrentEl.textContent = state.currentInput;
    if (p2CurrentEl) p2CurrentEl.textContent = state.currentInput;

    // Nog nodig berekenen
    const n1 = Math.max(0, state.player1.target - state.player1.score - (state.currentPlayer === 1 ? state.currentInput : 0));
    const n2 = Math.max(0, state.player2.target - state.player2.score - (state.currentPlayer === 2 ? state.currentInput : 0));
    
    if (p1NeededEl) p1NeededEl.textContent = n1;
    if (p2NeededEl) p2NeededEl.textContent = n2;

    // Totaal scores
    document.getElementById('p1TotalVal').textContent = state.player1.score;
    document.getElementById('p2TotalVal').textContent = state.player2.score;

    // Active / Hidden classes
    p1CurrentCell.className = 'score-cell current-turn-cell';
    p2CurrentCell.className = 'score-cell current-turn-cell';
    
    if (state.currentPlayer === 1) {
        p1CurrentCell.classList.add('active-player');
        p2CurrentCell.classList.add('turn-hidden');
    } else {
        p2CurrentCell.classList.add('active-player');
        p1CurrentCell.classList.add('turn-hidden');
    }

    // Dimmed & Danger classes voor "Nog nodig"
    if (p1NeededCell) p1NeededCell.classList.toggle('dimmed', state.currentPlayer !== 1);
    if (p2NeededCell) p2NeededCell.classList.toggle('dimmed', state.currentPlayer !== 2);
    if (p1NeededCell) p1NeededCell.classList.toggle('danger', n1 <= 5 && n1 > 0);
    if (p2NeededCell) p2NeededCell.classList.toggle('danger', n2 <= 5 && n2 > 0);

    // Statistieken bijwerken
    const fmtAvg = (p) => p.turns && p.turns.length > 0 ? (p.score / p.turns.length).toFixed(2).replace('.', ',') : '0,00';
    const fmtTarget = (val) => val && val !== '−' ? parseFloat(String(val).replace(',', '.')).toFixed(2).replace('.', ',') : '−';

    document.getElementById('p1PlayedAvg').textContent = fmtAvg(state.player1);
    document.getElementById('p1Highest').textContent = state.player1.highestSeries || 0;
    document.getElementById('p1TargetAvg').textContent = fmtTarget(state.player1.fixedTSG || '−');

    document.getElementById('p2PlayedAvg').textContent = fmtAvg(state.player2);
    document.getElementById('p2Highest').textContent = state.player2.highestSeries || 0;
    document.getElementById('p2TargetAvg').textContent = fmtTarget(state.player2.fixedTSG || '−');
}

// ==========================================
// SCORE ACTIES
// ==========================================
window.changeScore = function(delta) {
    if (state.matchEnded) return;
    
    const p = state.currentPlayer === 1 ? state.player1 : state.player2;
    const pot = state.currentInput + delta;
    
    // Voorkom dat de score boven het target uitkomt
    if (p.score + pot > p.target) {
        state.currentInput = Math.max(0, p.target - p.score);
    } else {
        state.currentInput = Math.max(0, pot);
    }
    
    updateCurrentScoreDisplay();
};

window.addScore = function() {
    if (state.matchEnded) return;
    
    const score = state.currentInput;
    const p = state.currentPlayer === 1 ? state.player1 : state.player2;
    
    // Sla state op voor undo
    window.lastStateBeforeAdd = {
        player1: { score: state.player1.score, turns: [...state.player1.turns], beurtNummer: state.player1.beurtNummer, highestSeries: state.player1.highestSeries },
        player2: { score: state.player2.score, turns: [...state.player2.turns], beurtNummer: state.player2.beurtNummer, highestSeries: state.player2.highestSeries },
        currentPlayer: state.currentPlayer,
        isFirstPlayerInRound: state.isFirstPlayerInRound,
        firstToTarget: state.firstToTarget,
        isNabeurt: state.isNabeurt,
        matchEnded: state.matchEnded,
        currentInput: state.currentInput
    };

    // Score toevoegen
    p.score += score;
    p.turns.push(score);
    if (score > p.highestSeries) p.highestSeries = score;
    p.beurtNummer++;

    const reachedTarget = p.score >= p.target;

    // Match eindigen logica
    if (reachedTarget && state.firstToTarget === null) {
        state.firstToTarget = state.currentPlayer;
        if (state.currentPlayer === 1) {
            state.isNabeurt = true;
            state.currentPlayer = 2;
            state.isFirstPlayerInRound = false;
            state.currentInput = 0;
            updateCurrentScoreDisplay();
            updateScoringPage();
            return;
        } else {
            endMatch();
            return;
        }
    }

    if (state.isNabeurt) {
        endMatch();
        return;
    }

    // Wissel van speler
    if (state.isFirstPlayerInRound) {
        state.currentPlayer = 2;
        state.isFirstPlayerInRound = false;
    } else {
        state.currentPlayer = 1;
        state.isFirstPlayerInRound = true;
        state.turnNumber++;
    }
    
    state.currentInput = 0;
    saveStateToStorage();
    updateCurrentScoreDisplay();
    updateScoringPage();
};

window.undoLastAdd = function() {
    if (!window.lastStateBeforeAdd) return;
    
    const s = window.lastStateBeforeAdd;
    state.player1.score = s.player1.score;
    state.player1.turns = [...s.player1.turns];
    state.player1.beurtNummer = s.player1.beurtNummer;
    state.player1.highestSeries = s.player1.highestSeries;
    
    state.player2.score = s.player2.score;
    state.player2.turns = [...s.player2.turns];
    state.player2.beurtNummer = s.player2.beurtNummer;
    state.player2.highestSeries = s.player2.highestSeries;
    
    state.currentPlayer = s.currentPlayer;
    state.isFirstPlayerInRound = s.isFirstPlayerInRound;
    state.firstToTarget = s.firstToTarget;
    state.isNabeurt = s.isNabeurt;
    state.matchEnded = s.matchEnded;
    state.currentInput = s.currentInput;
    
    window.lastStateBeforeAdd = null;
    document.getElementById('matchEndedAlert').style.display = 'none';
    
    saveStateToStorage();
    updateCurrentScoreDisplay();
    updateScoringPage();
};

function endMatch() {
    state.matchEnded = true;
    state.currentMatch.completed = true;
    state.currentMatch.p1Score = state.player1.score;
    state.currentMatch.p2Score = state.player2.score;
    state.currentMatch.p1Turns = [...state.player1.turns];
    state.currentMatch.p2Turns = [...state.player2.turns];
    state.currentMatch.p1Highest = state.player1.highestSeries;
    state.currentMatch.p2Highest = state.player2.highestSeries;
    state.currentMatch.winner = state.player1.score >= state.player1.target ? state.currentMatch.p1 : state.currentMatch.p2;
    
    saveStateToStorage();
    updateScoringPage();
    updateHeaderButtons();
    
    // Toon samenvatting na korte vertraging
    setTimeout(() => {
        // Hier kunnen we later renderMatchSummary() aanroepen als we pagina 6 hebben
        alert(`Match voltooid! Winnaar: ${state.currentMatch.winner}`);
        showPage(1); // Terug naar hoofdmenu voor nu
    }, 1000);
}

function updateHeaderButtons() {
    const leftBtn = document.getElementById('headerLeftBtn');
    const rightBtn = document.getElementById('headerRightBtn');
    if (!leftBtn || !rightBtn) return;

    if (state.matchEnded) {
        leftBtn.innerHTML = '🏠 Hoofdmenu';
        leftBtn.onclick = () => showPage(1);
        rightBtn.disabled = true;
        return;
    }

    const currentName = state.currentPlayer === 1 ? state.currentMatch.p1 : state.currentMatch.p2;
    leftBtn.innerHTML = `Einde beurt ${currentName}`;
    leftBtn.onclick = () => addScore();
    
    rightBtn.innerHTML = '↩️ Ongedaan';
    rightBtn.onclick = () => undoLastAdd();
    rightBtn.disabled = !window.lastStateBeforeAdd;
}

// ==========================================
// PRESENTER / TOETSENBORD CONTROLS
// ==========================================
function initPresenterControls() {
    let pageUpStartTime = null;
    let lastScoreTime = 0;
    const COOLDOWN = 300; // ms tussen scores

    document.addEventListener('keydown', function(event) {
        const activePage = document.querySelector('.page.active');
        if (!activePage || activePage.id !== 'page5') return;
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
        if (state.matchEnded) return;

        const key = event.key;
        const now = Date.now();

        // PageUp (of Pijl Omhoog) = +1 punt (kort) of Home (lang)
        if (key === 'PageUp' || key === 'ArrowUp') {
            event.preventDefault();
            pageUpStartTime = Date.now();
            return;
        }

        // PageDown (of Pijl Omlaag) = -1 punt
        if (key === 'PageDown' || key === 'ArrowDown') {
            event.preventDefault();
            if (now - lastScoreTime >= COOLDOWN) {
                changeScore(-1);
                lastScoreTime = now;
            }
            return;
        }

        // 'b' of 'B' = Undo
        if (key === 'b' || key === 'B') {
            event.preventDefault();
            undoLastAdd();
            lastScoreTime = now;
            return;
        }

        // Tab of Enter = Einde beurt
        if (key === 'Tab' || key === 'Enter') {
            event.preventDefault();
            addScore();
            lastScoreTime = now;
        }
    });

    document.addEventListener('keyup', function(event) {
        const activePage = document.querySelector('.page.active');
        if (!activePage || activePage.id !== 'page5') return;

        if (event.key === 'PageUp' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (pageUpStartTime === null) return;
            
            const holdDuration = Date.now() - pageUpStartTime;
            pageUpStartTime = null;

            if (holdDuration >= 2000) {
                // Lang ingedrukt: terug naar home (alleen als 0 beurten)
                if (state.player1.turns.length === 0 && state.player2.turns.length === 0) {
                    showPage(1);
                }
            } else {
                // Kort ingedrukt: +1 punt
                if (Date.now() - lastScoreTime >= COOLDOWN) {
                    changeScore(1);
                    lastScoreTime = Date.now();
                }
            }
        }
    });
}
