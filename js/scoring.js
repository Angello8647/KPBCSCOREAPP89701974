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

    // 2. Spelerkaarten & Beurtenlijst
    const p1Card = document.getElementById('player1Card');
    const p2Card = document.getElementById('player2Card');
    
    if (p1Card && p2Card) {
        p1Card.className = `player-card ${state.player1.isWhite ? 'player-white' : 'player-yellow'} ${state.currentPlayer === 1 ? 'player-active' : 'player-inactive'}`;
        p2Card.className = `player-card ${state.player2.isWhite ? 'player-white' : 'player-yellow'} ${state.currentPlayer === 2 ? 'player-active' : 'player-inactive'}`;

        // Helper functie voor beurt-weergave (lokaal gedefinieerd, dus altijd bereikbaar)
        const renderTurns = (turns, player) => {
            if (!turns || turns.length === 0) {
                return '<div style="text-align:center;color:#666;padding:20px;font-size:0.9em;">Nog geen beurten</div>';
            }
            
            const minBeurten = 56;
            const totalToShow = Math.max(minBeurten, turns.length);
            const highest = player.highestSeries || 0;
            let html = '';
            
            for (let i = 1; i <= totalToShow; i++) {
                const isPlayed = i <= turns.length;
                let scoreDisplay = '−';
                let classes = 'turn-row';
                
                if (isPlayed) {
                    const score = turns[i - 1];
                    
                    if (score === 0) {
                        scoreDisplay = '-';
                        classes += ' played zero-turn';
                    } else {
                        scoreDisplay = score;
                        classes += ' played';
                        
                        // ✅ Markeer als hoogste reeks
                        if (score === highest && highest > 0) {
                            classes += ' highest-series';
                        }
                    }
                    
                    // Subtiel accent voor de allerlaatste beurt (als het niet de hoogste reeks is)
                    if (i === turns.length && score !== highest) {
                        classes += ' latest-turn';
                    }
                } else {
                    classes += ' pending';
                }
                
                html += `<div class="${classes}"><span>B${i}: ${scoreDisplay}</span></div>`;
            }
            return html;
        };

        // ✅ HTML opbouwen met de CORRECTE variabelen (p1Card / p2Card)
        p1Card.innerHTML = `
            <div><h3>${state.currentMatch.p1} ${state.player1.isWhite ? '⚪' : '🟡'}</h3></div>
            <div class="turns-scroll-container">
                <div class="turns-list">${renderTurns(state.player1.turns, state.player1)}</div>
            </div>`;

        p2Card.innerHTML = `
            <div><h3>${state.currentMatch.p2} ${state.player2.isWhite ? '⚪' : '🟡'}</h3></div>
            <div class="turns-scroll-container">
                <div class="turns-list">${renderTurns(state.player2.turns, state.player2)}</div>
            </div>`;
    }

    // 3. Middenblok: Beurt info (DYNAMISCHE KLEUR)
    let currentBeurt = state.currentPlayer === 1 ? state.player1.beurtNummer : state.player2.beurtNummer;
    if (state.matchEnded) currentBeurt = Math.max(1, currentBeurt - 1);
    
    const isWhite = (state.currentPlayer === 1 && state.player1.isWhite) || (state.currentPlayer === 2 && state.player2.isWhite);
    const textColor = isWhite ? '#ffffff' : '#f1c40f';
    const glowColor = isWhite ? 'rgba(255, 255, 255, 0.4)' : 'rgba(241, 196, 15, 0.4)';
    
    let extraInfo = '';
    if (state.isNabeurt) {
        extraInfo = '<div style="margin-top:15px; font-size:1.3rem; color:#ffcc00; font-weight:bold; text-shadow: 0 0 10px rgba(255, 204, 0, 0.5);">⚠️ NABEURT</div>';
    } else if (state.firstToTarget === 1) {
        extraInfo = '<div style="margin-top:15px; font-size:1.3rem; color:#2ecc71; font-weight:bold; text-shadow: 0 0 10px rgba(46, 204, 113, 0.5);">✅ Laatste beurt voor speler 2</div>';
    }

    document.getElementById('currentPlayerDisplay').innerHTML = `
        <div style="text-align:center;">
            <div style="font-size:6.5rem; font-weight:900; color:${textColor}; line-height:1; text-shadow: 0 0 25px ${glowColor}; transition: color 0.3s ease;">
                B ${currentBeurt}
            </div>
            ${extraInfo}
        </div>`;

    // 4. Update alle cijfers en stats
    updateCurrentScoreDisplay();
    updateHeaderButtons();
}

