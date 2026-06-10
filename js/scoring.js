// js/scoring.js - SCHONE VERSIE (GEEN DUBBELE FUNCTIES)

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

    const cn = state.currentPlayer === 1 ? state.currentMatch.p1 : state.currentMatch.p2;
    const btnName = document.getElementById('currentPlayerBtnName');
    if (btnName) btnName.textContent = cn;

    // 2. Spelerkaarten & Beurtenlijst
    const p1Card = document.getElementById('player1Card');
    const p2Card = document.getElementById('player2Card');
    
    if (p1Card && p2Card) {
        p1Card.className = `player-card ${state.player1.isWhite ? 'player-white' : 'player-yellow'} ${state.currentPlayer === 1 ? 'player-active' : 'player-inactive'}`;
        p2Card.className = `player-card ${state.player2.isWhite ? 'player-white' : 'player-yellow'} ${state.currentPlayer === 2 ? 'player-active' : 'player-inactive'}`;

        if (typeof updateCurrentTurnSize === 'function') updateCurrentTurnSize();

        // Helper functie voor beurt-weergave (56 beurten, hoogste reeks groen, 0 rood)
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
                        
                        if (score === highest && highest > 0) {
                            classes += ' highest-series';
                        }
                    }
                    
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

    // 4. Updates
    if (typeof updateSideScoreDisplays === 'function') updateSideScoreDisplays();
    updateCurrentScoreDisplay();
    updateHeaderButtons();
    
    const ub = document.getElementById('undoBtn');
    if (ub) ub.disabled = !window.lastStateBeforeAdd;
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
    
    const p1TotalCell = document.getElementById('p1TotalCell');
    const p2TotalCell = document.getElementById('p2TotalCell');

    if (p1CurrentEl) p1CurrentEl.textContent = state.currentInput;
    if (p2CurrentEl) p2CurrentEl.textContent = state.currentInput;

    const n1 = Math.max(0, state.player1.target - state.player1.score - (state.currentPlayer === 1 ? state.currentInput : 0));
    const n2 = Math.max(0, state.player2.target - state.player2.score - (state.currentPlayer === 2 ? state.currentInput : 0));
    
    if (p1NeededEl) p1NeededEl.textContent = n1;
    if (p2NeededEl) p2NeededEl.textContent = n2;

    const p1DisplayScore = state.player1.score + (state.currentPlayer === 1 ? state.currentInput : 0);
    const p2DisplayScore = state.player2.score + (state.currentPlayer === 2 ? state.currentInput : 0);
    
    if (p1TotalCell) document.getElementById('p1TotalVal').textContent = p1DisplayScore;
    if (p2TotalCell) document.getElementById('p2TotalVal').textContent = p2DisplayScore;

    p1CurrentCell.className = 'score-cell current-turn-cell';
    p2CurrentCell.className = 'score-cell current-turn-cell';
    
    if (state.currentPlayer === 1) {
        p1CurrentCell.classList.add('active-player');
        p2CurrentCell.classList.add('turn-hidden');
    } else {
        p2CurrentCell.classList.add('active-player');
        p1CurrentCell.classList.add('turn-hidden');
    }

    if (p1NeededCell) p1NeededCell.classList.toggle('dimmed', state.currentPlayer !== 1);
    if (p2NeededCell) p2NeededCell.classList.toggle('dimmed', state.currentPlayer !== 2);
    if (p1NeededCell) p1NeededCell.classList.toggle('danger', n1 <= 5 && n1 > 0);
    if (p2NeededCell) p2NeededCell.classList.toggle('danger', n2 <= 5 && n2 > 0);
    
    if (p1TotalCell) p1TotalCell.classList.toggle('dimmed', state.currentPlayer !== 1);
    if (p2TotalCell) p2TotalCell.classList.toggle('dimmed', state.currentPlayer !== 2);

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
    
    const pot = state.currentInput + delta;
    
    // ✅ Geen target-blokkade meer - vrij scoren boven target
    state.currentInput = Math.max(0, pot);
    
    if (delta > 0 && typeof playScoreSound === 'function') {
        playScoreSound(state.currentInput);
    }
    
    // ✅ VERWIJDERD: updateStaticNeededValues() - deze functie bestaat niet!
    updateCurrentScoreDisplay();
}

