// js/scoring.js - SCHONE VERSIE (GEEN DUBBELE FUNCTIES)

// ==========================================
// 📡 MATCH STATUS UPDATEN NAAR SERVER
// ==========================================
async function updateMatchStatusOnServer(matchId, status) {
    try {
        console.log(`📡 Stuur signaal: Match ${matchId} is nu '${status}'`);
        
        const response = await fetch("https://kpbc.pythonanywhere.com/api/match-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                match_id: matchId,
                status: status
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Server bevestigd:`, data);
        } else {
            console.error("❌ Server fout:", await response.text());
        }
    } catch (error) {
        // Foutafhandeling zodat de app niet crasht als het internet even wegvalt
        console.error("❌ Netwerkfout (match gaat lokaal gewoon door):", error);
    }
}


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

    // ✅ 2. DYNAMISCHE DISCIPLINE BADGE (vervangt het zwaardje)
    const disc = (state.currentMatch.discipline || "").toLowerCase();
    const cat = state.currentMatch.cat || "?";
    
    let abbr = "??";
    let colorClass = "";

    // ✅ FIX: Check "drie" EERST, want "Driebanden" bevat ook "band"
    if (disc.includes("drie") || disc.includes("3")) {
        abbr = "DB";
        colorClass = "badge-db";
    } else if (disc.includes("band")) {
        abbr = "BS";
        colorClass = "badge-bs";
    } else if (disc.includes("vrij")) {
        abbr = "VS";
        colorClass = "badge-vs";
    }

    // Update het HTML element met de nieuwe gekleurde box
    const badgeElement = document.getElementById('headerDisciplineBadge');
    if (badgeElement) {
        badgeElement.innerHTML = `<span class="discipline-badge ${colorClass}">${abbr}-${cat}</span>`;
    }

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

        // ✅ 1. Haal de discipline en categorie op
        const disc = state.currentMatch.discipline || "";
        const cat = state.currentMatch.cat || "";
        // Maak een subtiele tekst, bijv: "Vrijspel • Cat. 2"
        const matchInfo = (disc && cat) ? `<span class="match-info-badge">${disc} • ${cat}</span>` : "";

        // ✅ 2. Update Speler 1 kaart
        p1Card.innerHTML = `
            <div>
                <h3>
                    ${state.currentMatch.p1} ${state.player1.isWhite ? '⚪' : '🟡'}
                    ${matchInfo} <!-- Hier wordt de info toegevoegd -->
                </h3>
            </div>
            <div class="turns-scroll-container">
                <div class="turns-list">${renderTurns(state.player1.turns, state.player1)}</div>
            </div>`;

        // ✅ 3. Update Speler 2 kaart
        p2Card.innerHTML = `
            <div>
                <h3>
                    ${state.currentMatch.p2} ${state.player2.isWhite ? '⚪' : '🟡'}
                    ${matchInfo} <!-- Hier wordt de info toegevoegd -->
                </h3>
            </div>
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
        <div style="text-align:center; pointer-events: none;">
            <div style="font-size:6.5rem; font-weight:900; color:${textColor}; line-height:1; text-shadow: 0 0 25px ${glowColor}; transition: color 0.3s ease;">
                B ${currentBeurt}
            </div>
            <div style="margin-top:15px; font-size:1.1rem; color:#bdc3c7; font-weight:bold; text-transform: uppercase; letter-spacing: 1px;">
                Einde beurt? Klik hier
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
// 🗣️ SPRAAKFEEDBACK VOOR PUNTEN
// ==========================================
function playScoreSound(score) {
    if ('speechSynthesis' in window) {
        // Annuleer lopende spraak om overlapping te voorkomen bij snel klikken
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(String(score));
        utterance.lang = 'nl-NL'; // Spreek uit in het Nederlands
        utterance.rate = 1.1;     // Iets sneller dan standaard
        utterance.pitch = 1.0;    // Normale toonhoogte
        
        window.speechSynthesis.speak(utterance);
    }
}

// ==========================================
// SCORE ACTIES
// ==========================================
window.changeScore = function(delta) {
    if (state.matchEnded) return;
    
    const pot = state.currentInput + delta;
    state.currentInput = Math.max(0, pot);
    
    // ✅ HIER ROEPEN WE DE SPRAAKFUNCTIE AAN ALS ER PUNTEN BIJ KOMEN (+)
    if (delta > 0) {
        playScoreSound(state.currentInput);
    }
    
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

    // ✅ CHECK: Is dit de allereerste beurt van de match?
    if (state.player1.turns.length === 1 && state.player2.turns.length === 0) {
        if (!state.currentMatch.isReportedStarted) {
            state.currentMatch.isReportedStarted = true;
            updateMatchStatusOnServer(state.currentMatch.id, "gestart");
        }
    }

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
    console.log("🔥 END MATCH FUNCTIE AANGEROEPEN!"); // ✅ VOEG DEZE REGEL TOE
    
    state.matchEnded = true;
    state.currentMatch.completed = true;
    
    // ✅ STUUR SIGNAAL NAAR SERVER DAT MATCH GESPEELD IS
    updateMatchStatusOnServer(state.currentMatch.id, "voltooid");
    
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
    // We beheren nu de knop onderaan in plaats van in de header
    const bottomUndoBtn = document.getElementById('bottomUndoBtn');
    if (bottomUndoBtn) {
        if (state.matchEnded) {
            bottomUndoBtn.disabled = true;
            bottomUndoBtn.textContent = '🏠 Hoofdmenu';
            bottomUndoBtn.onclick = () => window.showPage(1);
            bottomUndoBtn.style.backgroundColor = '#2ecc71'; // Groen voor hoofdmenu
        } else {
            bottomUndoBtn.disabled = !window.lastStateBeforeAdd;
            bottomUndoBtn.textContent = '↩️';
            bottomUndoBtn.onclick = () => window.undoLastAdd();
            bottomUndoBtn.style.backgroundColor = ''; // Reset naar CSS standaard
        }
    }
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
    
    if (typeof window.matchListFocusIndex !== 'number') {
        window.matchListFocusIndex = 0;
    }
    
    cards.forEach(c => c.classList.remove('focused'));
    
    // Voeg 'focused' toe aan de huidige kaart en scroll ernaartoe
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
                window.syncAndGoToMatches();  // ✅ DIRECT DE JUISTE FUNCTIE
                return;
            }
            return;
        }

     
        // ✅ PAGINA 2 OF 11: Door matchen navigeren + selecteren
        if (activePage.id === 'page2' || activePage.id === 'page11') {
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

// ✅ NAVIGATIE NAAR VRIENDSCHAPPELIJKE MATCH PAGINA
window.startFriendlyMatch = function() {
    // 1. Verberg alle pagina's
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 2. Toon de vriendschappelijke configuratiepagina
    const friendlyPage = document.getElementById('pageFriendly');
    if (friendlyPage) {
        friendlyPage.classList.add('active');
    }
    
    console.log("🍻 Navigatie naar Vriendschappelijke Match configuratie");
};

// ✅ 1. RESET FUNCTIE: Zorgt dat alles normaal is bij terugkeer naar Pagina 1
window.resetPage1State = function() {
    const officialContainer = document.getElementById('containerOfficial');
    const friendlyContainer = document.getElementById('containerFriendly');
    
    if (officialContainer) officialContainer.classList.remove('inactive-mode');
    if (friendlyContainer) friendlyContainer.classList.remove('inactive-mode');
};

// ✅ 2. HOVER LOGICA: Dim het andere vak ZODRA je over een knop gaat
document.addEventListener("DOMContentLoaded", function() {
    const btnOfficial = document.querySelector('#containerOfficial .next-btn');
    const btnFriendly = document.querySelector('#containerFriendly .friendly-btn');
    const contOfficial = document.getElementById('containerOfficial');
    const contFriendly = document.getElementById('containerFriendly');

    if (btnOfficial && btnFriendly && contOfficial && contFriendly) {
        // Hover over Officiële knop -> dim Vriendschappelijk vak
        btnOfficial.addEventListener('mouseenter', () => contFriendly.classList.add('inactive-mode'));
        btnOfficial.addEventListener('mouseleave', () => contFriendly.classList.remove('inactive-mode'));

        // Hover over Vriendschappelijke knop -> dim Officieel vak
        btnFriendly.addEventListener('mouseenter', () => contOfficial.classList.add('inactive-mode'));
        btnFriendly.addEventListener('mouseleave', () => contOfficial.classList.remove('inactive-mode'));
    }
});

// ✅ 3. KLIK LOGICA: Dim definitief en voer actie uit
window.selectMode = function(mode) {
    // Eerst alles resetten om 'stuck' states te voorkomen
    window.resetPage1State();

    const officialContainer = document.getElementById('containerOfficial');
    const friendlyContainer = document.getElementById('containerFriendly');
    
    if (mode === 'official') {
        officialContainer.classList.remove('inactive-mode');
        friendlyContainer.classList.add('inactive-mode'); // Blijf gedimd tijdens actie
        
        if (typeof syncAndGoToMatches === 'function') {
            syncAndGoToMatches();
        }
    } else if (mode === 'friendly') {
        friendlyContainer.classList.remove('inactive-mode');
        officialContainer.classList.add('inactive-mode'); // Blijf gedimd tijdens actie
        
        if (typeof window.startFriendlyMatch === 'function') {
            window.startFriendlyMatch();
        }
    }
};


/* =========================================================================
   ✅ VRIENDSCHAPPELIJKE MATCH: CONFIGURATIE LOGICA (GEUPDATE & WATERDICHT)
   ========================================================================= */

// 1. SPELERS KIEZEN (AANGEPAST)
window.selectPlayers = function(numPlayers) {
    // Reset alle spelers-kaartjes
    document.querySelectorAll('#step1Players .config-card').forEach(card => {
        card.classList.remove('selected', 'dimmed');
    });
    
    const selectedCard = document.querySelector(`#step1Players .config-card[data-players="${numPlayers}"]`);
    if (selectedCard) selectedCard.classList.add('selected');
    
    document.querySelectorAll('#step1Players .config-card').forEach(card => {
        if (card !== selectedCard) card.classList.add('dimmed');
    });

    document.querySelectorAll('#step2GameType .config-card').forEach(card => {
        card.classList.remove('dimmed', 'selected');
    });
    
    const step2 = document.getElementById('step2GameType');
    if (step2) step2.classList.remove('hidden');
    
    // ✅ NIEUW: Bouw de spelers-display dynamisch op
    window.buildPlayersDisplay(numPlayers);
    
    state.friendlyMatch = state.friendlyMatch || {};
    state.friendlyMatch.numPlayers = numPlayers;
};


// ✅ NIEUW: Bouw de display voor het gekozen aantal spelers
window.buildPlayersDisplay = function(numPlayers) {
    const container = document.getElementById('chosenPlayersContainer');
    if (!container) return;
    
    // ✅ Expliciete toewijzing van icoon aan speler-nummer
    const icons = {
        1: "🧙‍♂️",
        2: "👷‍♂️",
        3: "👮‍♂️",
        4: "👨‍🚀"
    };
    
    let html = '';
    for (let i = 1; i <= numPlayers; i++) {
        html += `<div class="chosen-player" id="displayPlayer${i}">
                    ${icons[i]} Speler ${i}: Nog niet gekozen
                 </div>`;
    }
    
    container.innerHTML = html;
    
    // Verberg het blok voorlopig (totdat er minstens 1 speler gekozen is)
    document.getElementById('step3PlayersDisplay').classList.add('hidden');
};


// 2. SPELTYPE KIEZEN
window.selectGameType = function(gameType) {
    // A. Reset alle speltype-kaartjes
    document.querySelectorAll('#step2GameType .config-card').forEach(card => {
        card.classList.remove('selected', 'dimmed');
    });
    
    // B. Markeer de gekozen kaart
    const selectedCard = document.querySelector(`#step2GameType .config-card[data-gametype="${gameType}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // C. Dim de andere speltype-kaartjes
    document.querySelectorAll('#step2GameType .config-card').forEach(card => {
        if (card !== selectedCard) {
            card.classList.add('dimmed');
        }
    });
    
    // D. Sla op in state
    state.friendlyMatch = state.friendlyMatch || {};
    state.friendlyMatch.gameType = gameType;
    
    console.log(`✅ Speltype gekozen: ${gameType}`);
    
    // ✅ NIEUW: Verberg Stap 1 (Aantal spelers) voor meer ruimte
    const step1 = document.getElementById('step1Players');
    if (step1) step1.classList.add('hidden');
    
    // ✅ NIEUW: Open direct de speler-selectie modal voor Speler 1
    setTimeout(() => {
        window.openPlayerSelection(1);
    }, 200);
};

// 3. RESET KNOP LOGICA (100% Waterdicht)
window.resetFriendlyConfig = function() {
    console.log("🔄 Reset knop geactiveerd!");
    
    // 1. Verwijder ALLE selecties en schaduwen van ALLE kaartjes op de pagina
    document.querySelectorAll('#pageFriendly .config-card').forEach(card => {
        card.classList.remove('selected', 'dimmed');
    });
    
    // 2. Verberg Stap 2, Stap 3 en Stap 4 expliciet
    const step2 = document.getElementById('step2GameType');
    if (step2) step2.classList.add('hidden');
    
    const step3 = document.getElementById('step3PlayersDisplay');
    if (step3) step3.classList.add('hidden');
    
    const step4 = document.getElementById('step4TeamSetup');
    if (step4) step4.classList.add('hidden');
    
    // 3. Zorg dat Stap 1 weer ZICHTBAAR en AANKLIKBAR wordt
    const step1 = document.getElementById('step1Players');
    if (step1) {
        step1.classList.remove('hidden');
        step1.style.display = ''; // ✅ Verwijder de geforceerde inline 'display: none'
        console.log("✅ Stap 1 is weer zichtbaar en aanklikbaar gemaakt");
    }
    
    // 4. Wis de data volledig uit de state
    state.friendlyMatch = null;
    console.log("🗑️ Friendly match state gewist");
    
    // 5. Scroll netjes naar boven voor de beste gebruikerservaring
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 4. ZORG DAT RESET OOK Werkt als we via "Terug" naar Pagina 1 gaan
const originalResetPage1State = window.resetPage1State;
window.resetPage1State = function() {
    if (originalResetPage1State) originalResetPage1State();
    window.resetFriendlyConfig(); 
};


/* =========================================================================
   ✅ PLAYER SELECTIE MODAL LOGICA
   ========================================================================= */

// ✅ HAAL ECHTE SPELERS OP UIT STATE.PLAYERS
function getPlayerNames() {
    // Check of er spelers zijn geladen
    if (!state.players || state.players.length === 0) {
        console.warn("⚠️ Geen spelers geladen in state.players");
        return [];
    }
    
    // Haal alle unieke namen op (een speler kan meerdere stats hebben)
    const uniqueNames = new Set();
    state.players.forEach(player => {
        if (player.name && player.name.trim()) {
            uniqueNames.add(player.name.trim());
        }
    });
    
    // Converteer naar array en sorteer alfabetisch
    const sortedNames = Array.from(uniqueNames).sort((a, b) => a.localeCompare(b));
    
    console.log(`✅ ${sortedNames.length} unieke spelersnamen geladen voor modal`);
    return sortedNames;
}

let currentPlayerSlot = 1; // 1 of 2
let currentSearchString = "";

/* =========================================================================
   ✅ UNIFIED PLAYER SELECTIE MODAL LOGICA
   ========================================================================= */

let isGuestMode = false;

// 1. Open de modal (start altijd in Clublid modus)
window.openPlayerSelection = function(playerNum) {
    console.log(`🔧 openPlayerSelection aangeroepen voor speler ${playerNum}`);
    
    currentPlayerSlot = playerNum;
    currentSearchString = "";
    
    const icons = { 1: "🧙‍♂️", 2: "👷‍♂️", 3: "👮‍♂️", 4: "👨‍🚀" };
    const icon = icons[playerNum] || "👤";
    
    const titleEl = document.getElementById('modalTitle');
    if (titleEl) {
        titleEl.textContent = `Speler ${playerNum} (${icon}) instellen`;
        console.log(`✅ Titel ingesteld: ${titleEl.textContent}`);
    } else {
        console.error('❌ modalTitle element niet gevonden!');
    }
    
    const modal = document.getElementById('playerSelectModal');
    if (modal) {
        console.log(`📦 Modal classes voor remove: ${modal.className}`);
        modal.classList.remove('hidden');
        console.log(`📦 Modal classes na remove: ${modal.className}`);
        console.log(`👁️ Modal display: ${window.getComputedStyle(modal).display}`);
    } else {
        console.error('❌ playerSelectModal element niet gevonden!');
    }
    
    // Start standaard in Clublid modus
    if (typeof window.setMode === 'function') {
        window.setMode('club');
        console.log('✅ setMode("club") aangeroepen');
    } else {
        console.error('❌ window.setMode functie niet gevonden!');
    }
};

// 2. Schakel tussen Modus
window.setMode = function(mode) {
    currentSearchString = "";
    window.updateSearchDisplay();
    
    const btnClub = document.getElementById('btnModeClub');
    const btnGuest = document.getElementById('btnModeGuest');
    
    if (mode === 'club') {
        isGuestMode = false;
        
        btnClub.classList.add('mode-active-club');
        btnGuest.classList.remove('mode-active-guest');
        
        // Toon spelerslijst
        window.renderPlayerList();
        
    } else if (mode === 'guest') {
        isGuestMode = true;
        
        btnGuest.classList.add('mode-active-guest');
        btnClub.classList.remove('mode-active-club');
        
        // Toon hint in plaats van spelerslijst
        document.getElementById('playerList').innerHTML = 
            '<div class="player-list-item" style="color: #95a5a6; text-align: center; font-style: italic; padding: 40px 20px;">Type de naam van de gast met de letters en de groene spatiebalk...</div>';
    }
};

// 3. Render A-Z Grid + SPATIE (Wordt 1x aangeroepen bij openen)
window.renderAlphabetGrid = function() {
    const grid = document.getElementById('alphabetGrid');
    if (grid.children.length > 0) return; // Al gerenderd? Stop.
    
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let char of alphabet) {
        const btn = document.createElement('button');
        btn.className = 'alpha-btn';
        btn.textContent = char;
        btn.onclick = () => window.addSearchLetter(char);
        grid.appendChild(btn);
    }
    
    // Spatie knop
    const spaceBtn = document.createElement('button');
    spaceBtn.className = 'alpha-btn space-bar';
    spaceBtn.textContent = '⎵ SPATIE';
    spaceBtn.onclick = () => window.addSearchLetter(' ');
    grid.appendChild(spaceBtn);
};

// Roep dit 1x aan bij het laden van de pagina (voeg dit toe onderaan je JS bestand)
window.renderAlphabetGrid();

// 4. Update het invoervak
window.updateSearchDisplay = function() {
    const display = document.getElementById('currentSearchText');
    if (display) display.textContent = currentSearchString;
};

// 5. Voeg letter toe
window.addSearchLetter = function(letter) {
    currentSearchString += letter;
    window.updateSearchDisplay();
    if (!isGuestMode) window.renderPlayerList();
};

// 6. Wis laatste letter
window.clearSearchLetter = function() {
    currentSearchString = currentSearchString.slice(0, -1);
    window.updateSearchDisplay();
    if (!isGuestMode) window.renderPlayerList();
};

// 7. Render de gefilterde spelerslijst (MET DUBBELE-CONTROLE)
window.renderPlayerList = function() {
    const listContainer = document.getElementById('playerList');
    listContainer.innerHTML = '';
    
    const allPlayers = getPlayerNames();
    if (allPlayers.length === 0) {
        listContainer.innerHTML = '<div class="player-list-item" style="color: #e74c3c; text-align: center;">⚠️ Geen spelers geladen<br><small>Sync eerst via Beheer Matchen</small></div>';
        return;
    }
    
    // ✅ NIEUW: Haal al gekozen spelers op
    const alreadyChosen = [];
    if (state.friendlyMatch && state.friendlyMatch.players) {
        Object.values(state.friendlyMatch.players).forEach(name => {
            if (name) alreadyChosen.push(name);
        });
    }
    
    const filtered = allPlayers.filter(player => {
        // Filter op zoekstring EN niet al gekozen
        const matchesSearch = player.toUpperCase().startsWith(currentSearchString);
        const notChosenYet = !alreadyChosen.includes(player);
        return matchesSearch && notChosenYet;
    });
    
    if (filtered.length === 0) {
        const msg = alreadyChosen.length > 0 
            ? 'Geen beschikbare spelers voor "' + currentSearchString + '"<br><small>(Sommige zijn al gekozen)</small>'
            : 'Geen resultaten voor "' + currentSearchString + '"';
        listContainer.innerHTML = `<div class="player-list-item" style="color: #95a5a6; text-align: center;">${msg}</div>`;
        return;
    }
    
    filtered.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-list-item';
        const regex = new RegExp(`^(${currentSearchString})`, 'i');
        item.innerHTML = player.replace(regex, '<span style="color: #2ecc71; font-weight: 900;">$1</span>');
        
        // ✅ NIEUW: Klikken zet naam in zoekbalk, sluit NIET direct
        item.onclick = () => {
            currentSearchString = player;
            window.updateSearchDisplay();
            console.log(`📝 Naam in zoekbalk gezet: ${player}`);
        };
        
        listContainer.appendChild(item);
    });
};

// 8. Bevestig naam (werkt voor ZOWEL Clublid als Gast)
window.confirmTypedName = function() {
    if (currentSearchString.trim() === "") {
        alert("⚠️ Voer eerst een naam in!\n\nKlik op een naam uit de lijst of typ een naam met de letters.");
        return;
    }
    
    // ✅ Check of deze naam al gekozen is
    if (state.friendlyMatch && state.friendlyMatch.players) {
        const alreadyChosen = Object.values(state.friendlyMatch.players);
        if (alreadyChosen.includes(currentSearchString.trim())) {
            alert(`⚠️ "${currentSearchString.trim()}" is al gekozen als een andere speler!\n\nKies een andere speler.`);
            return;
        }
    }
    
    window.finalizePlayerSelection(currentSearchString.trim());
};
// 9. Finaliseer keuze
window.finalizePlayerSelection = function(playerName) {
    console.log(`✅ Speler ${currentPlayerSlot} gekozen: ${playerName}`);
    
    // Sla op in state
    state.friendlyMatch = state.friendlyMatch || {};
    if (!state.friendlyMatch.players) state.friendlyMatch.players = {};
    state.friendlyMatch.players[currentPlayerSlot] = playerName;
    
    // Update de display met het juiste icoontje
    const icons = { 1: "🧙‍♂️", 2: "👷‍♂️", 3: "👮‍♂️", 4: "👨‍🚀" };
    const displayEl = document.getElementById(`displayPlayer${currentPlayerSlot}`);
    if (displayEl) displayEl.textContent = `${icons[currentPlayerSlot]} ${playerName}`;
    
    // Toon het display blok
    document.getElementById('step3PlayersDisplay').classList.remove('hidden');
    
    // Sluit de modal
    window.closePlayerModal();
    
    const totalPlayers = state.friendlyMatch.numPlayers || 2;
    
    if (currentPlayerSlot < totalPlayers) {
        // Nog niet alle spelers gekozen? Open de volgende
        setTimeout(() => {
            console.log(`🔄 Open nu modal voor Speler ${currentPlayerSlot + 1}`);
            window.openPlayerSelection(currentPlayerSlot + 1);
        }, 600);
        
    } else {
        // Alle spelers zijn gekozen!
        console.log(`🎉 Alle ${totalPlayers} spelers zijn gekozen!`);
        
        if (totalPlayers === 4) {
            // 4 spelers: toon team indeling (Stap 4)
            setTimeout(() => {
                window.showTeamSetup();
                document.getElementById('step4TeamSetup').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        } else {
            // ✅ NIEUW: 2 of 3 spelers: ga DIRECT naar Pagina 13 (Bal Selectie)
            setTimeout(() => {
                console.log(`🎱 Ga naar Pagina 13 voor ${totalPlayers} spelers`);
                window.prepareFriendlyBallSelection();
                showPage(13);
            }, 500);
        }
    }
};


/* =========================================================================
   ✅ SMART DISABLE: TEAM INDDELING LOGICA
   ========================================================================= */

// Roep deze functie aan nadat de 4e speler is gekozen
window.showTeamSetup = function() {
    const players = state.friendlyMatch.players;
    if (!players || Object.keys(players).length !== 4) return;

    // Initialiseer state voor teams en volgorde als die nog niet bestaat
    if (!state.friendlyMatch.teams) state.friendlyMatch.teams = {};
    if (!state.friendlyMatch.orders) state.friendlyMatch.orders = {};

    const container = document.getElementById('teamSetupRows');
    container.innerHTML = '';

    const icons = { 1: "🧙‍♂️", 2: "👷‍♂️", 3: "👮‍♂️", 4: "👨‍🚀" };

    // Bouw de 4 rijen
    for (let i = 1; i <= 4; i++) {
        const playerName = players[i] || `Speler ${i}`;
        const row = document.createElement('div');
        row.className = 'team-setup-row';
        row.id = `teamRow${i}`;
        row.innerHTML = `
            <div class="player-name-label">${icons[i]} ${playerName}</div>
            <div class="toggle-group">
                <button class="toggle-btn" id="t1-btn-${i}" onclick="window.assignTeam(${i}, 1)">Team 1</button>
                <button class="toggle-btn" id="t2-btn-${i}" onclick="window.assignTeam(${i}, 2)">Team 2</button>
            </div>
            <div class="toggle-group">
                <button class="toggle-btn" id="o1-btn-${i}" onclick="window.assignOrder(${i}, 1)">1e</button>
                <button class="toggle-btn" id="o2-btn-${i}" onclick="window.assignOrder(${i}, 2)">2e</button>
            </div>
        `;
        container.appendChild(row);
    }

    document.getElementById('step4TeamSetup').classList.remove('hidden');
    window.updateTeamButtons(); // Pas direct de Smart Disable regels toe
};

// 1. Wijs team toe
window.assignTeam = function(playerNum, teamNum) {
    state.friendlyMatch.teams[playerNum] = teamNum;
    // Reset volgorde als team verandert, om conflicten te voorkomen
    state.friendlyMatch.orders[playerNum] = null; 
    window.updateTeamButtons();
};

// 2. Wijs volgorde toe
window.assignOrder = function(playerNum, orderNum) {
    state.friendlyMatch.orders[playerNum] = orderNum;
    window.updateTeamButtons();
};

// 3. DE SMART DISABLE LOGICA (100% Waterdicht)
window.updateTeamButtons = function() {
    const teams = state.friendlyMatch.teams;
    const orders = state.friendlyMatch.orders;
    let allComplete = true;

    // 1. Tel en check bezette plekken per team én per positie
    let t1Count = 0, t2Count = 0;
    let t1HasFirst = false, t1HasSecond = false;
    let t2HasFirst = false, t2HasSecond = false;

    for (let i = 1; i <= 4; i++) {
        if (teams[i] === 1) t1Count++;
        if (teams[i] === 2) t2Count++;
        
        if (teams[i] === 1 && orders[i] === 1) t1HasFirst = true;
        if (teams[i] === 1 && orders[i] === 2) t1HasSecond = true;
        if (teams[i] === 2 && orders[i] === 1) t2HasFirst = true;
        if (teams[i] === 2 && orders[i] === 2) t2HasSecond = true;
    }

    // 2. Evalueer elke speler en pas de knoppen aan
    for (let i = 1; i <= 4; i++) {
        const currentTeam = teams[i];
        const currentOrder = orders[i];
        const row = document.getElementById(`teamRow${i}`);

        // Check of deze rij volledig is (voor de groene rand en startknop)
        if (currentTeam && currentOrder) {
            row.classList.add('complete');
        } else {
            row.classList.remove('complete');
            allComplete = false;
        }

        // --- TEAM KNOPPEN ---
        // Team 1 is disabled als het vol is (2) EN deze speler zit er niet in
        const disableT1 = (t1Count >= 2 && currentTeam !== 1);
        window.setBtnState(`t1-btn-${i}`, disableT1, currentTeam === 1, 'active-team-1');

        // Team 2 is disabled als het vol is (2) EN deze speler zit er niet in
        const disableT2 = (t2Count >= 2 && currentTeam !== 2);
        window.setBtnState(`t2-btn-${i}`, disableT2, currentTeam === 2, 'active-team-2');

        // --- VOLGORDE KNOPPEN ---
        if (!currentTeam) {
            // Geen team gekozen? Dan mogen volgorde knoppen niet
            window.setBtnState(`o1-btn-${i}`, true, false, 'active-order');
            window.setBtnState(`o2-btn-${i}`, true, false, 'active-order');
        } else {
            // Bepaal of de plekken in het gekozen team al bezet zijn
            const teamHasFirst = (currentTeam === 1) ? t1HasFirst : t2HasFirst;
            const teamHasSecond = (currentTeam === 1) ? t1HasSecond : t2HasSecond;

            // Mag "1e" zijn? Alleen als het team nog geen "1e" heeft, OF als deze speler al de "1e" is.
            const canBeFirst = !teamHasFirst || currentOrder === 1;
            window.setBtnState(`o1-btn-${i}`, !canBeFirst, currentOrder === 1, 'active-order');

            // ✅ FIX: Mag "2e" zijn? Alleen als het team nog geen "2e" heeft, OF als deze speler al de "2e" is.
            const canBeSecond = !teamHasSecond || currentOrder === 2;
            window.setBtnState(`o2-btn-${i}`, !canBeSecond, currentOrder === 2, 'active-order');
        }
    }

    // 3. Activeer de startknop alleen als alles ingevuld is
    const startBtn = document.getElementById('btnStartFriendlyMatch');
    if (startBtn) startBtn.disabled = !allComplete;
};




/* =========================================================================
   ✅ ONTBREKENDE MODAL & START FUNCTIES (PLAK DIT HELEMAAL ONDERAAN)
   ========================================================================= */

// 10. Sluit modal volledig
window.closePlayerModal = function() {
    const modal = document.getElementById('playerSelectModal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

// 11. Reset modal naar begin (voor de "Terug" knop in de modal)
window.resetPlayerModal = function() {
    currentSearchString = "";
    window.updateSearchDisplay();
    
    // Ga terug naar Clublid modus
    window.setMode('club');
};

/* =========================================================================
   ✅ FINALE START ACTIE (NAAR PAGINA 13)
   ========================================================================= */

window.startFriendlyMatchFinal = function() {
    console.log("✅ Configuratie compleet, voorbereiden Pagina 13...");
    
    // 1. Bereid de nieuwe, veilige pagina voor met de juiste data
    window.prepareFriendlyBallSelection();
    
    // 2. Navigeer naar Pagina 13 (Vriendschappelijke Bal Selectie)
    showPage(13); 
};

// Helper functie om knop states te zetten
window.setBtnState = function(btnId, isDisabled, isActive, activeClass) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    if (isDisabled) {
        btn.classList.add('disabled');
        btn.classList.remove(activeClass);
    } else {
        btn.classList.remove('disabled');
        if (isActive) {
            btn.classList.add(activeClass);
        } else {
            btn.classList.remove(activeClass);
        }
    }
};


/* =========================================================================
   ✅ PAGINA 13: VRIENDSCHAPPELIJKE BAL SELECTIE (GEÏSOLEERD)
   ========================================================================= */

// 1. Bereid de pagina voor op basis van het aantal spelers
window.prepareFriendlyBallSelection = function() {
    const fm = state.friendlyMatch;
    if (!fm || !fm.numPlayers) return;

    const container = document.getElementById('friendlyBallOptions');
    const title = document.getElementById('friendlyBallTitle');
    const subtitle = document.getElementById('friendlyBallSubtitle');
    const startBtn = document.getElementById('friendlyStartMatchBtn');
    const resetBtn = document.getElementById('btnResetFriendlyColors'); // ✅ NIEUW
    
    // Reset state
    container.innerHTML = '';
    startBtn.disabled = true;
    startBtn.classList.add('disabled-btn');
    state.friendlyMatch.colorAssignments = {};
    state.friendlyMatch.whiteBallOwner = null;

    // ✅ STANDAARD: Verberg de reset knop
    if (resetBtn) resetBtn.classList.add('hidden');

    if (fm.numPlayers === 2) {
        title.textContent = "Kies Witte Bal";
        subtitle.innerHTML = "Wie speelt met de witte bal?<br><small>(De ander krijgt automatisch de gele bal)</small>";
        container.innerHTML = `
            <div class="ball-option" onclick="window.selectFriendlyWhite(1, this)">
                <div class="ball-circle white"><div>${fm.players[1]}</div></div>
            </div>
            <div class="ball-option" onclick="window.selectFriendlyWhite(2, this)">
                <div class="ball-circle white"><div>${fm.players[2]}</div></div>
            </div>
        `;
    }
    else if (fm.numPlayers === 4) {
        title.textContent = "Kies Team Kleuren";
        subtitle.innerHTML = "Welk team speelt met welke bal?<br><small>(Klik op het team)</small>";
        
        const t1Keys = Object.keys(fm.players).filter(p => fm.teams[p] === 1).sort((a, b) => fm.orders[a] - fm.orders[b]);
        const t2Keys = Object.keys(fm.players).filter(p => fm.teams[p] === 2).sort((a, b) => fm.orders[a] - fm.orders[b]);
        
        // ✅ NIEUW: Helper functie om alleen de voornaam te tonen
        const getFirstName = (fullName) => fullName.split(' ')[0];
        
        const team1Name = `${getFirstName(fm.players[t1Keys[0]])} & ${getFirstName(fm.players[t1Keys[1]])}`;
        const team2Name = `${getFirstName(fm.players[t2Keys[0]])} & ${getFirstName(fm.players[t2Keys[1]])}`;
        
        container.innerHTML = `
            <div class="ball-option" onclick="window.selectFriendlyWhite('T1', this)">
                <div class="ball-circle white" style="font-size: 1rem;"><div>Team 1<br><small>${team1Name}</small></div></div>
            </div>
            <div class="ball-option" onclick="window.selectFriendlyWhite('T2', this)">
                <div class="ball-circle white" style="font-size: 1rem;"><div>Team 2<br><small>${team2Name}</small></div></div>
            </div>
        `;
    }
    else if (fm.numPlayers === 3) {
        title.textContent = "Wijs Unieke Kleuren Toe";
        subtitle.innerHTML = "Klik op de gewenste kleur voor elke speler<br><small>(Elke kleur ⚪🟡🔴 mag maar 1x)</small>";
        
        // ✅ TOON de reset knop bij 3 spelers
        if (resetBtn) resetBtn.classList.remove('hidden');

        let html = '<div class="player-color-assignment">';
        for (let i = 1; i <= 3; i++) {
            html += `
            <div class="player-color-row" data-player="${i}">
                <div class="player-color-name">${fm.players[i]}</div>
                <div class="player-color-choices">
                    <div class="color-dot white" onclick="window.assignFriendlyColor(${i}, 'white', event)" title="Witte Bal">⚪</div>
                    <div class="color-dot yellow" onclick="window.assignFriendlyColor(${i}, 'yellow', event)" title="Gele Bal">🟡</div>
                    <div class="color-dot red" onclick="window.assignFriendlyColor(${i}, 'red', event)" title="Rode Bal">🔴</div>
                </div>
            </div>`;
        }
        html += '</div>';
        container.innerHTML = html;
    }
};

// 2. Logica voor 2 of 4 spelers/teams (Geïsoleerd voor Pagina 13)
window.selectFriendlyWhite = function(identifier, element) {
    state.friendlyMatch.whiteBallOwner = identifier;
    
    const options = document.querySelectorAll('#page13 .ball-option');
    
    // Reset alles naar standaard (wit, geen selectie)
    options.forEach(opt => {
        opt.classList.remove('selected');
        const circle = opt.querySelector('.ball-circle');
        if (circle) {
            circle.classList.remove('yellow');
        }
    });

    // Pas visuele staat toe
    if (element) {
        const clickedOption = element.closest('.ball-option');
        clickedOption.classList.add('selected'); // Groene gloed voor gekozen (wit)
        
        // De ANDERE optie krijgt automatisch de gele bal
        options.forEach(opt => {
            if (opt !== clickedOption) {
                const otherCircle = opt.querySelector('.ball-circle');
                if (otherCircle) otherCircle.classList.add('yellow');
            }
        });
    }
    
    // Activeer startknop
    const startBtn = document.getElementById('friendlyStartMatchBtn');
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.classList.remove('disabled-btn');
    }
    
    console.log(`✅ Witte bal gekozen: ${identifier} (Andere krijgt automatisch geel)`);
}; // ← ✅ DEZE WAS VERDWENEN!

// 3. Logica voor 3 spelers (Strikte "Lock-out" + Kleurwissel)
window.assignFriendlyColor = function(playerNum, color, event) {
    if (event) event.stopPropagation();
    
    if (!state.friendlyMatch.colorAssignments) state.friendlyMatch.colorAssignments = {};
    const assignments = state.friendlyMatch.colorAssignments;
    const oldColor = assignments[playerNum];

    // Klikte je op dezelfde kleur? Negeer.
    if (oldColor === color) return;

    // Is de NIEUWE kleur al door een ANDERE speler gekozen?
    const isTakenByOther = Object.entries(assignments).some(([p, c]) => p != playerNum && c === color);
    if (isTakenByOther) {
        console.log(`⚠️ Kleur ${color} is al gekozen door een andere speler!`);
        return;
    }

    // Wijs toe en update UI
    assignments[playerNum] = color;
    window.updateFriendly3PlayerUI();
    console.log(`✅ Speler ${playerNum} heeft nu de ${color} bal`);
};

// 4. Update UI voor 3 spelers (Nu met de juiste class-namen)
window.updateFriendly3PlayerUI = function() {
    const assignments = state.friendlyMatch.colorAssignments || {};
    const isComplete = Object.keys(assignments).length === 3;

    // 1. Reset ALLE ballen naar basis
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.classList.remove('active', 'disabled');
    });

    // 2. Markeer gekozen ballen als ACTIVE
    Object.entries(assignments).forEach(([pNum, color]) => {
        const row = document.querySelector(`.player-color-row[data-player="${pNum}"]`);
        if (row) {
            const activeDot = row.querySelector(`.color-dot.${color}`);
            if (activeDot) {
                activeDot.classList.add('active');
            }
        }
    });

    // 3. ✅ LOCK-OUT: Maak bezette kleuren grijs voor de andere spelers
    Object.values(assignments).forEach(takenColor => {
        document.querySelectorAll(`.color-dot.${takenColor}`).forEach(dot => {
            if (!dot.classList.contains('active')) {
                dot.classList.add('disabled');
            }
        });
    });

    // 4. Activeer startknop
    const startBtn = document.getElementById('friendlyStartMatchBtn');
    if (isComplete) {
        startBtn.disabled = false;
        startBtn.classList.remove('disabled-btn');
    } else {
        startBtn.disabled = true;
        startBtn.classList.add('disabled-btn');
    }
};

// 5. Finale start van de vriendschappelijke match
window.startFriendlyMatchFromBallSelection = function() {
    console.log("🚀 VRIENDSCHAPPELIJKE MATCH GESTART!", state.friendlyMatch);
    
    // Navigeer naar Pagina 14 (Vriendschappelijk Scorebord)
    showPage(14);
    
    // Initialiseer de scoring logica
    window.initFriendlyScoring();
};

// 6. Reset alle kleurkeuzes op Pagina 13
window.resetFriendlyBallSelection = function() {
    console.log("🔄 Reset bal kleur selectie...");
    
    // 1. Wis de state
    if (state.friendlyMatch) {
        state.friendlyMatch.whiteBallOwner = null;
        state.friendlyMatch.colorAssignments = {};
    }
    
    // 2. Verwijder alle visuele selecties
    document.querySelectorAll('#friendlyBallOptions .ball-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.classList.remove('active', 'disabled');
    });

    // ✅ NIEUW: Reset de gele ballen ook
    document.querySelectorAll('#page13 .ball-circle').forEach(circle => {
        circle.classList.remove('yellow');
    });
    
    // 3. Deactiveer de startknop
    const startBtn = document.getElementById('friendlyStartMatchBtn');
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.classList.add('disabled-btn');
    }
    
    console.log("✅ Reset compleet. Alle kleuren zijn gewist.");
};


/* =========================================================================
   ✅ PAGINA 14: VRIENDSCHAPPELIJK SCOREBORD - COMPLETE LOGICA
   ========================================================================= */

// 1. INIT: Wordt aangeroepen wanneer Pagina 14 wordt geopend
window.initFriendlyScoring = function() {
    const fm = state.friendlyMatch;
    if (!fm) return;

    // A. Bepaal de limieten per fase op basis van speltype
    if (fm.gameType === 'dubbeltje') {
        fm.limits = { vrijspel: 3, bandstoten: 2, driebanden: 1 };
        fm.thresholds = { vrijspel: 40, bandstoten: 20, driebanden: 10 };
    } else if (fm.gameType === 'triatlon-small') {
        fm.limits = { vrijspel: 99, bandstoten: 99, driebanden: 99 };
        fm.thresholds = { vrijspel: 20, bandstoten: 10, driebanden: 5 };
    } else if (fm.gameType === 'triatlon-large') {
        fm.limits = { vrijspel: 99, bandstoten: 99, driebanden: 99 };
        fm.thresholds = { vrijspel: 40, bandstoten: 20, driebanden: 10 };
    } else {
        // Vrijspel, bandstoten, driebanden (1-tegen-1)
        fm.limits = { vrijspel: 99, bandstoten: 99, driebanden: 99 };
        fm.thresholds = { vrijspel: 999, bandstoten: 999, driebanden: 999 }; // Geen fase-overgang
    }

    // B. Initialiseer de turn state (als die nog niet bestaat)
    if (!fm.turnState) {
        fm.turnState = {
            activeSide: 'left', // 'left' (Team 1/Speler 1) of 'right' (Team 2/Speler 2)
            currentRun: 0,      // Aantal punten in deze beurt
            phase: 'vrijspel',  // Huidige discipline
            leftPlayerIndex: 1, // 1 of 2 (welke speler uit Team 1 ligt er?)
            rightPlayerIndex: 1, // 1 of 2 (welke speler uit Team 2 ligt er?)
            leftTotalScore: 0,  // Totale score Team 1/Speler 1
            rightTotalScore: 0, // Totale score Team 2/Speler 2
            leftPhaseScore: 0,  // Score in huidige fase (Team 1/Speler 1)
            rightPhaseScore: 0, // Score in huidige fase (Team 2/Speler 2)
            lastMissedBy: null  // 'left' of 'right' (om te weten wie er niet mag beginnen)
        };
    }

    // C. Update de UI voor het eerst
    window.updateFriendlyUI();
};

// 2. DE MOTOR: Update de hele UI op basis van de state
window.updateFriendlyUI = function() {
    const fm = state.friendlyMatch;
    const ts = fm.turnState;
    const isTeam = fm.numPlayers === 4;

    // --- A. Bepaal de namen en limieten ---
    let leftName = "", rightName = "";
    const leftLimit = fm.limits[ts.phase];
    const rightLimit = fm.limits[ts.phase];

    if (isTeam) {
        const t1Keys = Object.keys(fm.players).filter(p => fm.teams[p] === 1).sort((a, b) => fm.orders[a] - fm.orders[b]);
        const t2Keys = Object.keys(fm.players).filter(p => fm.teams[p] === 2).sort((a, b) => fm.orders[a] - fm.orders[b]);
        
        const getFirstName = (fullName) => fullName.split(' ')[0];
        const leftPName = fm.players[t1Keys[ts.leftPlayerIndex - 1]];
        const rightPName = fm.players[t2Keys[ts.rightPlayerIndex - 1]];

        leftName = ts.activeSide === 'left' ? getFirstName(leftPName) : getFirstName(leftPName);
        rightName = ts.activeSide === 'right' ? getFirstName(rightPName) : getFirstName(rightPName);
    } else {
        leftName = fm.players[1];
        rightName = fm.players[2];
    }

    // --- B. Update de Header ---
    document.getElementById('friendlyHeaderName1').textContent = leftName;
    document.getElementById('friendlyHeaderTarget1').textContent = ts.activeSide === 'left' ? (leftLimit - ts.currentRun) : leftLimit;
    
    document.getElementById('friendlyHeaderName2').textContent = rightName;
    document.getElementById('friendlyHeaderTarget2').textContent = ts.activeSide === 'right' ? (rightLimit - ts.currentRun) : rightLimit;

    const phaseText = ts.phase === 'vrijspel' ? 'VRIJSPEL' : (ts.phase === 'bandstoten' ? 'BANDSTOTEN' : 'DRIEBANDEN');
    document.getElementById('friendlyHeaderDiscipline').textContent = phaseText;

    // --- C. Update de Score Cellen ---
    document.getElementById('friendlyP1NeededVal').textContent = leftLimit;
    document.getElementById('friendlyP1CurrentVal').textContent = ts.activeSide === 'left' ? ts.currentRun : 0;
    document.getElementById('friendlyP1TotalVal').textContent = ts.leftTotalScore;

    document.getElementById('friendlyP2NeededVal').textContent = rightLimit;
    document.getElementById('friendlyP2CurrentVal').textContent = ts.activeSide === 'right' ? ts.currentRun : 0;
    document.getElementById('friendlyP2TotalVal').textContent = ts.rightTotalScore;

    // --- D. Update de Middenknop ---
    const centerInfo = document.getElementById('friendlyCenterInfo');
    if (ts.activeSide === 'left') {
        centerInfo.innerHTML = `<div class="cell-value" style="font-size: 1.5rem; color: #2ecc71; font-weight: 800;">BEZIG</div><div style="font-size: 0.8rem; color: #95a5a6; margin-top: 5px;">(Klik bij MISS)</div>`;
    } else {
        centerInfo.innerHTML = `<div class="cell-value" style="font-size: 1.5rem; color: #f1c40f; font-weight: 800;">WACHTEN</div><div style="font-size: 0.8rem; color: #95a5a6; margin-top: 5px;">(Tegenstander is aan zet)</div>`;
    }
};

// 3. SCORE WIJZIGEN (+1 of -1)
window.friendlyChangeScore = function(delta) {
    const fm = state.friendlyMatch;
    const ts = fm.turnState;

    // Sla state op voor undo
    window.lastFriendlyState = JSON.parse(JSON.stringify(fm));

    // Update de score
    ts.currentRun += delta;
    if (ts.activeSide === 'left') {
        ts.leftTotalScore += delta;
        ts.leftPhaseScore += delta;
    } else {
        ts.rightTotalScore += delta;
        ts.rightPhaseScore += delta;
    }

    // Check of het maximum is bereikt (bij dubbeltje)
    const limit = fm.limits[ts.phase];
    if (ts.currentRun >= limit) {
        // Verplichte wissel naar partner
        window.friendlySwitchToPartner();
        return;
    }

    // Check of de fase-drempel is bereikt (bij triatlon)
    const threshold = fm.thresholds[ts.phase];
    const currentPhaseScore = ts.activeSide === 'left' ? ts.leftPhaseScore : ts.rightPhaseScore;
    if (currentPhaseScore >= threshold && ts.phase !== 'driebanden') {
        // Fase-overgang
        window.friendlyAdvancePhase();
        return;
    }

    // Update UI
    window.updateFriendlyUI();
};

// 4. MISS / EINDE BEURT
window.friendlyMiss = function() {
    const fm = state.friendlyMatch;
    const ts = fm.turnState;

    // Sla state op voor undo
    window.lastFriendlyState = JSON.parse(JSON.stringify(fm));

    // Onthoud wie er miste
    ts.lastMissedBy = ts.activeSide;

    // Wissel naar tegenstander
    ts.activeSide = ts.activeSide === 'left' ? 'right' : 'left';
    ts.currentRun = 0;

    // De speler die nu aan de beurt komt, is de PARTNER van degene die net miste
    if (ts.activeSide === 'left') {
        ts.leftPlayerIndex = ts.leftPlayerIndex === 1 ? 2 : 1;
    } else {
        ts.rightPlayerIndex = ts.rightPlayerIndex === 1 ? 2 : 1;
    }

    // Update UI
    window.updateFriendlyUI();
};

// 5. WISSEL NAAR PARTNER (bij max punten of fase-overgang)
window.friendlySwitchToPartner = function() {
    const fm = state.friendlyMatch;
    const ts = fm.turnState;

    // Wissel binnen hetzelfde team
    if (ts.activeSide === 'left') {
        ts.leftPlayerIndex = ts.leftPlayerIndex === 1 ? 2 : 1;
    } else {
        ts.rightPlayerIndex = ts.rightPlayerIndex === 1 ? 2 : 1;
    }

    // Reset de run
    ts.currentRun = 0;

    // Update UI
    window.updateFriendlyUI();
};

// 6. FASE-OVERGANG (Vrijspel → Bandstoten → Driebanden)
window.friendlyAdvancePhase = function() {
    const fm = state.friendlyMatch;
    const ts = fm.turnState;

    // Ga naar de volgende fase
    if (ts.phase === 'vrijspel') {
        ts.phase = 'bandstoten';
    } else if (ts.phase === 'bandstoten') {
        ts.phase = 'driebanden';
    }

    // Reset de fase-score
    if (ts.activeSide === 'left') {
        ts.leftPhaseScore = 0;
    } else {
        ts.rightPhaseScore = 0;
    }

    // Verplichte wissel naar partner
    window.friendlySwitchToPartner();
};

// 7. UNDO
window.friendlyUndo = function() {
    if (!window.lastFriendlyState) return;
    
    state.friendlyMatch = window.lastFriendlyState;
    window.lastFriendlyState = null;
    
    window.updateFriendlyUI();
};

// 8. MATCH STOPPEN
window.endFriendlyMatch = function() {
    if (confirm('Weet je zeker dat je deze vriendschappelijke match wilt stoppen?')) {
        // Reset de state
        state.friendlyMatch = null;
        
        // Ga terug naar hoofdmenu
        showPage(1);
    }
};



/* =========================================================================
   ✅ MODAL: TARGET & GEMIDDELDE LOGICA
   ========================================================================= */

// Hulpvariabelen om de gekozen target/gemiddelde tijdelijk op te slaan
window.tempPlayerTarget = 0;
window.tempPlayerAverage = 0;

// 1. Update de info in de modal op basis van de ingevoerde naam
window.updatePlayerTargetInfo = function(playerName) {
    const fm = state.friendlyMatch;
    const infoDiv = document.getElementById('playerTargetInfo');
    
    // Alleen tonen bij vrijspel, bandstoten of driebanden
    const eligibleTypes = ['vrijspel', 'bandstoten', 'driebanden'];
    if (!fm || !eligibleTypes.includes(fm.gameType) || !playerName || playerName.trim() === '') {
        infoDiv.classList.add('hidden');
        infoDiv.classList.remove('data-found', 'manual-input');
        return;
    }

    // Zoek speler in state.players (naam + discipline, over alle categorieën heen)
    const foundPlayers = state.players.filter(p => 
        p.name.toLowerCase().trim() === playerName.toLowerCase().trim() &&
        p.discipline.toLowerCase().trim() === fm.gameType.toLowerCase().trim()
    );

    if (foundPlayers.length > 0) {
        // SCENARIO A: Data gevonden
        const player = foundPlayers[0];
        window.tempPlayerTarget = parseInt(player.target) || 0;
        window.tempPlayerAverage = parseFloat(player.tsg.replace(',', '.')) || 0;

        infoDiv.classList.remove('hidden', 'manual-input');
        infoDiv.classList.add('data-found');
        infoDiv.innerHTML = `
            <div class="target-info-row">
                <div class="target-stat">
                    <span class="label" style="color: #3498db;">🎯 Doel</span>
                    <span class="value green">${window.tempPlayerTarget}</span>
                </div>
                <div class="target-stat">
                    <span class="label" style="color: #3498db;">📊 Gemiddelde</span>
                    <span class="value yellow">${player.tsg}</span>
                </div>
            </div>
        `;
    } else {
        // SCENARIO B: Geen data (Gast of speler zonder stats in deze discipline)
        window.tempPlayerTarget = 0; // Reset naar 0, moet handmatig gekozen worden
        window.tempPlayerAverage = 0;

        infoDiv.classList.remove('hidden', 'data-found');
        infoDiv.classList.add('manual-input');
        
        // Maak dropdown opties (0 tot 100, stappen van 5)
        let options = '<option value="0">-- Kies doel (0) --</option>';
        for (let i = 5; i <= 100; i += 5) {
            options += `<option value="${i}">${i}</option>`;
        }

        infoDiv.innerHTML = `
            <div class="target-info-row">
                <div class="target-stat" style="align-items: flex-start;">
                    <span class="label" style="color: #e74c3c;">⚠️ Geen data</span>
                    <span style="font-size: 0.8rem; color: #95a5a6;">Kies handmatig het doel:</span>
                </div>
                <div class="target-stat" style="flex: 2;">
                    <select id="manualTargetSelect" class="target-select" onchange="window.setManualTarget(this.value)">
                        ${options}
                    </select>
                </div
            </div>
        `;
    }
};

// 2. Wordt aangeroepen wanneer de dropdown verandert
window.setManualTarget = function(value) {
    window.tempPlayerTarget = parseInt(value);
    console.log(`✅ Handmatig doel ingesteld op: ${window.tempPlayerTarget}`);
};

// 3. AANGEPASTE 'Bevestig Naam' functie
window.confirmTypedName = function() {
    const name = document.getElementById('currentSearchText').textContent.trim();
    
    if (!name) {
        alert("Voer eerst een naam in.");
        return;
    }

    // ✅ NIEUWE VALIDATIE: Target mag niet 0 zijn
    if (window.tempPlayerTarget === 0) {
        alert("⚠️ Het te spelen doel mag niet 0 zijn.\n\nKies een waarde uit het dropdown menu of controleer de naam.");
        return;
    }

    const currentSlot = window.currentPlayerSlot;
    
    // Sla de speler op als een OBJECT met naam, target en average
    state.friendlyMatch.players[currentSlot] = {
        name: name,
        target: window.tempPlayerTarget,
        average: window.tempPlayerAverage,
        isGuest: (document.getElementById('btnModeGuest').classList.contains('mode-active-guest'))
    };

    console.log(`✅ Speler ${currentSlot} bevestigd:`, state.friendlyMatch.players[currentSlot]);
    
    window.closePlayerModal();
    window.renderChosenPlayers(); // Update de weergave in Stap 3
    
    // Ga door naar de volgende speler of naar team setup
    const totalPlayers = state.friendlyMatch.numPlayers;
    if (currentSlot < totalPlayers) {
        setTimeout(() => window.openPlayerSelection(currentSlot + 1), 400);
    } else {
        if (totalPlayers === 4) {
            setTimeout(() => {
                window.showTeamSetup();
                document.getElementById('step4TeamSetup').scrollIntoView({ behavior: 'smooth' });
            }, 400);
        } else {
            // 2 of 3 spelers: direct naar bal selectie (Pagina 13)
            setTimeout(() => {
                window.prepareFriendlyBallSelection();
                showPage(13);
            }, 400);
        }
    }
};