function updateCurrentScoreDisplay() {
    // === 1. ELEMENTEN OPHALEN ===
    const p1CurrentEl = document.getElementById('p1CurrentVal');
    const p2CurrentEl = document.getElementById('p2CurrentVal');
    const p1NeededEl = document.getElementById('p1NeededVal');
    const p2NeededEl = document.getElementById('p2NeededVal');
    
    const p1CurrentCell = document.getElementById('p1CurrentCell');
    const p2CurrentCell = document.getElementById('p2CurrentCell');
    const p1NeededCell = document.getElementById('p1NeededCell');
    const p2NeededCell = document.getElementById('p2NeededCell');
    
    const p1TotalCell = document.getElementById('p1TotalCell');
    const p2TotalCell = document.getElementById('p2TotalCell');

    // === 2. HUIDIGE INVOER UPDATEN ===
    if (p1CurrentEl) p1CurrentEl.textContent = state.currentInput;
    if (p2CurrentEl) p2CurrentEl.textContent = state.currentInput;

    // === 3. "NOG NODIG" BEREKENEN (rekening houdend met huidige invoer) ===
    const n1 = Math.max(0, state.player1.target - state.player1.score - (state.currentPlayer === 1 ? state.currentInput : 0));
    const n2 = Math.max(0, state.player2.target - state.player2.score - (state.currentPlayer === 2 ? state.currentInput : 0));
    
    if (p1NeededEl) p1NeededEl.textContent = n1;
    if (p2NeededEl) p2NeededEl.textContent = n2;

    // === 4. ✅ TOTAAL SCORES LIVE UPDATEN (met huidige invoer meegerekend) ===
    // Als speler aan de beurt is, tel de huidige invoer op bij zijn totaal
    const p1DisplayScore = state.player1.score + (state.currentPlayer === 1 ? state.currentInput : 0);
    const p2DisplayScore = state.player2.score + (state.currentPlayer === 2 ? state.currentInput : 0);
    
    if (p1TotalCell) document.getElementById('p1TotalVal').textContent = p1DisplayScore;
    if (p2TotalCell) document.getElementById('p2TotalVal').textContent = p2DisplayScore;

    // === 5. BAL-KLEUREN & TURN-HIDDEN ===
    p1CurrentCell.className = 'score-cell current-turn-cell';
    p2CurrentCell.className = 'score-cell current-turn-cell';
    
    if (state.currentPlayer === 1) {
        p1CurrentCell.classList.add('active-player');
        p2CurrentCell.classList.add('turn-hidden');
    } else {
        p2CurrentCell.classList.add('active-player');
        p1CurrentCell.classList.add('turn-hidden');
    }

    // === 6. DIMMING LOGICA (Nog nodig + Totaalscore) ===
    if (p1NeededCell) p1NeededCell.classList.toggle('dimmed', state.currentPlayer !== 1);
    if (p2NeededCell) p2NeededCell.classList.toggle('dimmed', state.currentPlayer !== 2);
    if (p1NeededCell) p1NeededCell.classList.toggle('danger', n1 <= 5 && n1 > 0);
    if (p2NeededCell) p2NeededCell.classList.toggle('danger', n2 <= 5 && n2 > 0);
    
    if (p1TotalCell) p1TotalCell.classList.toggle('dimmed', state.currentPlayer !== 1);
    if (p2TotalCell) p2TotalCell.classList.toggle('dimmed', state.currentPlayer !== 2);

    // === 7. STATISTIEKEN BIJWERKEN ===
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

    // Match eindigen logica (nabeurt)
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
    
    // Toon samenvatting na korte vertraging (of ga terug naar menu voor nu)
    setTimeout(() => {
        alert(`Match voltooid! Winnaar: ${state.currentMatch.winner}`);
        showPage(1); // Terug naar hoofdmenu
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
// MATCH STARTEN (na bal-selectie)
// ==========================================
// ==========================================
// BAL SELECTIE PAGINA (Pagina 4)
// ==========================================
window.updateBallSelectionPage = function() {
    console.log("🎱 updateBallSelectionPage aangeroepen");
    
    if (!state.currentMatch) {
        console.error("❌ state.currentMatch is null!");
        return;
    }
    
    // Reset selectie
    state.selectedWhitePlayer = null;
    
    // Zet de namen op de ballen
    const ball1Text = document.getElementById('whiteBall1Text');
    const ball2Text = document.getElementById('whiteBall2Text');
    
    if (ball1Text) ball1Text.textContent = state.currentMatch.p1;
    if (ball2Text) ball2Text.textContent = state.currentMatch.p2;
    
    console.log("✅ Namen ingesteld:", state.currentMatch.p1, "vs", state.currentMatch.p2);
    
    // Reset visuele state
    document.querySelectorAll('.ball-option').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.ball-circle').forEach(el => el.classList.remove('yellow', 'selected'));
    
    const startBtn = document.getElementById('startMatchBtn');
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.classList.add('disabled-btn');
    }
};

window.selectWhitePlayer = function(playerNum) {
    state.selectedWhitePlayer = playerNum;
    
    // Visuele feedback
    document.querySelectorAll('.ball-option').forEach(el => el.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    
    // Maak de andere bal geel
    const ball1 = document.getElementById('whiteBall1');
    const ball2 = document.getElementById('whiteBall2');
    
    if (playerNum === 1) {
        ball1.classList.remove('yellow');
        ball2.classList.add('yellow');
    } else {
        ball2.classList.remove('yellow');
        ball1.classList.add('yellow');
    }
    
    // Activeer de start-knop
    const startBtn = document.getElementById('startMatchBtn');
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.classList.remove('disabled-btn');
    }
};

// ==========================================
// MATCH STARTEN (na bal-selectie)
// ==========================================
window.startMatch = function() {
    if (!state.selectedWhitePlayer) {
        return alert("Selecteer eerst wie met de witte bal speelt!");
    }

    // Bewaar originele spelers en targets
    const originalP1 = state.currentMatch.p1;
    const originalP2 = state.currentMatch.p2;
    const originalTarget1 = state.currentMatch.target1;
    const originalTarget2 = state.currentMatch.target2;

    state.currentMatch.originalP1 = originalP1;
    state.currentMatch.originalP2 = originalP2;
    state.currentMatch.originalTarget1 = originalTarget1;
    state.currentMatch.originalTarget2 = originalTarget2;

    // Zoek de TSG van beide spelers
    const tsg1 = state.players.find(p => p.name === originalP1)?.tsg || '−';
    const tsg2 = state.players.find(p => p.name === originalP2)?.tsg || '−';

    // Reset player state
    state.player1 = {
        score: 0,
        turns: [],
        target: 0,
        beurtNummer: 1,
        highestSeries: 0,
        isWhite: false,
        fixedTSG: '−'
    };
    state.player2 = {
        score: 0,
        turns: [],
        target: 0,
        beurtNummer: 1,
        highestSeries: 0,
        isWhite: false,
        fixedTSG: '−'
    };

    state.firstToTarget = null;
    state.isNabeurt = false;
    state.currentInput = 0;
    state.matchEnded = false;

    // Als speler 2 met wit speelt, wissel dan de volgorde
    if (state.selectedWhitePlayer === 2) {
        state.currentMatch.p1 = originalP2;
        state.currentMatch.p2 = originalP1;
        state.currentMatch.target1 = originalTarget2;
        state.currentMatch.target2 = originalTarget1;

        state.player1.isWhite = true;
        state.player1.target = state.currentMatch.target1;
        state.player1.fixedTSG = tsg2;

        state.player2.isWhite = false;
        state.player2.target = state.currentMatch.target2;
        state.player2.fixedTSG = tsg1;

        state.currentMatch.whitePlayer = 2;
    } else {
        state.currentMatch.p1 = originalP1;
        state.currentMatch.p2 = originalP2;
        state.currentMatch.target1 = originalTarget1;
        state.currentMatch.target2 = originalTarget2;

        state.player1.isWhite = true;
        state.player1.target = state.currentMatch.target1;
        state.player1.fixedTSG = tsg1;

        state.player2.isWhite = false;
        state.player2.target = state.currentMatch.target2;
        state.player2.fixedTSG = tsg2;

        state.currentMatch.whitePlayer = 1;
    }

    // Reset match state
    state.currentPlayer = 1;
    state.turnNumber = 1;
    state.isFirstPlayerInRound = true;
    state.pendingEnd = false;
    window.lastStateBeforeAdd = null;

    // Verberg match-ended alert
    const alertEl = document.getElementById('matchEndedAlert');
    if (alertEl) alertEl.style.display = 'none';

    // Reset score displays
    document.getElementById('p1CurrentVal').textContent = '0';
    document.getElementById('p2CurrentVal').textContent = '0';
    document.getElementById('p1TotalVal').textContent = '0';
    document.getElementById('p2TotalVal').textContent = '0';

    // Verwijder oude classes
    ['p1CurrentCell', 'p2CurrentCell', 'p1NeededCell', 'p2NeededCell'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active-player', 'turn-hidden', 'dimmed');
    });

    // Activeer knoppen
    enableScoreButtons();

    // Sla state op en ga naar score-scherm
    saveStateToStorage();
    showPage(5);
    updateScoringPage();
};

// Helper functie voor score knoppen
function enableScoreButtons() {
    document.querySelectorAll('.score-btn').forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    });
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

        // PageUp (of Pijl Omhoog) = +1 punt (kort)
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