window.addScore = function() {
    if (state.matchEnded) return;

    const score = state.currentInput;
    const p = state.currentPlayer === 1 ? state.player1 : state.player2;
    const t = p.target;

    window.lastStateBeforeAdd = {
        player1: { score: state.player1.score, turns: [...state.player1.turns], beurtNummer: state.player1.beurtNummer, highestSeries: state.player1.highestSeries },
        player2: { score: state.player2.score, turns: [...state.player2.turns], beurtNummer: state.player2.beurtNummer, highestSeries: state.player2.highestSeries },
        currentPlayer: state.currentPlayer,
        turnNumber: state.turnNumber,
        isFirstPlayerInRound: state.isFirstPlayerInRound,
        firstToTarget: state.firstToTarget,
        isNabeurt: state.isNabeurt,
        matchEnded: state.matchEnded,
        currentInput: state.currentInput
    };

    p.score += score;
    p.turns.push(score);
    if (score > p.highestSeries) p.highestSeries = score;
    p.beurtNummer++;

    const reached = p.score >= t;

    if (reached && state.firstToTarget === null) {
        state.firstToTarget = state.currentPlayer;
        if (state.currentPlayer === 1) { 
            state.isNabeurt = true;
            state.currentPlayer = 2; 
            state.isFirstPlayerInRound = false;
            state.currentInput = 0;
            
            updateCurrentScoreDisplay();
            if (typeof updateSideScoreDisplays === 'function') updateSideScoreDisplays();
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

    if (state.isFirstPlayerInRound) {
        state.currentPlayer = 2;
        state.isFirstPlayerInRound = false;
    } else {
        state.currentPlayer = 1;
        state.isFirstPlayerInRound = true;
        state.turnNumber++;
    }

    state.currentInput = 0;

    if (typeof backupMatchSilently === 'function') {
        backupMatchSilently({
            matchId: state.currentMatch.id, player1: state.currentMatch.p1, player2: state.currentMatch.p2,
            date: state.currentMatch.date, p1Score: state.player1.score, p2Score: state.player2.score,
            p1Turns: [...state.player1.turns], p2Turns: [...state.player2.turns],
            currentPlayer: state.currentPlayer, isNabeurt: state.isNabeurt,
            firstToTarget: state.firstToTarget, completed: state.matchEnded
        });
    }

    updateCurrentScoreDisplay();
    if (typeof updateSideScoreDisplays === 'function') updateSideScoreDisplays();
    updateScoringPage();
}

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
    
    if (typeof saveStateToStorage === 'function') saveStateToStorage();
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
    
    if (typeof saveStateToStorage === 'function') saveStateToStorage();
    
    updateScoringPage();
    updateHeaderButtons();
    
    setTimeout(() => {
        renderMatchSummary();
        showPage(6);
    }, 600);
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
// BAL SELECTIE PAGINA (Pagina 4)
// ==========================================
window.updateBallSelectionPage = function() {
    if (!state.currentMatch) return;
    
    state.selectedWhitePlayer = null;
    
    const ball1Text = document.getElementById('whiteBall1Text');
    const ball2Text = document.getElementById('whiteBall2Text');
    
    if (ball1Text) ball1Text.textContent = state.currentMatch.p1;
    if (ball2Text) ball2Text.textContent = state.currentMatch.p2;
    
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
    
    // ✅ FIX: Verwijder 'selected' van alle ballen
    document.querySelectorAll('.ball-option').forEach(el => el.classList.remove('selected'));
    
    // ✅ FIX: Gebruik de playerNum parameter, niet event.currentTarget
    const ball1 = document.getElementById('whiteBall1');
    const ball2 = document.getElementById('whiteBall2');
    
    // Reset beide ballen
    ball1.classList.remove('selected', 'yellow');
    ball2.classList.remove('selected', 'yellow');
    
    // Voeg 'selected' toe aan de juiste bal
    if (playerNum === 1) {
        ball1.classList.add('selected');
        ball2.classList.add('yellow');
    } else {
        ball2.classList.add('selected');
        ball1.classList.add('yellow');
    }
    
    // Activeer start knop
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

    const originalP1 = state.currentMatch.p1;
    const originalP2 = state.currentMatch.p2;
    const originalTarget1 = state.currentMatch.target1;
    const originalTarget2 = state.currentMatch.target2;

    state.currentMatch.originalP1 = originalP1;
    state.currentMatch.originalP2 = originalP2;
    state.currentMatch.originalTarget1 = originalTarget1;
    state.currentMatch.originalTarget2 = originalTarget2;

    const tsg1 = state.players.find(p => p.name === originalP1)?.tsg || '−';
    const tsg2 = state.players.find(p => p.name === originalP2)?.tsg || '−';

    state.player1 = {
        score: 0, turns: [], target: 0, beurtNummer: 1,
        highestSeries: 0, isWhite: false, fixedTSG: '−'
    };
    state.player2 = {
        score: 0, turns: [], target: 0, beurtNummer: 1,
        highestSeries: 0, isWhite: false, fixedTSG: '−'
    };

    state.firstToTarget = null;
    state.isNabeurt = false;
    state.currentInput = 0;
    state.matchEnded = false;

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

    state.currentPlayer = 1;
    state.turnNumber = 1;
    state.isFirstPlayerInRound = true;
    state.pendingEnd = false;
    window.lastStateBeforeAdd = null;

    const alertEl = document.getElementById('matchEndedAlert');
    if (alertEl) alertEl.style.display = 'none';

    document.getElementById('p1CurrentVal').textContent = '0';
    document.getElementById('p2CurrentVal').textContent = '0';
    document.getElementById('p1TotalVal').textContent = '0';
    document.getElementById('p2TotalVal').textContent = '0';

    ['p1CurrentCell', 'p2CurrentCell', 'p1NeededCell', 'p2NeededCell'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active-player', 'turn-hidden', 'dimmed');
    });

    enableScoreButtons();

    if (typeof saveStateToStorage === 'function') saveStateToStorage();
    showPage(5);
    updateScoringPage();
};

function enableScoreButtons() {
    document.querySelectorAll('.score-btn').forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    });
}

// ==========================================
// ✅ HELPER: Highlight match (KOPPEL AAN WINDOW ZODAT HIJ ALTIJD GEVONDEN WORDT)
// ==========================================
window.highlightMatch = function(cards) {
    if (!cards || cards.length === 0) return;
    
    // Zorg dat de index een geldig getal is
    if (typeof window.matchListFocusIndex !== 'number') {
        window.matchListFocusIndex = 0;
    }
    
    // Verwijder 'focused' van alle kaarten
    cards.forEach(c => c.classList.remove('focused'));
    
    Voeg 'focused' toe aan de huidige kaart en scroll ernaartoe
    if (cards[window.matchListFocusIndex]) {
        cards[window.matchListFocusIndex].classList.add('focused');
        cards[window.matchListFocusIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
};

// ==========================================
// PRESENTER CONTROLS
// ==========================================
function initPresenterControls() {
    let pageUpStartTime = null;
    let lastScoreTime = 0;
    const COOLDOWN = 1000;
    let lastTabTime = 0;
    window.matchListFocusIndex = 0;

    document.addEventListener('keydown', function(event) {
        const activePage = document.querySelector('.page.active');
        if (!activePage) return;
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

        const key = event.key;
        const code = event.code;
        const now = Date.now();

        // 🚫 BLOKKEER ESCAPE OP SCORE-SCHERM
        if (activePage.id === 'page5' && (key === 'Escape' || code === 'Escape')) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        // ✅ PAGINA 1: Datum wijzigen + Matchen ophalen
        if (activePage.id === 'page1') {
            if (key === 'ArrowUp' || key === 'PageUp') {
                event.preventDefault();
                const dateInput = document.getElementById('dateSelect');
                if (dateInput && dateInput.value) {
                    const d = new Date(dateInput.value);
                    d.setDate(d.getDate() + 1);
                    dateInput.value = d.toISOString().split('T')[0];
                    state.selectedDate = dateInput.value;
                }
                return;
            }
            if (key === 'ArrowDown' || key === 'PageDown') {
                event.preventDefault();
                const dateInput = document.getElementById('dateSelect');
                if (dateInput && dateInput.value) {
                    const d = new Date(dateInput.value);
                    d.setDate(d.getDate() - 1);
                    dateInput.value = d.toISOString().split('T')[0];
                    state.selectedDate = dateInput.value;
                }
                return;
            }
            if (key === 'Tab' || key === 'Enter') {
                event.preventDefault();
                if (typeof window.goToPage2 === 'function') window.goToPage2();
                return;
            }
            return;
        }

        // ✅ PAGINA 2: Door matchen navigeren + selecteren
        if (activePage.id === 'page2') {
            const cards = document.querySelectorAll('#matchList .match-card');
            if (cards.length > 0) {
                window.matchListFocusIndex = Math.max(0, Math.min(window.matchListFocusIndex, cards.length - 1));
                if (key === 'PageDown' || key === 'ArrowDown') {
                    event.preventDefault();
                    window.matchListFocusIndex = Math.min(window.matchListFocusIndex + 1, cards.length - 1);
                    window.highlightMatch(cards); // ✅ Gebruik nu window.highlightMatch
                } else if (key === 'PageUp' || key === 'ArrowUp') {
                    event.preventDefault();
                    window.matchListFocusIndex = Math.max(window.matchListFocusIndex - 1, 0);
                    window.highlightMatch(cards); // ✅ Gebruik nu window.highlightMatch
                } else if (key === 'Tab') {
                    event.preventDefault();
                    cards[window.matchListFocusIndex].click();
                }
            }
            return;
        }

        // ✅ PAGINA 4: Witte bal kiezen + match starten
        if (activePage.id === 'page4') {
            if (key === 'PageUp' || key === 'ArrowUp') {
                event.preventDefault();
                if (typeof window.selectWhitePlayer === 'function') window.selectWhitePlayer(1);
            } else if (key === 'PageDown' || key === 'ArrowDown') {
                event.preventDefault();
                if (typeof window.selectWhitePlayer === 'function') window.selectWhitePlayer(2);
            } else if (key === 'Tab') {
                event.preventDefault();
                if (typeof window.startMatch === 'function' && state.selectedWhitePlayer) window.startMatch();
            }
            return;
        }

        // ✅ PAGINA 5: SCORING
        if (activePage.id === 'page5') {
            if (!state.currentMatch || state.matchEnded) return;

            if (key === 'PageUp' || key === 'ArrowUp') {
                event.preventDefault();
                pageUpStartTime = Date.now();
                return;
            }
            if (key === 'PageDown' || key === 'ArrowDown') {
                event.preventDefault();
                if (now - lastScoreTime >= COOLDOWN) {
                    if (typeof window.changeScore === 'function') window.changeScore(-1);
                    lastScoreTime = now;
                }
                return;
            }
            if (key === 'b' || key === 'B' || code === 'KeyB') {
                event.preventDefault();
                if (typeof window.undoLastAdd === 'function') window.undoLastAdd();
                lastScoreTime = now;
                return;
            }
            if (key === 'Tab') {
                event.preventDefault();
                if (now - lastTabTime < 500) return;
                lastTabTime = now;
                if (typeof window.addScore === 'function') window.addScore();
            }
            return;
        }
    });

    // 🔼 KEYUP: beslis bij PageUp loslaten (alleen voor Pagina 5)
    document.addEventListener('keyup', function(event) {
        const activePage = document.querySelector('.page.active');
        if (!activePage || activePage.id !== 'page5') return;

        if (event.key === 'PageUp' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (pageUpStartTime === null) return;
            
            const holdDuration = Date.now() - pageUpStartTime;
            pageUpStartTime = null;

            if (holdDuration >= 2000) {
                const p1T = state.player1.turns?.length || 0;
                const p2T = state.player2.turns?.length || 0;
                if (p1T === 0 && p2T === 0) {
                    if (typeof window.showPage === 'function') window.showPage(1);
                }
            } else {
                if (Date.now() - lastScoreTime >= COOLDOWN) {
                    if (typeof window.changeScore === 'function') window.changeScore(1);
                    lastScoreTime = Date.now();
                }
            }
        }
    });
}


// ==========================================
// MATCH SAMENVATTING RENDEREN (Pagina 6)
// ==========================================
function renderMatchSummary() {
    if (!state.currentMatch) return;

    const calcAvg = (score, turns) => (!turns || turns === 0) ? "0,00" : (score / turns).toFixed(2).replace('.', ',');
    
    const getTSG = (playerName) => {
        const player = state.players.find(p => p.name === playerName);
        return player ? (player.tsg || player.fixedTSG || '−') : '−';
    };

    const renderTurnsHorizontal = (turns) => {
        if (!turns || turns.length === 0) {
            return '<div style="color: #7f8c8d; text-align: center; padding: 10px;">Geen beurten gespeeld</div>';
        }
        
        const highest = Math.max(...turns);
        let html = '<div class="summary-turns-list">';
        
        turns.forEach((score, index) => {
            let classes = 'summary-turn';
            let displayScore = score;
            
            if (score === highest && highest > 0) {
                classes += ' highest';
            } else if (score === 0) {
                classes += ' zero';
                displayScore = '-';
            }
            
            html += `
                <div class="${classes}">
                    <div class="summary-turn-number">B${index + 1}</div>
                    <div class="summary-turn-score">${displayScore}</div>
                </div>
            `;
        });
        
        return html + '</div>';
    };

    const p1Name = state.currentMatch.p1;
    const p1Score = state.player1.score;
    const p1Turns = state.player1.turns.length;
    const p1Highest = state.player1.highestSeries;
    const p1Avg = calcAvg(p1Score, p1Turns);
    const p1Target = state.player1.target;
    const p1TSG = getTSG(p1Name);

    const p2Name = state.currentMatch.p2;
    const p2Score = state.player2.score;
    const p2Turns = state.player2.turns.length;
    const p2Highest = state.player2.highestSeries;
    const p2Avg = calcAvg(p2Score, p2Turns);
    const p2Target = state.player2.target;
    const p2TSG = getTSG(p2Name);

    const html1 = `
        <div class="summary-player-name">${p1Name} ⚪</div>
        
        <div class="summary-stats-grid">
            <div class="summary-stat">
                <div class="summary-label">Eindscore</div>
                <div class="summary-value">${p1Score}</div>
            </div>
            <div class="summary-stat">
                <div class="summary-label">Beurten</div>
                <div class="summary-value">${p1Turns}</div>
            </div>
            <div class="summary-stat">
                <div class="summary-label">Hoogste</div>
                <div class="summary-value">${p1Highest}</div>
            </div>
        </div>
        
        <div class="summary-stats-grid">
            <div class="summary-stat">
                <div class="summary-label">Target</div>
                <div class="summary-value">${p1Target}</div>
            </div>
            <div class="summary-stat">
                <div class="summary-label">Gemiddelde</div>
                <div class="summary-value">${p1Avg}</div>
            </div>
            <div class="summary-stat tsg-stat">
                <div class="summary-label">TSG</div>
                <div class="summary-value">${p1TSG}</div>
            </div>
        </div>
        
        <div class="summary-turns-container">
            <div class="summary-turns-title">📊 Alle Beurten</div>
            ${renderTurnsHorizontal(state.player1.turns)}
        </div>
    `;

    const html2 = `
        <div class="summary-player-name">${p2Name} 🟡</div>
        
        <div class="summary-stats-grid">
            <div class="summary-stat">
                <div class="summary-label">Eindscore</div>
                <div class="summary-value">${p2Score}</div>
            </div>
            <div class="summary-stat">
                <div class="summary-label">Beurten</div>
                <div class="summary-value">${p2Turns}</div>
            </div>
            <div class="summary-stat">
                <div class="summary-label">Hoogste</div>
                <div class="summary-value">${p2Highest}</div>
            </div>
        </div>
        
        <div class="summary-stats-grid">
            <div class="summary-stat">
                <div class="summary-label">Target</div>
                <div class="summary-value">${p2Target}</div>
            </div>
            <div class="summary-stat">
                <div class="summary-label">Gemiddelde</div>
                <div class="summary-value">${p2Avg}</div>
            </div>
            <div class="summary-stat tsg-stat">
                <div class="summary-label">TSG</div>
                <div class="summary-value">${p2TSG}</div>
            </div>
        </div>
        
        <div class="summary-turns-container">
            <div class="summary-turns-title">📊 Alle Beurten</div>
            ${renderTurnsHorizontal(state.player2.turns)}
        </div>
    `;

    document.getElementById('summaryPlayer1').innerHTML = html1;
    document.getElementById('summaryPlayer2').innerHTML = html2;
}

