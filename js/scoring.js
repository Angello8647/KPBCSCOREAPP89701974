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
            
            // ✅ DAMES: 20 beurten tonen (4 rijen van 5), HEREN: 56 beurten tonen
            const isDames = state.currentMatch.discipline === "Dames";
            const minBeurten = isDames ? 20 : 56;
            const totalToShow = Math.max(minBeurten, turns.length);
            const highest = player.highestSeries || 0;
            let html = '';
            
            // ✅ DAMES: Groepeer per 5 beurten (4 rijen van 5)
            if (isDames) {
                for (let group = 0; group < 4; group++) {
                    html += '<div class="turn-group">';
                    
                    for (let i = 1; i <= 5; i++) {
                        const turnIndex = (group * 5) + i;
                        const isPlayed = turnIndex <= turns.length;
                        let scoreDisplay = '−';
                        let classes = 'turn-row';
                        
                        if (isPlayed) {
                            const score = turns[turnIndex - 1];
                            
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
                            
                            if (turnIndex === turns.length && score !== highest) {
                                classes += ' latest-turn';
                            }
                        } else {
                            classes += ' pending';
                        }
                        
                        html += `<div class="${classes}"><span>B${turnIndex}: ${scoreDisplay}</span></div>`;
                    }
                    
                    html += '</div>';
                }
            } else {
                // ✅ HEREN: Normale lange lijst
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
        
        // ✅ UITGESCHAKELD VOOR TESTEN - Commentaar terug verwijderen om spraak te activeren
        // window.speechSynthesis.speak(utterance);
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

    // ✅ NIEUW: DAMES-COMPETITIE - Check op 20 beurten limiet
    if (state.currentMatch.discipline === "Dames") {
        // Beide spelers hebben 20 beurten gespeeld? Match eindigt!
        if (state.player1.turns.length >= 20 && state.player2.turns.length >= 20) {
            endMatch();
            return;
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
    console.log("🔥 END MATCH FUNCTIE AANGEROEPEN!");
    
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
    
    // ✅ DAMES-COMPETITIE: Winner op basis van hoogste score + puntenverdeling (3-2-1)
    if (state.currentMatch.discipline === "Dames") {
        if (state.player1.score > state.player2.score) {
            // Speler 1 wint
            state.currentMatch.winner = state.currentMatch.p1;
            state.currentMatch.p1MatchPoints = 3;
            state.currentMatch.p2MatchPoints = 1;
        } else if (state.player2.score > state.player1.score) {
            // Speler 2 wint
            state.currentMatch.winner = state.currentMatch.p2;
            state.currentMatch.p1MatchPoints = 1;
            state.currentMatch.p2MatchPoints = 3;
        } else {
            // Gelijkspel
            state.currentMatch.winner = "Gelijk";
            state.currentMatch.p1MatchPoints = 2;
            state.currentMatch.p2MatchPoints = 2;
        }
    } else {
        // ✅ HEREN: Oude logica (wie haalt target)
        state.currentMatch.winner = state.player1.score >= state.player1.target ? state.currentMatch.p1 : state.currentMatch.p2;
    }
    
    if (typeof saveStateToStorage === 'function') saveStateToStorage();
    
    // ✅ NIEUW: Stuur de volledige match-data naar de PythonAnywhere API
    if (typeof window.syncMatchToAPI === 'function') {
        console.log("📤 Probeer match te syncen met server...");
        window.syncMatchToAPI(state.currentMatch);
    }
    
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
// MATCH STARTEN (na bal-selectie) - ✅ FIXED!
// ==========================================
window.startMatch = function() {
    if (!state.selectedWhitePlayer) {
        return alert("Selecteer eerst wie met de witte bal speelt!");
    }

    const originalP1 = state.currentMatch.p1;
    const originalP2 = state.currentMatch.p2;
    const originalP1ClubId = state.currentMatch.p1_club_id;  // ✅ VOEG DIT TOE
    const originalP2ClubId = state.currentMatch.p2_club_id;  // ✅ VOEG DIT TOE
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
        state.currentMatch.p1_club_id = originalP2ClubId;  // ✅ SWAP CLUB IDS!
        state.currentMatch.p2_club_id = originalP1ClubId;  // ✅ SWAP CLUB IDS!
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
        state.currentMatch.p1_club_id = originalP1ClubId;  // ✅ Expliciet toewijzen (geen swap nodig)
        state.currentMatch.p2_club_id = originalP2ClubId;  // ✅ Expliciet toewijzen (geen swap nodig)
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
        


        // ✅ PAGINA 1: Navigeer door knoppen en datum met PageUp/PageDown
        if (activePage.id === 'page1') {
            const dateInput = document.getElementById('dateSelect');
            const buttons = Array.from(document.querySelectorAll('#page1 .next-btn, #page1 .friendly-btn'));
            const focusables = [dateInput, ...buttons].filter(el => el);
            
            const currentIndex = focusables.indexOf(document.activeElement);
            const isDateFocused = document.activeElement === dateInput;
            
            // 🎯 Wanneer datum focus heeft: PageUp/PageDown wijzigt datum, Tab gaat naar knoppen
            if (isDateFocused) {
                if (event.key === 'PageUp' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    if (dateInput && dateInput.value) {
                        const d = new Date(dateInput.value);
                        d.setDate(d.getDate() + 1);
                        dateInput.value = d.toISOString().split('T')[0];
                        state.selectedDate = dateInput.value;
                    }
                    return;
                }
                if (event.key === 'PageDown' || event.key === 'ArrowDown') {
                    event.preventDefault();
                    if (dateInput && dateInput.value) {
                        const d = new Date(dateInput.value);
                        d.setDate(d.getDate() - 1);
                        dateInput.value = d.toISOString().split('T')[0];
                        state.selectedDate = dateInput.value;
                    }
                    return;
                }
                if (event.key === 'Tab') {
                    event.preventDefault();
                    if (buttons.length > 0) {
                        buttons[0].focus();
                    }
                    return;
                }
                return;
            }
            
            // 🎯 Als GEEN element focus heeft (BODY), focus op eerste knop
            if (currentIndex === -1) {
                if (event.key === 'PageDown' || event.key === 'ArrowDown') {
                    event.preventDefault();
                    if (buttons.length > 0) buttons[0].focus();
                    return;
                }
                if (event.key === 'PageUp' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    if (dateInput) dateInput.focus();
                    return;
                }
                return;
            }
            
            // 🎯 Navigeer tussen elementen
            if (event.key === 'PageDown' || event.key === 'ArrowDown') {
                event.preventDefault();
                const nextIndex = (currentIndex + 1) % focusables.length;
                focusables[nextIndex].focus();
                return;
            }
            
            if (event.key === 'PageUp' || event.key === 'ArrowUp') {
                event.preventDefault();
                const prevIndex = (currentIndex - 1 + focusables.length) % focusables.length;
                focusables[prevIndex].focus();
                return;
            }
            
            // 🎯 Tab: Activeer knop
            if (event.key === 'Tab') {
                event.preventDefault();
                if (buttons.includes(document.activeElement)) {
                    document.activeElement.click();
                }
                return;
            }
            return;
        }


        // ✅ MODAL OPEN: Navigeer door spelerslijst
        const modal = document.querySelector('.modal-overlay:not(.hidden)');
        if (modal) {
            // Bouw lijst van belangrijke elementen (mode knoppen + spelers + actie knoppen)
            const modeButtons = Array.from(modal.querySelectorAll('#btnModeClub, #btnModeGuest'));
            const players = Array.from(modal.querySelectorAll('.player-list-item'));
            const actionButtons = Array.from(modal.querySelectorAll('.modal-actions .modal-btn'));
            
            const focusables = [...modeButtons, ...players, ...actionButtons];
            
            if (focusables.length === 0) return;
            
            // Gebruik custom index
            if (typeof window.modalFocusIndex === 'undefined' || window.modalFocusIndex === -1) {
                window.modalFocusIndex = 0;
            }
            
            // Verwijder oude focus
            focusables.forEach(el => el.classList.remove('focused'));
            
            // PageUp: Vorige speler
            if (event.key === 'PageUp') {
                event.preventDefault();
                window.modalFocusIndex = (window.modalFocusIndex - 1 + focusables.length) % focusables.length;
                focusables[window.modalFocusIndex].classList.add('focused');
                // Scroll naar zichtbare positie als het een speler is
                if (focusables[window.modalFocusIndex].classList.contains('player-list-item')) {
                    focusables[window.modalFocusIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
                return;
            }
            
            // PageDown: Volgende speler
            if (event.key === 'PageDown') {
                event.preventDefault();
                window.modalFocusIndex = (window.modalFocusIndex + 1) % focusables.length;
                focusables[window.modalFocusIndex].classList.add('focused');
                // Scroll naar zichtbare positie als het een speler is
                if (focusables[window.modalFocusIndex].classList.contains('player-list-item')) {
                    focusables[window.modalFocusIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
                return;
            }
            
            // Tab: Activeer het geselecteerde element
            if (event.key === 'Tab') {
                event.preventDefault();
                if (window.modalFocusIndex !== -1) {
                    focusables[window.modalFocusIndex].click();
                }
                return;
            }
            return;
        }

        
        // ✅ PAGINA FRIENDLY: Navigeer door alle elementen
        // ✅ PAGINA FRIENDLY: Navigeer door alle elementen met visuele highlight
        if (activePage.id === 'pageFriendly') {
            // Bouw lijst van alle focusbare elementen in volgorde
            const focusables = Array.from(document.querySelectorAll(
                '#pageFriendly .back-btn, ' +
                '#friendlyResetBtn, ' +
                '#pageFriendly .config-card:not(.dimmed), ' +
                '#btnStartFriendlyMatch'
            )).filter(el => {
                // Filter uit elementen die verborgen zijn of disabled
                return el.offsetParent !== null && !el.disabled;
            });
            
            if (focusables.length === 0) return;
            
            // Gebruik een custom index als er geen focus is
            if (typeof window.friendlyFocusIndex === 'undefined' || window.friendlyFocusIndex === -1) {
                window.friendlyFocusIndex = 0;
            }
            
            // Verwijder oude focus
            focusables.forEach(el => el.classList.remove('focused'));
            
            // PageUp: Ga naar vorige element
            if (event.key === 'PageUp') {
                event.preventDefault();
                window.friendlyFocusIndex = (window.friendlyFocusIndex - 1 + focusables.length) % focusables.length;
                focusables[window.friendlyFocusIndex].classList.add('focused');
                return;
            }
            
            // PageDown: Ga naar volgende element
            if (event.key === 'PageDown') {
                event.preventDefault();
                window.friendlyFocusIndex = (window.friendlyFocusIndex + 1) % focusables.length;
                focusables[window.friendlyFocusIndex].classList.add('focused');
                return;
            }
            
            // Tab: Activeer het geselecteerde element
            if (event.key === 'Tab') {
                event.preventDefault();
                if (window.friendlyFocusIndex !== -1) {
                    focusables[window.friendlyFocusIndex].click();
                }
                return;
            }
            return;
        }

        // ✅ PAGINA 13: Witte bal selectie
        if (activePage.id === 'page13') {
            const ballOptions = Array.from(document.querySelectorAll('#page13 .ball-option'));
            
            if (ballOptions.length === 0) return;
            
            // Gebruik custom index
            if (typeof window.ballFocusIndex === 'undefined' || window.ballFocusIndex === -1) {
                window.ballFocusIndex = 0;
            }
            
            // Verwijder oude focus
            ballOptions.forEach(el => el.classList.remove('focused'));
            
            // PageUp: Vorige speler
            if (event.key === 'PageUp') {
                event.preventDefault();
                window.ballFocusIndex = (window.ballFocusIndex - 1 + ballOptions.length) % ballOptions.length;
                ballOptions[window.ballFocusIndex].classList.add('focused');
                return;
            }
            
            // PageDown: Volgende speler
            if (event.key === 'PageDown') {
                event.preventDefault();
                window.ballFocusIndex = (window.ballFocusIndex + 1) % ballOptions.length;
                ballOptions[window.ballFocusIndex].classList.add('focused');
                return;
            }
            
            // Tab: Activeer de geselecteerde speler
            if (event.key === 'Tab') {
                event.preventDefault();
                if (window.ballFocusIndex !== -1) {
                    ballOptions[window.ballFocusIndex].click();
                }
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
                    window.highlightMatch(cards);
                } else if (key === 'PageUp' || key === 'ArrowUp') {
                    event.preventDefault();
                    window.matchListFocusIndex = Math.max(window.matchListFocusIndex - 1, 0);
                    window.highlightMatch(cards);
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


        // ✅ PAGINA 13: Witte bal kiezen + match starten (Vriendschappelijk)
        if (activePage.id === 'page13') {
            if (event.key === 'PageUp' || event.key === 'ArrowUp') {
                event.preventDefault();
                if (typeof window.selectFriendlyWhite === 'function') {
                    const option1 = document.querySelector('#page13 .ball-option:first-child');
                    window.selectFriendlyWhite(1, option1);
                }
            } else if (event.key === 'PageDown' || event.key === 'ArrowDown') {
                event.preventDefault();
                if (typeof window.selectFriendlyWhite === 'function') {
                    const option2 = document.querySelector('#page13 .ball-option:last-child');
                    window.selectFriendlyWhite(2, option2);
                }
            } else if (event.key === 'Tab') {
                event.preventDefault();
                if (typeof window.startFriendlyMatch === 'function' && state.friendlyMatch?.whiteBallOwner) {
                    window.startFriendlyMatch();
                }
            }
            return;
        }
        
        // ✅ PAGINA 5: SCORING
        if (activePage.id === 'page5') {
            if (!state.currentMatch || state.matchEnded) return;
        
            if (event.key === 'PageUp' || event.key === 'ArrowUp') {
                event.preventDefault();
                pageUpStartTime = Date.now();
                return;
            }
            if (event.key === 'PageDown' || event.key === 'ArrowDown') {
                event.preventDefault();
                if (now - lastScoreTime >= COOLDOWN) {
                    if (typeof window.changeScore === 'function') window.changeScore(-1);
                    lastScoreTime = now;
                }
                return;
            }
            if (event.key === 'b' || event.key === 'B' || event.code === 'KeyB') {
                event.preventDefault();
                if (typeof window.undoLastAdd === 'function') window.undoLastAdd();
                lastScoreTime = now;
                return;
            }
            if (event.key === 'Tab') {
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

    // ✅ NIEUW: Check of dit een vriendschappelijke match is
    const isFriendly = state.currentMatch.cat === 'Vriendschappelijk';
    
    // ✅ NIEUW: Bepaal winnaar alleen bij vriendschappelijke matches
    let p1IsWinner = false;
    let p2IsWinner = false;
    let p1NameDisplay = `${p1Name} ⚪`;
    let p2NameDisplay = `${p2Name} 🟡`;
    let p1CardStyle = '';
    let p2CardStyle = '';
    
    if (isFriendly && state.currentMatch.winner) {
        const winner = state.currentMatch.winner;
        p1IsWinner = (p1Name === winner);
        p2IsWinner = (p2Name === winner);
        
        // Maak een duidelijke winnaars-badge
        const winnerBadge = '<span style="display:inline-block; margin-left:10px; padding:4px 12px; background:#2ecc71; color:white; border-radius:20px; font-size:0.9rem; font-weight:900; box-shadow: 0 2px 8px rgba(46, 204, 113, 0.4);">🏆 WINNAAR</span>';
        
        if (p1IsWinner) p1NameDisplay += ` ${winnerBadge}`;
        if (p2IsWinner) p2NameDisplay += ` ${winnerBadge}`;
        
        // Groene rand voor de winnaarskaart
        if (p1IsWinner) p1CardStyle = 'style="border: 3px solid #2ecc71; box-shadow: 0 0 20px rgba(46, 204, 113, 0.3);"';
        if (p2IsWinner) p2CardStyle = 'style="border: 3px solid #2ecc71; box-shadow: 0 0 20px rgba(46, 204, 113, 0.3);"';
    }

    const html1 = `
        <div class="summary-player-card" ${p1CardStyle}>
            <div class="summary-player-name">${p1NameDisplay}</div>
            
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
        </div>
    `;

    const html2 = `
        <div class="summary-player-card" ${p2CardStyle}>
            <div class="summary-player-name">${p2NameDisplay}</div>
            
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
    const btnsFriendly = document.querySelectorAll('#containerFriendly .friendly-btn'); // ✅ Alle knoppen
    const contOfficial = document.getElementById('containerOfficial');
    const contFriendly = document.getElementById('containerFriendly');

    if (btnOfficial && contOfficial && contFriendly) {
        // Hover over Officiële knop -> dim Vriendschappelijk vak
        btnOfficial.addEventListener('mouseenter', () => contFriendly.classList.add('inactive-mode'));
        btnOfficial.addEventListener('mouseleave', () => contFriendly.classList.remove('inactive-mode'));

        // Hover over ELKE Vriendschappelijke knop -> dim Officieel vak
        btnsFriendly.forEach(btn => {
            btn.addEventListener('mouseenter', () => contOfficial.classList.add('inactive-mode'));
            btn.addEventListener('mouseleave', () => contOfficial.classList.remove('inactive-mode'));
        });
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

// 1. SPELERS KIEZEN (MET FILTER VOOR 4 SPELERS)
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
    
    // ✅ NIEUW: Filter de speltype-opties op basis van het aantal spelers
    const allGameCards = document.querySelectorAll('#step2GameType .config-card');
    
    if (numPlayers === 4) {
        // Bij 4 spelers: toon ALLEEN triatlon-small, triatlon-large en dubbeltje
        allGameCards.forEach(card => {
            const type = card.getAttribute('data-gametype');
            if (type === 'vrijspel' || type === 'bandstoten' || type === 'driebanden') {
                card.style.display = 'none'; // Verberg de onmogelijke opties
            } else {
                card.style.display = ''; // Toon de mogelijke opties
            }
        });
    } else {
        // Bij 2 of 3 spelers: toon ALLE opties weer
        allGameCards.forEach(card => {
            card.style.display = '';
        });
    }
    
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
    // ✅ NIEUW: Zorg dat alle speltype-opties weer zichtbaar zijn na een reset
    document.querySelectorAll('#step2GameType .config-card').forEach(card => {
        card.style.display = '';
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
    
    // ✅ NIEUW: Update target info na elke letter
    window.updatePlayerTargetInfo(currentSearchString);
    
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
        
        // ✅ NIEUW: Klikken zet naam in zoekbalk en update target info
        item.onclick = () => {
            currentSearchString = player;
            window.updateSearchDisplay();
            
            // ✅ Update target info met de gekozen speler
            window.updatePlayerTargetInfo(currentSearchString);
            
            console.log(`📝 Naam in zoekbalk gezet: ${player}`);
        };
        
        listContainer.appendChild(item);
    });
};

// 8. Bevestig naam (met Target Validatie)
window.confirmTypedName = function() {
    if (currentSearchString.trim() === "") {
        alert("⚠️ Voer eerst een naam in!\n\nKlik op een naam uit de lijst of typ een naam met de letters.");
        return;
    }
    
    // ✅ VALIDATIE: Target mag niet 0 zijn, BEHALVE bij triatlon en dubbeltje
    const gameType = state.friendlyMatch?.gameType;
    const requiresTarget = ['vrijspel', 'bandstoten', 'driebanden'].includes(gameType);
    
    if (requiresTarget && window.tempPlayerTarget === 0) {
        alert("⚠️ Het te spelen doel mag niet 0 zijn.\n\nKies een waarde uit het dropdown menu of controleer de naam.");
        return;
    }

    // Check of deze naam al gekozen is (werkt nu met objecten)
    if (state.friendlyMatch && state.friendlyMatch.players) {
        const alreadyChosenNames = Object.values(state.friendlyMatch.players).map(p => typeof p === 'object' ? p.name : p);
        if (alreadyChosenNames.includes(currentSearchString.trim())) {
            alert(`⚠️ "${currentSearchString.trim()}" is al gekozen als een andere speler!\n\nKies een andere speler.`);
            return;
        }
    }
    
    // Roep finalize aan met de volledige data als object
    window.finalizePlayerSelection({
        name: currentSearchString.trim(),
        target: window.tempPlayerTarget,
        average: window.tempPlayerAverage,
        isGuest: isGuestMode
    });
};

// 9. Finaliseer keuze (Aangepast om object op te slaan)
window.finalizePlayerSelection = function(playerData) {
    // Veiligheid: ondersteun ook oude string-aanroepen
    const name = typeof playerData === 'object' ? playerData.name : playerData;
    const target = typeof playerData === 'object' ? playerData.target : 0;
    const average = typeof playerData === 'object' ? playerData.average : 0;
    const isGuest = typeof playerData === 'object' ? playerData.isGuest : false;

    console.log(`✅ Speler ${currentPlayerSlot} bevestigd:`, name, `| Target:`, target);
    
    // Sla op in state als OBJECT
    state.friendlyMatch = state.friendlyMatch || {};
    if (!state.friendlyMatch.players) state.friendlyMatch.players = {};
    state.friendlyMatch.players[currentPlayerSlot] = { name, target, average, isGuest };
    
    // Update de display met het juiste icoontje
    const icons = { 1: "🧙‍♂️", 2: "👷‍♂️", 3: "👮‍♂️", 4: "👨‍🚀" };
    const displayEl = document.getElementById(`displayPlayer${currentPlayerSlot}`);
    if (displayEl) displayEl.textContent = `${icons[currentPlayerSlot]} ${name}`;
    
    // Toon het display blok
    document.getElementById('step3PlayersDisplay').classList.remove('hidden');
    
    // Sluit de modal
    window.closePlayerModal();
    
    const totalPlayers = state.friendlyMatch.numPlayers || 2;
    
    if (currentPlayerSlot < totalPlayers) {
        setTimeout(() => {
            console.log(`🔄 Open nu modal voor Speler ${currentPlayerSlot + 1}`);
            window.openPlayerSelection(currentPlayerSlot + 1);
        }, 600);
    } else {
        console.log(`🎉 Alle ${totalPlayers} spelers zijn gekozen!`);
        
        if (totalPlayers === 4) {
            setTimeout(() => {
                window.showTeamSetup();
                document.getElementById('step4TeamSetup').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        } else {
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
        const playerName = players[i]?.name || `Speler ${i}`;
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
    const resetBtn = document.getElementById('btnResetFriendlyColors');
    
    // Reset state
    container.innerHTML = '';
    startBtn.disabled = true;
    startBtn.classList.add('disabled-btn');
    state.friendlyMatch.colorAssignments = {};
    state.friendlyMatch.whiteBallOwner = null;

    if (resetBtn) resetBtn.classList.add('hidden');

    // ✅ HULPFUNCTIE: Haal de naam uit het object (of gebruik de string direct)
    const getPlayerName = (player) => {
        if (typeof player === 'object' && player !== null) {
            return player.name;
        }
        return player;
    };

    if (fm.numPlayers === 2) {
        title.textContent = "Kies Witte Bal";
        subtitle.innerHTML = "Wie speelt met de witte bal?<br><small>(De ander krijgt automatisch de gele bal)</small>";
        
        const p1Name = getPlayerName(fm.players[1]);
        const p2Name = getPlayerName(fm.players[2]);
        
        container.innerHTML = `
            <div class="ball-option" onclick="window.selectFriendlyWhite(1, this)">
                <div class="ball-circle white"><div>${p1Name}</div></div>
            </div>
            <div class="ball-option" onclick="window.selectFriendlyWhite(2, this)">
                <div class="ball-circle white"><div>${p2Name}</div></div>
            </div>
        `;
    }
    else if (fm.numPlayers === 4) {
        title.textContent = "Kies Team Kleuren";
        subtitle.innerHTML = "Welk team speelt met welke bal?<br><small>(Klik op het team)</small>";
        
        const t1Keys = Object.keys(fm.players).filter(p => fm.teams[p] === 1).sort((a, b) => fm.orders[a] - fm.orders[b]);
        const t2Keys = Object.keys(fm.players).filter(p => fm.teams[p] === 2).sort((a, b) => fm.orders[a] - fm.orders[b]);
        
        const getFirstName = (fullName) => {
            const name = getPlayerName(fullName);
            return name.split(' ')[0];
        };

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
        
        if (resetBtn) resetBtn.classList.remove('hidden');

        let html = '<div class="player-color-assignment">';
        for (let i = 1; i <= 3; i++) {
            const pName = getPlayerName(fm.players[i]);
            html += `
            <div class="player-color-row" data-player="${i}">
                <div class="player-color-name">${pName}</div>
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

// 5. Finale start van de vriendschappelijke match (MET WITTE BAL SWAP LOGICA)
window.startFriendlyMatchFromBallSelection = function() {
    console.log("🚀 VRIENDSCHAPPELIJKE MATCH GESTART!", state.friendlyMatch);
    
    const fm = state.friendlyMatch;
    if (!fm) return;

    // ✅ SWAP LOGICA: Zorg dat de speler/team met de witte bal ALTIJD links (positie 1) staat
    if (fm.numPlayers === 2) {
        // 2 SPELERS: Als speler 2 de witte bal heeft, swap spelers 1 en 2
        if (fm.whiteBallOwner === 2) {
            console.log("🔄 Swap: Speler 2 heeft witte bal → wissel posities");
            const tempPlayer = fm.players[1];
            fm.players[1] = fm.players[2];
            fm.players[2] = tempPlayer;
            fm.whiteBallOwner = 1;
        }
    }
    else if (fm.numPlayers === 4) {
        // 4 SPELERS (TEAMS): Als Team 2 de witte bal heeft, swap team-toewijzingen
        if (fm.whiteBallOwner === 'T2') {
            console.log("🔄 Swap: Team 2 heeft witte bal → wissel teams");
            for (let i = 1; i <= 4; i++) {
                if (fm.teams[i] === 1) {
                    fm.teams[i] = 2;
                } else if (fm.teams[i] === 2) {
                    fm.teams[i] = 1;
                }
            }
            fm.whiteBallOwner = 'T1';
        }
    }
    else if (fm.numPlayers === 3) {
        console.log("🎯 3 SPELERS: Kleuren toewijzen en ECHTE targets ophalen");
        
        const sortedPlayers = [];
        const colorOrder = ['white', 'yellow', 'red'];
        
        for (const color of colorOrder) {
            const playerNum = Object.keys(fm.colorAssignments).find(key => fm.colorAssignments[key] === color);
            
            if (playerNum) {
                const playerObj = fm.players[playerNum];
                
                const playerName = typeof playerObj === 'object' && playerObj !== null ? playerObj.name : playerObj;
                const target = typeof playerObj === 'object' && playerObj !== null ? (playerObj.target || 50) : 50;
                
                const playerData = state.players ? state.players.find(p => p.name === playerName) : null;
                const tsg = playerData ? (playerData.tsg || playerData.average || '1,000') : '1,000';
                
                sortedPlayers.push({
                    name: playerName,
                    color: color,
                    target: target,
                    tsg: tsg
                });
            }
        }
        
        console.log("✅ Gesorteerde spelers met echte targets:", sortedPlayers);
        
        fm.players = sortedPlayers;
        window.init3PlayerScoring();
        
        console.log("🔄 Navigeren naar 3-speler pagina...");
        
        // ✅ VERBERG ALLE PAGINA'S EN RUIM OP
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
            p.classList.remove('hidden'); // ✅ Ruim .hidden op
            p.style.display = ''; // ✅ Wis inline display
        });
        
        // ✅ TOON 3-SPELER PAGINA
        const page3p = document.getElementById('page14-3player');
        if (page3p) {
            page3p.classList.add('active');
            page3p.classList.remove('hidden'); // ✅ Voor het geval die er is
            page3p.style.display = ''; // ✅ Wis inline display
            state.currentPage = 14;
        }
        
        return;
    }

    // ✅ Voor 2 en 4 spelers: navigeer naar Pagina 14
    showPage(14);
    window.initFriendlyScoring();
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
            activeSide: 'left',
            currentRun: 0,
            phase: 'vrijspel', // Blijft voor backward compatibility
            leftPhase: 'vrijspel',   // ✅ NIEUW: Fase van Team 1
            rightPhase: 'vrijspel',  // ✅ NIEUW: Fase van Team 2
            leftPlayerIndex: 1,
            rightPlayerIndex: 1,
            leftTotalScore: 0,
            rightTotalScore: 0,
            leftPhaseScore: 0,
            rightPhaseScore: 0,
            lastMissedBy: null,
            leftBeurtNummer: 1,
            rightBeurtNummer: 1,
            leftTurns: [],
            rightTurns: [],
            leftHighestSeries: 0,
            rightHighestSeries: 0,
            firstToTarget: null,
            isNabeurt: false,
            matchEnded: false
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

    // ✅ HULPFUNCTIE: Haal speler-data op (object of string)
    const getPlayerData = (player) => {
        if (typeof player === 'object' && player !== null) {
            return player;
        }
        return { name: player, target: 0, average: 0 };
    };

    // --- A. Bepaal de namen, targets en gemiddelden ---
    let leftName = "", rightName = "";
    let leftTarget = 0, rightTarget = 0;
    let leftAvg = "0,000", rightAvg = "0,000";

    if (isTeam) {
        const t1Keys = Object.keys(fm.players).filter(p => fm.teams[p] === 1).sort((a, b) => fm.orders[a] - fm.orders[b]);
        const t2Keys = Object.keys(fm.players).filter(p => fm.teams[p] === 2).sort((a, b) => fm.orders[a] - fm.orders[b]);
        
        const getFirstName = (fullName) => {
            const name = typeof fullName === 'object' ? fullName.name : fullName;
            return name.split(' ')[0];
        };

        const leftPData = getPlayerData(fm.players[t1Keys[ts.leftPlayerIndex - 1]]);
        const rightPData = getPlayerData(fm.players[t2Keys[ts.rightPlayerIndex - 1]]);

        leftName = getFirstName(leftPData.name);
        rightName = getFirstName(rightPData.name);
        leftTarget = leftPData.target || 0;
        rightTarget = rightPData.target || 0;
        leftAvg = leftPData.average ? leftPData.average.toFixed(3).replace('.', ',') : "0,000";
        rightAvg = rightPData.average ? rightPData.average.toFixed(3).replace('.', ',') : "0,000";
    } else {
        const leftPData = getPlayerData(fm.players[1]);
        const rightPData = getPlayerData(fm.players[2]);
        
        leftName = leftPData.name;
        rightName = rightPData.name;
        leftTarget = leftPData.target || 0;
        rightTarget = rightPData.target || 0;
        leftAvg = leftPData.average ? leftPData.average.toFixed(3).replace('.', ',') : "0,000";
        rightAvg = rightPData.average ? rightPData.average.toFixed(3).replace('.', ',') : "0,000";
    }

    // --- B. Update de Header ---
    
    // ✅ NIEUW: Voeg emoji toe en verberg de '0' bij Triatlon/Dubbeltje (4 spelers)
    const isPhaseGameHeader = ['triatlon-small', 'triatlon-large', 'dubbeltje'].includes(fm.gameType);
    const icons = { 1: "🧙‍♂️", 2: "👷‍♂️", 3: "👮‍♂️", 4: "👨‍🚀" };
    
    let displayLeftName = leftName;
    let displayRightName = rightName;

    if (isPhaseGameHeader && isTeam) {
        // Haal de globale speler-index op (1 t/m 4) op basis van team en volgorde
        const t1Keys = Object.keys(fm.players).filter(p => fm.teams[p] == 1).sort((a, b) => fm.orders[a] - fm.orders[b]);
        const t2Keys = Object.keys(fm.players).filter(p => fm.teams[p] == 2).sort((a, b) => fm.orders[a] - fm.orders[b]);
        
        const leftGlobalIdx = t1Keys[ts.leftPlayerIndex - 1];
        const rightGlobalIdx = t2Keys[ts.rightPlayerIndex - 1];
        
        const leftEmoji = icons[leftGlobalIdx] || "";
        const rightEmoji = icons[rightGlobalIdx] || "";
        
        // Voeg emoji toe aan de naam
        displayLeftName = `${leftEmoji} ${leftName}`;
        displayRightName = `${rightName} ${rightEmoji}`;
        
        // Verberg het target (de '0') in de header bij fase-spellen
        document.getElementById('friendlyHeaderTarget1').textContent = ""; 
        document.getElementById('friendlyHeaderTarget2').textContent = "";
    } else {
        // Bij normale spellen: toon gewoon het target
        document.getElementById('friendlyHeaderTarget1').textContent = leftTarget;
        document.getElementById('friendlyHeaderTarget2').textContent = rightTarget;
    }

    // Update de namen in de header
    document.getElementById('friendlyHeaderName1').textContent = displayLeftName;
    document.getElementById('friendlyHeaderName2').textContent = displayRightName;

    // ✅ CRUCIAAL: Bepaal de discipline op basis van het team dat NU aan de beurt is
    const activePhase = ts.activeSide === 'left' ? ts.leftPhase : ts.rightPhase;
    
    let phaseText = '';
    let phaseColor = '';
    
    if (activePhase === 'vrijspel') {
        phaseText = 'VRIJSPEL';
        phaseColor = '#f39c12'; // Goud/Geel
    } else if (activePhase === 'bandstoten') {
        phaseText = 'BANDSTOTEN';
        phaseColor = '#3498db'; // Blauw
    } else if (activePhase === 'driebanden') {
        phaseText = 'DRIEBANDEN';
        phaseColor = '#e74c3c'; // Rood
    }

    const disciplineEl = document.getElementById('friendlyHeaderDiscipline');
    disciplineEl.textContent = phaseText;
    disciplineEl.style.setProperty('color', phaseColor, 'important'); // ✅ Forceer met !important

    // --- C. Update de Score Cellen ---
    // ✅ Bepaal of het een fase-spel is (eenmalige declaratie voor heel sectie C)
    const isPhaseGameCheck = ['triatlon-small', 'triatlon-large', 'dubbeltje'].includes(fm.gameType);
    
    // ✅ HUIDIG: Toont altijd de punten van de huidige beurt (currentRun)
    // Dit geldt voor ALLE speltypes (normaal, Triatlon, Dubbeltje)
    const leftCurrentDisplay = ts.activeSide === 'left' ? ts.currentRun : 0;
    const rightCurrentDisplay = ts.activeSide === 'right' ? ts.currentRun : 0;
    
    // ✅ NODIG: Bij phase games toont het het resterende fasedoel
    let leftNeeded, rightNeeded;
    
    if (isPhaseGameCheck) {
        // Bij Triatlon/Dubbeltje: toon het resterende fasedoel
        const leftThreshold = fm.thresholds[ts.leftPhase];
        const rightThreshold = fm.thresholds[ts.rightPhase];
        
        leftNeeded = Math.max(0, leftThreshold - ts.leftPhaseScore);
        rightNeeded = Math.max(0, rightThreshold - ts.rightPhaseScore);
    } else {
        // Bij normale matches: toon het resterende target
        leftNeeded = Math.max(0, leftTarget - ts.leftTotalScore);
        rightNeeded = Math.max(0, rightTarget - ts.rightTotalScore);
    }
    
    document.getElementById('friendlyP1NeededVal').textContent = leftNeeded;
    document.getElementById('friendlyP1CurrentVal').textContent = leftCurrentDisplay;
    document.getElementById('friendlyP1TotalVal').textContent = ts.leftTotalScore;

    document.getElementById('friendlyP2NeededVal').textContent = rightNeeded;
    document.getElementById('friendlyP2CurrentVal').textContent = rightCurrentDisplay;
    document.getElementById('friendlyP2TotalVal').textContent = ts.rightTotalScore;

    // ✅ ROOD KLEUREN: 100% Zelfstandig blok (klasse op de parent cel zetten)
    const p1NeededCell = document.getElementById('friendlyP1NeededCell');
    const p2NeededCell = document.getElementById('friendlyP2NeededCell');
    
    // 1. Bepaal of het een fase-spel is
    const isPhaseLocal = ['triatlon-small', 'triatlon-large', 'dubbeltje'].includes(fm.gameType);
    
    // 2. Bepaal de huidige discipline per team
    const leftPhaseLocal = isPhaseLocal ? ts.leftPhase : fm.gameType;
    const rightPhaseLocal = isPhaseLocal ? ts.rightPhase : fm.gameType;
    
    // 3. Drempels per discipline
    const getThresholdLocal = (phase) => (phase === 'driebanden' ? 2 : 5);
    const leftThresh = getThresholdLocal(leftPhaseLocal);
    const rightThresh = getThresholdLocal(rightPhaseLocal);
    
    // 4. Bereken wat er nodig is (opnieuw, om 100% zeker te zijn)
    const calcLeftNeeded = isPhaseLocal 
        ? Math.max(0, fm.thresholds[ts.leftPhase] - ts.leftPhaseScore) 
        : Math.max(0, leftTarget - ts.leftTotalScore);
        
    const calcRightNeeded = isPhaseLocal 
        ? Math.max(0, fm.thresholds[ts.rightPhase] - ts.rightPhaseScore) 
        : Math.max(0, rightTarget - ts.rightTotalScore);

    // 5. DEBUG: Laat in de console zien dat deze code echt wordt uitgevoerd
    console.log("🚨 UI CHECK: Links nodig:", calcLeftNeeded, "vs drempel:", leftThresh, "-> Rood?", calcLeftNeeded <= leftThresh);

    // 6. Pas de klasse toe
    if (calcLeftNeeded <= leftThresh) {
        p1NeededCell.classList.add('danger');
    } else {
        p1NeededCell.classList.remove('danger');
    }
    
    if (calcRightNeeded <= rightThresh) {
        p2NeededCell.classList.add('danger');
    } else {
        p2NeededCell.classList.remove('danger');
    }
        

    // --- D. Update de Statistieken (Fase-blokjes of Gemiddelden) ---
    
    // ✅ DEZE TWEE BLIJVEN ALTIJD BESTAAN (ook bij triatlon, voor elders op het scherm)
    const stat1El = document.getElementById('friendlyStat1');
    const stat2El = document.getElementById('friendlyStat2');
    if (stat1El) stat1El.textContent = leftAvg;
    if (stat2El) stat2El.textContent = rightAvg;
    
    // Check of we een speltype spelen met fases
    const isPhaseGame = ['triatlon-small', 'triatlon-large', 'dubbeltje'].includes(fm.gameType);

    // Helper functie: vergelijkt de fase van DIT team met de kolom die we willen tonen
    const getPhaseBox = (teamPhase, phaseName, targetValue) => {
        const phases = ['vrijspel', 'bandstoten', 'driebanden'];
        const teamIndex = phases.indexOf(teamPhase);
        const targetIndex = phases.indexOf(phaseName);

        if (targetIndex < teamIndex) {
            return { text: '✅', class: 'phase-box-passed' }; // Gehaald
        } else if (targetIndex === teamIndex) {
            return { text: targetValue, class: 'phase-box-active' }; // Actief
        } else {
            return { text: targetValue, class: 'phase-box-future' }; // Toekomst (grijs)
        }
    };

    if (isPhaseGame) {
        const targets = fm.thresholds; 

        // ✅ LINKS: Gebruik ts.leftPhase
        const p1Vrij = getPhaseBox(ts.leftPhase, 'vrijspel', targets.vrijspel);
        const p1Band = getPhaseBox(ts.leftPhase, 'bandstoten', targets.bandstoten);
        const p1Drie = getPhaseBox(ts.leftPhase, 'driebanden', targets.driebanden);

        const p1Box1 = document.getElementById('friendlyP1PlayedAvg');
        const p1Box2 = document.getElementById('friendlyP1Highest');
        const p1Box3 = document.getElementById('friendlyP1TargetAvg');
        
        if (p1Box1) { p1Box1.textContent = p1Vrij.text; p1Box1.className = `stat-box ${p1Vrij.class}`; }
        if (p1Box2) { p1Box2.textContent = p1Band.text; p1Box2.className = `stat-box ${p1Band.class}`; }
        if (p1Box3) { p1Box3.textContent = p1Drie.text; p1Box3.className = `stat-box ${p1Drie.class}`; }

        // ✅ RECHTS: Gebruik ts.rightPhase
        const p2Vrij = getPhaseBox(ts.rightPhase, 'vrijspel', targets.vrijspel);
        const p2Band = getPhaseBox(ts.rightPhase, 'bandstoten', targets.bandstoten);
        const p2Drie = getPhaseBox(ts.rightPhase, 'driebanden', targets.driebanden);

        const p2Box1 = document.getElementById('friendlyP2PlayedAvg');
        const p2Box2 = document.getElementById('friendlyP2Highest');
        const p2Box3 = document.getElementById('friendlyP2TargetAvg');

        if (p2Box1) { p2Box1.textContent = p2Vrij.text; p2Box1.className = `stat-box ${p2Vrij.class}`; }
        if (p2Box2) { p2Box2.textContent = p2Band.text; p2Box2.className = `stat-box ${p2Band.class}`; }
        if (p2Box3) { p2Box3.textContent = p2Drie.text; p2Box3.className = `stat-box ${p2Drie.class}`; }

    } else {
        // NORMALE SPELTYPES: ONVERANDERD
        const leftPlayedAvg = ts.leftTurns.length > 0 ? (ts.leftTotalScore / ts.leftTurns.length).toFixed(2).replace('.', ',') : "0,00";
        const rightPlayedAvg = ts.rightTurns.length > 0 ? (ts.rightTotalScore / ts.rightTurns.length).toFixed(2).replace('.', ',') : "0,00";

        document.getElementById('friendlyP1PlayedAvg').textContent = leftPlayedAvg;
        document.getElementById('friendlyP1Highest').textContent = ts.leftHighestSeries;
        document.getElementById('friendlyP1TargetAvg').textContent = leftAvg;

        document.getElementById('friendlyP2PlayedAvg').textContent = rightPlayedAvg;
        document.getElementById('friendlyP2Highest').textContent = ts.rightHighestSeries;
        document.getElementById('friendlyP2TargetAvg').textContent = rightAvg;
    }


    // --- E. Update de Middenknop (B1, B2, etc.) ---
    const centerInfo = document.getElementById('friendlyCenterInfo');
    
    // Haal het huidige beurt nummer op
    const currentBeurt = ts.activeSide === 'left' ? ts.leftBeurtNummer : ts.rightBeurtNummer;
    
    // Bepaal kleur (Wit voor links/speler 1, Geel voor rechts/speler 2)
    const isWhite = ts.activeSide === 'left';
    const textColor = isWhite ? '#ffffff' : '#f1c40f';
    const glowColor = isWhite ? 'rgba(255, 255, 255, 0.4)' : 'rgba(241, 196, 15, 0.4)';
    
    // ✅ NIEUW: Nabeurt waarschuwing
    let extraInfo = '';
    if (ts.isNabeurt) {
        extraInfo = '<div style="margin-top:15px; font-size:1.3rem; color:#ffcc00; font-weight:bold; text-shadow: 0 0 10px rgba(255, 204, 0, 0.5);">⚠️ NABEURT</div>';
    }
    
    centerInfo.innerHTML = `
        <div style="text-align:center; pointer-events: none;">
            <div style="font-size:6.5rem; font-weight:900; color:${textColor}; line-height:1; text-shadow: 0 0 25px ${glowColor}; transition: color 0.3s ease;">
                B ${currentBeurt}
            </div>
            <div style="margin-top:15px; font-size:1.1rem; color:#bdc3c7; font-weight:bold; text-transform: uppercase; letter-spacing: 1px;">
                Einde beurt? Klik hier
            </div>
            ${extraInfo}
        </div>`;


    // --- F. Visuele Feedback: Actieve speler highlighten, andere dimmen ---
    const p1Cells = [
        document.getElementById('friendlyP1CurrentCell'),
        document.getElementById('friendlyP1TotalCell'),
        document.getElementById('friendlyP1NeededCell')
    ];
    const p2Cells = [
        document.getElementById('friendlyP2CurrentCell'),
        document.getElementById('friendlyP2TotalCell'),
        document.getElementById('friendlyP2NeededCell')
    ];

    // Eerst alle states resetten
    [...p1Cells, ...p2Cells].forEach(el => {
        if (el) el.classList.remove('active-player', 'dimmed', 'turn-hidden');
    });

    if (ts.activeSide === 'left') {
        // Speler 1 is aan de beurt
        p1Cells.forEach(el => el && el.classList.add('active-player'));
        p2Cells.forEach(el => el && el.classList.add('dimmed'));
        
        // HUIDIG blok van speler 2 volledig verbergen
        if (p2Cells[0]) p2Cells[0].classList.add('turn-hidden');
    } else {
        // Speler 2 is aan de beurt
        p2Cells.forEach(el => el && el.classList.add('active-player'));
        p1Cells.forEach(el => el && el.classList.add('dimmed'));
        
        // HUIDIG blok van speler 1 volledig verbergen
        if (p1Cells[0]) p1Cells[0].classList.add('turn-hidden');
    }
    // --- G. Update Statistieken & Spelerkaarten (Beurtenlijst) ---
    
    // ✅ ALLEEN uitvoeren als het GEEN phase game is
    if (!isPhaseGame) {
        // 1. Bereken live gemiddelde (Totaal / Aantal voltooide beurten)
        const leftPlayedAvg = ts.leftTurns.length > 0 ? (ts.leftTotalScore / ts.leftTurns.length).toFixed(2).replace('.', ',') : "0,00";
        const rightPlayedAvg = ts.rightTurns.length > 0 ? (ts.rightTotalScore / ts.rightTurns.length).toFixed(2).replace('.', ',') : "0,00";
    
        // 2. Update de 3 statistiek-blokken per kant
        document.getElementById('friendlyP1PlayedAvg').textContent = leftPlayedAvg;
        document.getElementById('friendlyP1Highest').textContent = ts.leftHighestSeries;
        document.getElementById('friendlyP1TargetAvg').textContent = leftAvg;
    
        document.getElementById('friendlyP2PlayedAvg').textContent = rightPlayedAvg;
        document.getElementById('friendlyP2Highest').textContent = ts.rightHighestSeries;
        document.getElementById('friendlyP2TargetAvg').textContent = rightAvg;
    }


    // 3. Helper functie om de beurtenlijst te bouwen (EXACTE KOPIE VAN COMPETITIE)
    const renderTurnsList = (turns, highestSeries) => {
        if (!turns || turns.length === 0) {
            return '<div style="text-align:center;color:#95a5a6;padding:20px;font-size:0.9em;">Nog geen beurten</div>';
        }
        
        const minBeurten = 56;
        const totalToShow = Math.max(minBeurten, turns.length);
        const highest = highestSeries || 0;
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

    // 4. Update de Spelerkaarten zelf
    const isLeftActive = ts.activeSide === 'left';
    const isRightActive = ts.activeSide === 'right';

    const p1Card = document.getElementById('friendlyPlayer1Card');
    const p2Card = document.getElementById('friendlyPlayer2Card');

    if (p1Card) {
        p1Card.className = `player-card player-white ${isLeftActive ? 'player-active' : 'player-inactive'}`;
        p1Card.innerHTML = `
            <h3>${leftName} ⚪</h3>
            <div class="turns-scroll-container">
                <div class="turns-list">${renderTurnsList(ts.leftTurns, ts.leftHighestSeries)}</div>
            </div>
        `;
    }

    if (p2Card) {
        p2Card.className = `player-card player-yellow ${isRightActive ? 'player-active' : 'player-inactive'}`;
        p2Card.innerHTML = `
            <h3>${rightName} 🟡</h3>
            <div class="turns-scroll-container">
                <div class="turns-list">${renderTurnsList(ts.rightTurns, ts.rightHighestSeries)}</div>
            </div>
        `;
    }
};

// 3. SCORE WIJZIGEN (+1 of -1) - HERSTELD
window.friendlyChangeScore = function(delta) {
    const fm = state.friendlyMatch;
    const ts = fm.turnState;
    
    // ✅ Als de match al voorbij is, doe niets
    if (ts.matchEnded) return;

    // Sla state op voor undo
    window.lastFriendlyState = JSON.parse(JSON.stringify(fm));

    // Update de score
    ts.currentRun += delta;
    
    if (ts.activeSide === 'left') {
        ts.leftTotalScore += delta;
        ts.leftPhaseScore += delta;
        ts.leftTeamRun = (ts.leftTeamRun || 0) + delta; 
        console.log("🔵 LINKS gescoord:", delta, "| Huidige reeks:", ts.currentRun, "| TEAM RUN:", ts.leftTeamRun);
    } else {
        ts.rightTotalScore += delta;
        ts.rightPhaseScore += delta;
        ts.rightTeamRun = (ts.rightTeamRun || 0) + delta;
        console.log("🟡 RECHTS gescoord:", delta, "| Huidige reeks:", ts.currentRun, "| TEAM RUN:", ts.rightTeamRun);
    }

    // ✅ CHECK 1: Heeft het actieve team zijn fase-drempel bereikt? (EERST checken!)
    const isPhaseGame = ['triatlon-small', 'triatlon-large', 'dubbeltje'].includes(fm.gameType);
    if (isPhaseGame) {
        const activePhase = ts.activeSide === 'left' ? ts.leftPhase : ts.rightPhase;
        const currentPhaseScore = ts.activeSide === 'left' ? ts.leftPhaseScore : ts.rightPhaseScore;
        const threshold = fm.thresholds[activePhase];

        if (currentPhaseScore >= threshold) {
            // ✅ Update UI eerst, zodat gebruiker de eindstand even ziet
            window.updateFriendlyUI();
            
            if (activePhase === 'driebanden') {
                // ✅ MATCH IS VOORBIJ! Sla de laatste TEAM-reeks op
                if (ts.activeSide === 'left') {
                    const finalScore = ts.leftTeamRun || ts.currentRun;
                    ts.leftTurns.push(finalScore);
                    if (finalScore > ts.leftHighestSeries) ts.leftHighestSeries = finalScore;
                } else {
                    const finalScore = ts.rightTeamRun || ts.currentRun;
                    ts.rightTurns.push(finalScore);
                    if (finalScore > ts.rightHighestSeries) ts.rightHighestSeries = finalScore;
                }

                window.updateFriendlyUI();
                window.endFriendlyMatch();
                return;
            } else {
                // Nog een volgende fase, dus wissel van fase
                window.friendlyAdvancePhase();
                return;
            }
        }
    }

    // ✅ CHECK 2: Check of het maximum is bereikt (bij dubbeltje)
    // Dit komt NU PAS, zodat de threshold check eerst kan zien of de match moet eindigen
    if (fm.gameType === 'dubbeltje') {
        const activePhase = ts.activeSide === 'left' ? ts.leftPhase : ts.rightPhase;
        const limit = fm.limits[activePhase];
        
        if (ts.currentRun >= limit) {
            // Max reeks bereikt! Beurt is direct over, wissel naar partner.
            window.friendlySwitchToPartner();
            return;
        }
    }
    if (isPhaseGame) {
        const activePhase = ts.activeSide === 'left' ? ts.leftPhase : ts.rightPhase;
        const currentPhaseScore = ts.activeSide === 'left' ? ts.leftPhaseScore : ts.rightPhaseScore;
        const threshold = fm.thresholds[activePhase];

        if (currentPhaseScore >= threshold) {
            // ✅ Update UI eerst, zodat gebruiker de eindstand even ziet
            window.updateFriendlyUI();
            
            if (activePhase === 'driebanden') {
                // ✅ CRUCIAAL: Sla de laatste, winnende TEAM-reeks op!
                if (ts.activeSide === 'left') {
                    const finalScore = ts.leftTeamRun || ts.currentRun;
                    ts.leftTurns.push(finalScore);
                    if (finalScore > ts.leftHighestSeries) ts.leftHighestSeries = finalScore;
                } else {
                    const finalScore = ts.rightTeamRun || ts.currentRun;
                    ts.rightTurns.push(finalScore);
                    if (finalScore > ts.rightHighestSeries) ts.rightHighestSeries = finalScore;
                }

                // Update UI één laatste keer zodat de laatste beurt zichtbaar is in de kaart
                window.updateFriendlyUI();
                
                // Nu pas de match beëindigen
                window.endFriendlyMatch();
                return;
            } else {
                // Nog een volgende fase, dus wissel van fase
                window.friendlyAdvancePhase();
                return;
            }
        }
    }

    // Update UI (voor alle andere gevallen)
    window.updateFriendlyUI();
};





// 4. MISS / EINDE BEURT (MET TARGET EN NABEURT CHECK)
window.friendlyMiss = function() {
    const fm = state.friendlyMatch;
    const ts = fm.turnState;

    // Sla state op voor undo
    window.lastFriendlyState = JSON.parse(JSON.stringify(fm));

    // ✅ CHECK: Is dit een phase game (Triatlon/Dubbeltje)?
    const isPhaseGame = ['triatlon-small', 'triatlon-large', 'dubbeltje'].includes(fm.gameType);

    // 1. Sla de huidige reeks op in de beurtenlijst en update hoogste reeks
    // ✅ Voor fase-spellen: gebruik de team-run (totaal van beide partners)
    // ✅ Voor normale matches: gebruik currentRun (alleen van de huidige speler)
    if (ts.activeSide === 'left') {
        const scoreToRecord = isPhaseGame ? (ts.leftTeamRun || ts.currentRun) : ts.currentRun;
        ts.leftTurns.push(scoreToRecord);
        if (scoreToRecord > ts.leftHighestSeries) ts.leftHighestSeries = scoreToRecord;
        ts.leftTeamRun = 0; // Reset team-run voor de volgende beurt
    } else {
        const scoreToRecord = isPhaseGame ? (ts.rightTeamRun || ts.currentRun) : ts.currentRun;
        ts.rightTurns.push(scoreToRecord);
        if (scoreToRecord > ts.rightHighestSeries) ts.rightHighestSeries = scoreToRecord;
        ts.rightTeamRun = 0; // Reset team-run voor de volgende beurt
    }

    if (!isPhaseGame) {
        // NORMALE SPELTYPES: Target check (zoals vroeger)
        
        // 2. TARGET CHECK: Heeft de speler die net stopte zijn doel bereikt?
        const activeScore = ts.activeSide === 'left' ? ts.leftTotalScore : ts.rightTotalScore;
        const activeTarget = ts.activeSide === 'left' ? fm.players[1].target : fm.players[2].target;
        const reached = activeScore >= activeTarget;

        // Geval A: Eerste speler die het target haalt
        if (reached && ts.firstToTarget === null) {
            ts.firstToTarget = ts.activeSide;
            
            if (ts.activeSide === 'left') {
                // Speler 1 haalde als eerste het target → Nabeurt voor Speler 2
                ts.isNabeurt = true;
                ts.lastMissedBy = 'left';
                ts.activeSide = 'right';
                ts.currentRun = 0;
                ts.rightBeurtNummer++;
                window.updateFriendlyUI();
                return;
            } else {
                // Speler 2 haalde als eerste het target → Match is direct voorbij
                window.endFriendlyMatch();
                return;
            }
        }

        // Geval B: We zaten al in de nabeurt
        if (ts.isNabeurt) {
            window.endFriendlyMatch();
            return;
        }
    }
    // ✅ Bij phase games: geen target check, geen nabeurt logica

    // Geval C: Normale wissel (niemand heeft het target gehaald, of het was geen eerste keer)
    ts.lastMissedBy = ts.activeSide; // 1. Onthoud wie er net miste
    ts.activeSide = ts.activeSide === 'left' ? 'right' : 'left'; // 2. Draai de beurt om
    ts.currentRun = 0;

    // 3. Update de partner van het team dat NET miste (lastMissedBy), niet de nieuwe actieve kant!
    if (ts.lastMissedBy === 'left') {
        ts.leftPlayerIndex = ts.leftPlayerIndex === 1 ? 2 : 1;
        ts.leftBeurtNummer++;
    } else {
        ts.rightPlayerIndex = ts.rightPlayerIndex === 1 ? 2 : 1;
        ts.rightBeurtNummer++;
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

    // ✅ Reset ALLEEN de currentRun (voor de nieuwe speler)
    // De TeamRun blijft staan want die hoort bij de teambeurt!
    ts.currentRun = 0;

    // Update UI
    window.updateFriendlyUI();
};

// 6. FASE-OVERGANG (Alleen voor het actieve team!)
window.friendlyAdvancePhase = function() {
    const fm = state.friendlyMatch;
    const ts = fm.turnState;

    // Wissel alleen de fase van het team dat aan de beurt is
    if (ts.activeSide === 'left') {
        if (ts.leftPhase === 'vrijspel') {
            ts.leftPhase = 'bandstoten';
            ts.phase = 'bandstoten';
        } else if (ts.leftPhase === 'bandstoten') {
            ts.leftPhase = 'driebanden';
            ts.phase = 'driebanden';
        }
        ts.leftPhaseScore = 0; // Reset fasescore
    } else {
        if (ts.rightPhase === 'vrijspel') {
            ts.rightPhase = 'bandstoten';
            ts.phase = 'bandstoten';
        } else if (ts.rightPhase === 'bandstoten') {
            ts.rightPhase = 'driebanden';
            ts.phase = 'driebanden';
        }
        ts.rightPhaseScore = 0; // Reset fasescore
    }

    // Alleen wisselen van partner bij Dubbeltje
    if (fm.gameType === 'dubbeltje') {
        window.friendlySwitchToPartner();
    }

    // Update UI
    window.updateFriendlyUI();
};
// 7. UNDO
window.friendlyUndo = function() {
    if (!window.lastFriendlyState) return;
    
    state.friendlyMatch = window.lastFriendlyState;
    window.lastFriendlyState = null;
    
    window.updateFriendlyUI();
};

// 5. MATCH EINDE & SAMENVATTING (HERGEBRUIKT PAGINA 6)
window.endFriendlyMatch = function() {
    const fm = state.friendlyMatch;
    const ts = fm.turnState;

    // 1. Markeer de match als beëindigd
    ts.matchEnded = true;

    // 2. ✅ Bepaal de winnaar
    let winnerName = "";
    const isPhaseGame = ['triatlon-small', 'triatlon-large', 'dubbeltje'].includes(fm.gameType);

    if (isPhaseGame) {
        // ✅ FASE-SPELLEN: Wie het target in driebanden haalt, wint direct (geen nabeurt, geen rendement)
        // Het team dat aan de beurt was toen de match eindigde, is de winnaar
        winnerName = ts.activeSide === 'left' ? fm.players[1].name : fm.players[2].name;
        
        // Bij 4-speler mode: toon de teamnaam (beide spelers)
        if (fm.numPlayers === 4) {
            const t1Keys = Object.keys(fm.players).filter(p => fm.teams[p] == 1).sort((a, b) => fm.orders[a] - fm.orders[b]);
            const t2Keys = Object.keys(fm.players).filter(p => fm.teams[p] == 2).sort((a, b) => fm.orders[a] - fm.orders[b]);
            
            if (ts.activeSide === 'left') {
                winnerName = `${fm.players[t1Keys[0]].name} & ${fm.players[t1Keys[1]].name}`;
            } else {
                winnerName = `${fm.players[t2Keys[0]].name} & ${fm.players[t2Keys[1]].name}`;
            }
        }
    } else {
        // ✅ NORMALE MATCHES: Rendement-logica (zoals vroeger)
        if (ts.firstToTarget === 'right') {
            // Speler 2 haalde als eerste het target → Directe winst
            winnerName = fm.players[2].name;
        } else {
            // Speler 1 haalde als eerste het target, Speler 2 heeft zijn nabeurt gehad
            // Nu vergelijken we het rendement
            
            const tsg1 = fm.players[1].average ? parseFloat(fm.players[1].average) : 1.0;
            const tsg2 = fm.players[2].average ? parseFloat(fm.players[2].average) : 1.0;

            const avg1 = ts.leftTotalScore / Math.max(1, ts.leftTurns.length);
            const avg2 = ts.rightTotalScore / Math.max(1, ts.rightTurns.length);

            const rendement1 = avg1 / tsg1;
            const rendement2 = avg2 / tsg2;

            console.log(`📊 Rendement Speler 1: ${(rendement1 * 100).toFixed(1)}%`);
            console.log(`📊 Rendement Speler 2: ${(rendement2 * 100).toFixed(1)}%`);

            if (rendement2 > rendement1) {
                winnerName = fm.players[2].name;
            } else {
                winnerName = fm.players[1].name;
            }
        }
    }

    // 3. Bereid de data voor zodat we Pagina 6 (Competitie Samenvatting) kunnen hergebruiken
    
    // ✅ NIEUW: Bepaal de weergavenamen (met emojis voor 4-speler fase-spellen)
    let displayP1 = fm.players[1].name;
    let displayP2 = fm.players[2].name;
    const isPhaseGameSummary = ['triatlon-small', 'triatlon-large', 'dubbeltje'].includes(fm.gameType);

    if (fm.numPlayers === 4 && isPhaseGameSummary) {
        const icons = { 1: "🧙‍♂️", 2: "👷‍♂️", 3: "👮‍♂️", 4: "👨‍🚀" };
        
        // Haal de spelers per team op, gesorteerd op volgorde
        const t1Keys = Object.keys(fm.players).filter(p => fm.teams[p] == 1).sort((a, b) => fm.orders[a] - fm.orders[b]);
        const t2Keys = Object.keys(fm.players).filter(p => fm.teams[p] == 2).sort((a, b) => fm.orders[a] - fm.orders[b]);
        
        const p1_1 = fm.players[t1Keys[0]];
        const p1_2 = fm.players[t1Keys[1]];
        const p2_1 = fm.players[t2Keys[0]];
        const p2_2 = fm.players[t2Keys[1]];

        // Maak een mooie string met emojis en namen
        displayP1 = `${icons[t1Keys[0]]} ${p1_1.name} & ${icons[t1Keys[1]]} ${p1_2.name}`;
        displayP2 = `${icons[t2Keys[0]]} ${p2_1.name} & ${icons[t2Keys[1]]} ${p2_2.name}`;
    }

    // We mappen de friendly data naar de state.currentMatch structuur
    state.currentMatch = {
        id: 'friendly_' + Date.now(),
        p1: displayP1, // ✅ Gebruik de aangepaste naam
        p2: displayP2, // ✅ Gebruik de aangepaste naam
        date: new Date().toISOString().split('T')[0],
        discipline: fm.gameType === 'vrijspel' ? 'Vrijspel' : (fm.gameType === 'bandstoten' ? 'Bandstoten' : 'Driebanden'),
        cat: 'Vriendschappelijk',
        p1Score: ts.leftTotalScore,
        p2Score: ts.rightTotalScore,
        p1Turns: [...ts.leftTurns],
        p2Turns: [...ts.rightTurns],
        p1Highest: ts.leftHighestSeries,
        p2Highest: ts.rightHighestSeries,
        target1: fm.players[1].target,
        target2: fm.players[2].target,
        completed: true,
        winner: winnerName
    };

    // We mappen ook de spelers voor de statistieken op Pagina 6
    state.player1 = {
        score: ts.leftTotalScore,
        turns: [...ts.leftTurns],
        highestSeries: ts.leftHighestSeries,
        target: fm.players[1].target,
        fixedTSG: fm.players[1].average ? fm.players[1].average.toFixed(3).replace('.', ',') : '−'
    };

    state.player2 = {
        score: ts.rightTotalScore,
        turns: [...ts.rightTurns],
        highestSeries: ts.rightHighestSeries,
        target: fm.players[2].target,
        fixedTSG: fm.players[2].average ? fm.players[2].average.toFixed(3).replace('.', ',') : '−'
    };

    // 4. Update de UI van Pagina 14 één laatste keer (voor de visuele overgang)
    window.updateFriendlyUI();

    // 5. Navigeer na een korte vertraging naar de samenvatting (Pagina 6)
    setTimeout(() => {
        if (typeof renderMatchSummary === 'function') {
            renderMatchSummary();
        }
        if (typeof showPage === 'function') {
            showPage(6);
        }
    }, 600);
};


/* =========================================================================
   ✅ MODAL: TARGET & GEMIDDELDE LOGICA (DEEL 1: INFO TONEN)
   ========================================================================= */

// Tijdelijke variabelen om de gekozen target/gemiddelde op te slaan
window.tempPlayerTarget = 0;
window.tempPlayerAverage = 0;

// Update de info in de modal op basis van de ingevoerde naam
window.updatePlayerTargetInfo = function(playerName) {
    const fm = state.friendlyMatch;
    const infoDiv = document.getElementById('playerTargetInfo');
    if (!infoDiv) return; // Veiligheidscheck
    
    // Alleen tonen bij vrijspel, bandstoten of driebanden
    const eligibleTypes = ['vrijspel', 'bandstoten', 'driebanden'];
    if (!fm || !eligibleTypes.includes(fm.gameType) || !playerName || playerName.trim() === '') {
        infoDiv.classList.add('hidden');
        infoDiv.classList.remove('data-found', 'manual-input');
        return;
    }

    // Zoek speler in state.players (naam + discipline)
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
        // SCENARIO B: Geen data (Dropdown tonen)
        window.tempPlayerTarget = 0; 
        window.tempPlayerAverage = 0;

        infoDiv.classList.remove('hidden', 'data-found');
        infoDiv.classList.add('manual-input');
        
        let options = '<option value="0">-- Kies doel (0) --</option>';
        for (let i = 5; i <= 100; i += 5) {
            options += `<option value="${i}">${i}</option>`;
        }

        infoDiv.innerHTML = `
            <div class="target-info-row">
                <div class="target-stat" style="align-items: flex-start;">
                    <span class="label" style="color: #e74c3c;">⚠️ Geen data</span>
                    <span style="font-size: 0.8rem; color: #95a5a6;">Kies handmatig:</span>
                </div>
                <div class="target-stat" style="flex: 2;">
                    <select id="manualTargetSelect" class="target-select" onchange="window.setManualTarget(this.value)">
                        ${options}
                    </select>
                </div>
            </div>
        `;
    }
};

// Wordt aangeroepen wanneer de dropdown verandert
window.setManualTarget = function(value) {
    window.tempPlayerTarget = parseInt(value);
    console.log(`✅ Handmatig doel ingesteld op: ${window.tempPlayerTarget}`);
};


/* =========================================================================
   3-SPELERS VRIENDSCHAPPELIJKE MODUS (100% GEÏSOLEERD + FAIL-SAFE)
   ========================================================================= */


// 1. INITIALISATIE: Zet de basisstate op voor 3 spelers
window.init3PlayerScoring = function() {
    console.log("🚀 init3PlayerScoring wordt aangeroepen...");
    const fm = state.friendlyMatch;
    
    if (!fm) {
        console.error("❌ FOUT: state.friendlyMatch bestaat niet!");
        return;
    }

    // ✅ NIEUW: Gebruik de echte spelersdata als die beschikbaar is (uit de bal-selectie)
    if (fm.players && fm.players.length === 3 && fm.players[0].name) {
        console.log("✅ Echte spelersdata gevonden, gebruiken...");
        
        if (!fm.state3p) {
            fm.state3p = {
                activeIndex: 0, // Start altijd met de witte speler (index 0)
                currentRun: 0,
                matchEnded: false,
                firstToTarget: null,
                nabeurtQueue: [],
                players: [
                    { id: 1, name: fm.players[0].name, color: 'white', target: fm.players[0].target, total: 0, turns: [], highest: 0 },
                    { id: 2, name: fm.players[1].name, color: 'yellow', target: fm.players[1].target, total: 0, turns: [], highest: 0 },
                    { id: 3, name: fm.players[2].name, color: 'red', target: fm.players[2].target, total: 0, turns: [], highest: 0 }
                ]
            };
        }
    } else {
        // ✅ FAIL-SAFE: Maak test-data aan als er geen echte data is (voor direct testen)
        console.log("⚠️ Geen echte spelersdata, fail-safe testdata aanmaken...");
        if (!fm.state3p) {
            fm.state3p = {
                activeIndex: 0,
                currentRun: 0,
                matchEnded: false,
                firstToTarget: null,
                nabeurtQueue: [],
                players: [
                    { id: 1, name: "Speler 1 (Wit)", color: 'white', target: 15, total: 0, turns: [], highest: 0 },
                    { id: 2, name: "Speler 2 (Geel)", color: 'yellow', target: 15, total: 0, turns: [], highest: 0 },
                    { id: 3, name: "Speler 3 (Rood)", color: 'red', target: 15, total: 0, turns: [], highest: 0 }
                ]
            };
        }
    }
    
    window.update3PlayerUI();
};

// 2. SCORE WIJZIGEN (+1 of -1)
window.change3PlayerScore = function(delta) {
    console.log(`👉 change3PlayerScore aangeroepen met delta: ${delta}`);
    
    // ✅ FAIL-SAFE: Initialiseer automatisch als het nog niet bestaat
    if (!state.friendlyMatch || !state.friendlyMatch.state3p) {
        window.init3PlayerScoring();
    }

    const fm = state.friendlyMatch;
    const s3 = fm.state3p;
    
    if (s3.matchEnded) {
        console.log("⛔ Match is al beëindigd.");
        return; 
    }

    // ✅ NIEUW: Sla de huidige staat op VOORDAT we iets veranderen
    window.last3pState = JSON.parse(JSON.stringify(state.friendlyMatch));
    
    const activePlayer = s3.players[s3.activeIndex];
    console.log(`   Huidige speler: ${activePlayer.name}, Huidige reeks was: ${s3.currentRun}`);
    
    // Update scores
    s3.currentRun += delta;
    activePlayer.total += delta;
    console.log(`   Nieuwe reeks: ${s3.currentRun}, Nieuwe totaal: ${activePlayer.total}`);

    // Update UI direct
    window.update3PlayerUI();
};

// 3. EINDE BEURT (MET SLIMME NABEURT WACHTRIJ)
window.end3PlayerTurn = function() {
    console.log("🛑 end3PlayerTurn aangeroepen");
    if (!state.friendlyMatch || !state.friendlyMatch.state3p) {
        window.init3PlayerScoring();
        return; 
    }

    const fm = state.friendlyMatch;
    const s3 = fm.state3p;
    if (s3.matchEnded) return;

    // ✅ NIEUW: Sla de huidige staat op VOORDAT we iets veranderen
    window.last3pState = JSON.parse(JSON.stringify(state.friendlyMatch));

    const activePlayer = s3.players[s3.activeIndex];
    const activeIndex = s3.activeIndex;

    // 1. Sla de reeks op in de beurtenlijst en update hoogste reeks
    activePlayer.turns.push(s3.currentRun);
    if (s3.currentRun > activePlayer.highest) {
        activePlayer.highest = s3.currentRun;
    }

    // 2. CHECK: Heeft deze speler zojuist zijn target gehaald én is hij de EERSTE die dat doet?
    const reachedTarget = activePlayer.total >= activePlayer.target;
    
    if (reachedTarget && s3.firstToTarget === null) {
        console.log(`🎯 ${activePlayer.name} heeft als EERSTE het target gehaald!`);
        s3.firstToTarget = activeIndex; // Onthoud wie als eerste uit was

        // Bepaal wie er nog een nabeurt krijgt (de wachtrij)
        if (activeIndex === 0) { // Wit was als eerste
            s3.nabeurtQueue = [1, 2]; // Geel, dan Rood
        } else if (activeIndex === 1) { // Geel was als eerste
            s3.nabeurtQueue = [2]; // Alleen Rood (Wit had zijn beurt al)
        } else if (activeIndex === 2) { // Rood was als eerste
            s3.nabeurtQueue = []; // Niemand meer, Rood wint direct
        }
    }

    // 3. Bepaal wie er nu aan de beurt is
    if (s3.nabeurtQueue.length > 0) {
        // We zitten in de nabeurt-fase: haal de volgende speler uit de wachtrij
        s3.activeIndex = s3.nabeurtQueue.shift(); // Haalt de eerste uit de array
        console.log(`➡️ Nabeurt: volgende speler is index ${s3.activeIndex}`);
        
        // Als de wachtrij nu leeg is, is de match na deze beurt voorbij
        if (s3.nabeurtQueue.length === 0) {
            // We markeren de match als beëindigd, maar laten de speler eerst zijn beurt maken
            // (De daadwerkelijke 'matchEnded' check doen we na hun beurt, of we doen het nu en ze spelen hun laatste beurt)
            // Laten we het simpel houden: als de queue leeg is, is dit de allerlaatste beurt van de match.
        }
    } else if (s3.firstToTarget !== null) {
        // De wachtrij was al leeg, en iemand had al gewonnen. Match is nu echt voorbij.
        s3.matchEnded = true;
        console.log("🏁 Match beëindigd!");
    } else {
        // Normale wissel (nog niemand heeft het target gehaald)
        s3.activeIndex = (s3.activeIndex + 1) % 3;
    }

    // Reset de huidige reeks voor de volgende speler
    s3.currentRun = 0;

    window.update3PlayerUI();
    
    // 4. Als de match net is geëindigd, trigger de eindafhandeling
    if (s3.matchEnded) {
        setTimeout(() => window.end3PlayerMatch(), 500);
    }
};

/* =========================================================================
   HELPER: BEURTENLIJST RENDEREN VOOR 3 SPELERS (COMPETITIE-STIJL)
   ========================================================================= */
const render3PTurnsList = (turns, highest) => {
    if (!turns || turns.length === 0) {
        return '<div style="text-align:center;color:#7f8c8d;padding:15px;font-size:0.85em;">Nog geen beurten</div>';
    }
    
    const minBeurten = 56; // Zelfde als competitie
    const totalToShow = Math.max(minBeurten, turns.length);
    const highestVal = highest || 0;
    
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
                
                if (score === highestVal && highestVal > 0) {
                    classes += ' highest-series';
                }
            }
            
            if (i === turns.length && score !== highestVal) {
                classes += ' latest-turn';
            }
        } else {
            classes += ' pending';
        }
        
        // Compacte layout voor smalle kolom
        html += `<div class="${classes}"><span>B${i}: ${scoreDisplay}</span></div>`;
    }
    return html;
};


/* =========================================================================
   UI UPDATEN: MET STATISTIEKEN, BEURTENLIJST, NAAM, TARGET EN HUIDIG LOGICA
   ========================================================================= */
// Hulpfunctie om namen af te korten (bijv. "Alain AUREAU" -> "Alain A.")
const formatShortName = (fullName) => {
    if (!fullName) return "Onbekend";
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
        return `${parts[0]} ${parts[1].charAt(0)}.`;
    }
    return parts[0]; // Als er maar 1 naam is
};

window.update3PlayerUI = function() {
    const fm = state.friendlyMatch;
    if (!fm || !fm.state3p) return;
    
    const s3 = fm.state3p;
    const colorNames = ['WIT', 'GEEL', 'ROOD'];

    // 1. Update de middenknop
    const turnIndicator = document.getElementById('friendly3p-turn-indicator');
    if (turnIndicator) {
        let turnText = `BEURT: ${colorNames[s3.activeIndex]}`;
        let turnColor = s3.activeIndex === 0 ? '#ffffff' : (s3.activeIndex === 1 ? '#f1c40f' : '#e74c3c');
        
        if (s3.firstToTarget !== null && !s3.matchEnded) {
            turnText += ' ⚠️ NABEURT';
            turnColor = '#ffcc00';
        } else if (s3.matchEnded) {
            turnText = 'MATCH VOORBIJ';
            turnColor = '#e74c3c';
        }

        turnIndicator.textContent = turnText;
        turnIndicator.style.color = turnColor;
    }

    // 2. Update de 3 kolommen (inclusief NAAM, TARGET, stats en beurtenlijst)
    s3.players.forEach((player, index) => {
        const nameEl = document.getElementById(`friendly3p-name${index + 1}`);
        const targetEl = document.getElementById(`friendly3p-target${index + 1}`);
        const currentEl = document.getElementById(`friendly3p-current${index + 1}`);
        const totalEl = document.getElementById(`friendly3p-total${index + 1}`);
        const col = document.getElementById(`friendlyP3Col${index + 1}`);

        if (nameEl && targetEl && currentEl && totalEl && col) {
            // Naam en Target updaten
            nameEl.textContent = formatShortName(player.name);
            targetEl.textContent = player.target;

            // ✅ NIEUW: HUIDIG alleen tonen voor de actieve speler
            const currentItem = currentEl.parentElement;
            
            if (index === s3.activeIndex && !s3.matchEnded) {
                // Speler is aan de beurt: toon de score en maak het blokje opvallend
                currentEl.textContent = s3.currentRun;
                if (currentItem) currentItem.classList.add('active-run');
            } else {
                // Speler is NIET aan de beurt: toon een streepje en verwijder de opmaak
                currentEl.textContent = '-';
                if (currentItem) currentItem.classList.remove('active-run');
            }

            // Totaal updaten
            totalEl.textContent = player.total;

            // Active player highlight op de kolom
            if (index === s3.activeIndex && !s3.matchEnded) {
                col.classList.add('active-player');
            } else {
                col.classList.remove('active-player');
            }

            // Statistieken berekenen
            const mainPlayer = state.players ? state.players.find(p => p.name === player.name) : null;
            const tsg = mainPlayer ? (mainPlayer.tsg || mainPlayer.fixedTSG || '−') : '−';
            const avg = player.turns.length > 0 ? (player.total / player.turns.length).toFixed(2).replace('.', ',') : "0,00";

            // HTML genereren voor Stats en Beurten (met classes voor grote cijfers)
            const statsHtml = `
                <div class="stats3p-grid">
                    <div class="stats3p-item">
                        <div class="stats3p-label">Gem.</div>
                        <div class="stats3p-value">${avg}</div>
                    </div>
                    <div class="stats3p-item">
                        <div class="stats3p-label">Hoogste</div>
                        <div class="stats3p-value">${player.highest}</div>
                    </div>
                    <div class="stats3p-item">
                        <div class="stats3p-label">TSG</div>
                        <div class="stats3p-value">${tsg}</div>
                    </div>
                </div>
            `;

            const turnsHtml = `
                <div class="turns-scroll-container">
                    <div class="turns-list">${render3PTurnsList(player.turns, player.highest)}</div>
                </div>
            `;

            // Vervang de placeholders door de echte content
            let statsPlaceholder = col.querySelector('.col-stats-placeholder');
            let turnsPlaceholder = col.querySelector('.col-turns-placeholder');
            
            if (statsPlaceholder) {
                statsPlaceholder.style.padding = '0';
                statsPlaceholder.style.background = 'transparent';
                statsPlaceholder.innerHTML = statsHtml;
            }
            if (turnsPlaceholder) {
                turnsPlaceholder.style.padding = '0';
                turnsPlaceholder.style.background = 'transparent';
                turnsPlaceholder.innerHTML = turnsHtml;
            }
        }
    });
};
// 5. MATCH EINDE AFHANDELING → GA NAAR SAMENVATTING
window.end3PlayerMatch = function() {
    const fm = state.friendlyMatch;
    const s3 = fm.state3p;
    
    // Bepaal winnaar voor de log
    let winnerName = "Onbekend";
    if (s3.firstToTarget !== null) {
        winnerName = s3.players[s3.firstToTarget].name;
    }
    
    console.log(`🏁 MATCH VOORBIJ! Winnaar: ${winnerName}`);
    
    // Navigeer naar de samenvatting pagina
    setTimeout(() => {
        window.show3PlayerSummary();
    }, 500);
};


/* =========================================================================
   PAGINA 15 (3 SPELERS): SAMENVATTING RENDEREN
   ========================================================================= */

// 1. Render de samenvatting met alle data
window.render3PlayerSummary = function() {
    const fm = state.friendlyMatch;
    if (!fm || !fm.state3p) return;
    
    const s3 = fm.state3p;
    const colorNames = ['WIT', 'GEEL', 'ROOD'];
    
    // Bepaal winnaar
    let winnerName = "Onbekend";
    let winnerIndex = -1;
    if (s3.firstToTarget !== null) {
        winnerName = s3.players[s3.firstToTarget].name;
        winnerIndex = s3.firstToTarget;
    }
    
    // Update header
    document.getElementById('summary3p-winnerName').textContent = winnerName;
    
    // Update subtitle op basis van hoe de match eindigde
    const subtitle = document.getElementById('summary3p-subtitle');
    if (s3.firstToTarget === 2) {
        subtitle.textContent = '(Rood haalde als eerste het target - directe winst)';
    } else {
        subtitle.textContent = '(Eerste speler die het target haalde)';
    }
    
    // Update de 3 kolommen
    s3.players.forEach((player, index) => {
        const idx = index + 1;
        
        // Naam
        document.getElementById(`summary3p-name${idx}`).textContent = player.name;
        
        // Statistieken
        document.getElementById(`summary3p-score${idx}`).textContent = player.total;
        document.getElementById(`summary3p-turns${idx}`).textContent = player.turns.length;
        document.getElementById(`summary3p-highest${idx}`).textContent = player.highest;
        
        const avg = player.turns.length > 0 ? (player.total / player.turns.length).toFixed(2).replace('.', ',') : "0,00";
        document.getElementById(`summary3p-avg${idx}`).textContent = avg;
        
        document.getElementById(`summary3p-target${idx}`).textContent = player.target;
        
        // TSG ophalen
        const mainPlayer = state.players ? state.players.find(p => p.name === player.name) : null;
        const tsg = mainPlayer ? (mainPlayer.tsg || mainPlayer.fixedTSG || '−') : '−';
        document.getElementById(`summary3p-tsg${idx}`).textContent = tsg;
        
        // Beurtenlijst renderen
        const turnsListEl = document.getElementById(`summary3p-turnsList${idx}`);
        turnsListEl.innerHTML = render3PTurnsListSummary(player.turns, player.highest);
        
        // Winnaar highlight
        const col = turnsListEl.closest('.summary3p-col');
        if (index === winnerIndex) {
            col.classList.add('winner-col');
        } else {
            col.classList.remove('winner-col');
        }
    });
};

// 2. Navigeer naar de samenvatting
window.show3PlayerSummary = function() {
    // ✅ VERBERG ALLE PAGINA'S EN RUIM OP
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
        p.classList.remove('hidden'); // ✅ Ruim .hidden op
        p.style.display = ''; // ✅ Wis inline display
    });
    
    // ✅ TOON SAMENVATTING
    const summaryPage = document.getElementById('page15-3player-summary');
    if (summaryPage) {
        summaryPage.classList.add('active');
        summaryPage.classList.remove('hidden'); // ✅ Voor het geval die er is
        summaryPage.style.display = ''; // ✅ Wis inline display
        state.currentPage = 15;
        window.render3PlayerSummary();
    }
};

// 3. Terug naar hoofdmenu
window.backToHomeFrom3PlayerSummary = function() {
    // Reset states
    state.friendlyMatch = null;
    window.last3pState = null;
    
    // ✅ VERBERG ALLE PAGINA'S EN RUIM OP
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
        p.classList.remove('hidden'); // ✅ Ruim .hidden op
        p.style.display = ''; // ✅ Wis inline display
    });
    
    // ✅ TOON PAGINA 1
    const page1 = document.getElementById('page1');
    if (page1) {
        page1.classList.add('active');
        page1.classList.remove('hidden'); // ✅ Voor het geval die er is
        page1.style.display = ''; // ✅ Wis inline display
        state.currentPage = 1;
        
        if (typeof window.resetPage1State === 'function') {
            window.resetPage1State();
        }
    }
};

/* =========================================================================
   3-SPELERS: UNDO FUNCTIE
   ========================================================================= */
window.undo3PlayerAction = function() {
    if (window.last3pState && window.last3pState.state3p) {
        console.log("↩️ Undo actie uitgevoerd!");
        
        // Herstel de 3-speler state naar de opgeslagen momentopname
        state.friendlyMatch.state3p = JSON.parse(JSON.stringify(window.last3pState.state3p));
        
        // Wis de opgeslagen state (zodat je niet oneindig ver terug kunt gaan, wat bugs voorkomt)
        window.last3pState = null;
        
        // Update het scherm met de herstelde data
        window.update3PlayerUI();
    } else {
        console.log("⚠️ Niets om ongedaan te maken (geen vorige staat gevonden).");
    }
};

/* =========================================================================
   HELPER: BEURTENLIJST RENDEREN VOOR SAMENVATTING (COMPACTE GRID)
   ========================================================================= */
const render3PTurnsListSummary = (turns, highest) => {
    if (!turns || turns.length === 0) {
        return '<div style="text-align:center;color:#7f8c8d;padding:15px;font-size:0.85em;">Nog geen beurten</div>';
    }
    
    const minBeurten = 12;
    const totalToShow = Math.max(minBeurten, turns.length);
    const highestVal = highest || 0;
    
    // ✅ FIX: Flex-wrap zodat blokjes naast elkaar staan en automatisch naar de volgende regel springen
    let html = '<div style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; padding: 5px;">';
    
    for (let i = 1; i <= totalToShow; i++) {
        const isPlayed = i <= turns.length;
        let scoreDisplay = '−';
        let classes = 'turn-row-summary';
        
        if (isPlayed) {
            const score = turns[i - 1];
            if (score === 0) {
                scoreDisplay = '-';
                classes += ' played zero-turn';
            } else {
                scoreDisplay = score;
                classes += ' played';
                if (score === highestVal && highestVal > 0) {
                    classes += ' highest-series';
                }
            }
            if (i === turns.length && score !== highestVal) {
                classes += ' latest-turn';
            }
        } else {
            classes += ' pending';
        }
        
        // ✅ FIX: min-width zodat ze een vaste blokjes-vorm hebben
        html += `<div class="${classes}" style="min-width: 45px; padding: 5px 2px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 0.65rem; opacity: 0.7; text-transform: uppercase; line-height: 1;">B${i}</div>
                    <div style="font-size: 1.1rem; font-weight: 700; line-height: 1.2;">${scoreDisplay}</div>
                 </div>`;
    }
    return html + '</div>';
};

// ==========================================
// 📱 QR CODE VOOR VRIENDSCHAPPELIJKE MATCH
// ==========================================

let qrPollingInterval = null;
let qrSessionId = null;

/**
 * Open de QR code pagina en genereer een QR code
 */
window.openFriendlyQRPage = async function() {
    console.log("📱 Open QR code pagina voor vriendschappelijke match");
    
    // Reset state
    qrSessionId = null;
    if (qrPollingInterval) {
        clearInterval(qrPollingInterval);
        qrPollingInterval = null;
    }
    
    // Toon de pagina
    showPage('pageFriendlyQR');
    
    // Update status
    document.getElementById('qrStatus').innerHTML = '⏳ QR code genereren...';
    document.getElementById('qrCodeDisplay').innerHTML = '<div style="color: #7f8c8d;">⏳ Laden...</div>';
    
    try {
        // 1. Maak nieuwe sessie aan op PythonAnywhere
        const response = await fetch('https://kpbc.pythonanywhere.com/api/friendly-setup/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`Server fout: ${response.status}`);
        }
        
        const data = await response.json();
        qrSessionId = data.session_id;
        
        console.log(`✅ Sessie aangemaakt: ${qrSessionId}`);
        console.log(`⏰ Vervalt op: ${data.expires_at}`);
        
        // 2. Toon session info (debug)
        document.getElementById('qrSessionInfo').innerHTML = `
            Sessie: ${qrSessionId.substring(0, 8)}...<br>
            Geldig tot: ${data.expires_at}
        `;
        
        // 3. Genereer QR code
        console.log('🎯 Stap 3: QR code genereren...');
        const qrUrl = `https://kpbc.pythonanywhere.com/friendly-setup/${qrSessionId}`;
        console.log('📱 QR URL:', qrUrl);
        
        const qrDisplay = document.getElementById('qrCodeDisplay');
        console.log('📦 qrDisplay element:', qrDisplay);
        
        if (!qrDisplay) {
            console.error('❌ qrDisplay element niet gevonden!');
            return;
        }
        
        // Maak een div element voor de QR code
        qrDisplay.innerHTML = '<div id="qrcode"></div>';
        console.log('✅ Div element aangemaakt');
        
        const qrElement = document.getElementById('qrcode');
        console.log('📦 qrElement:', qrElement);
        
        // Genereer QR code met qrcodejs library
        console.log('🔍 QRCode type:', typeof QRCode);
        console.log('🔍 QRCode.CorrectLevel:', QRCode.CorrectLevel);
        
        try {
            new QRCode(qrElement, {
                text: qrUrl,
                width: 280,
                height: 280,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
            console.log('✅ QR code gegenereerd!');
        } catch (error) {
            console.error('❌ Fout bij genereren QR code:', error);
        }
                
        // 4. Update status
        document.getElementById('qrStatus').innerHTML = '📱 Scan de QR code met je GSM';
        
        // 5. Start polling (check elke 2 seconden)
        startQRPolling();
        
    } catch (error) {
        console.error('❌ Fout bij genereren QR code:', error);
        document.getElementById('qrStatus').innerHTML = '❌ Fout bij genereren QR code';
        document.getElementById('qrCodeDisplay').innerHTML = `
            <div style="color: #e74c3c; padding: 20px;">
                <p style="font-size: 1.1rem; margin-bottom: 10px;">❌ Kan geen verbinding maken met de server</p>
                <p style="font-size: 0.9rem; color: #7f8c8d;">Check je internetverbinding en probeer opnieuw</p>
            </div>
        `;
    }
};

/**
 * Start polling om te checken of de match setup compleet is
 */
function startQRPolling() {
    console.log('🔄 Start polling voor match setup...');
    
    qrPollingInterval = setInterval(async () => {
        if (!qrSessionId) return;
        
        try {
            const response = await fetch(`https://kpbc.pythonanywhere.com/api/friendly-setup/status/${qrSessionId}`);
            const data = await response.json();
            
            if (data.status === 'completed') {
                console.log('✅ Match setup compleet!', data);
                
                // Stop polling
                clearInterval(qrPollingInterval);
                qrPollingInterval = null;
                
                // Update status
                document.getElementById('qrStatus').innerHTML = '✅ Match data ontvangen! Starten...';
                
                // Start de match met de ontvangen data
                setTimeout(() => {
                    startMatchFromQRData(data);
                }, 1000);
                
            } else if (data.status === 'expired') {
                console.log('⏰ Sessie verlopen');
                clearInterval(qrPollingInterval);
                qrPollingInterval = null;
                document.getElementById('qrStatus').innerHTML = '⏰ Sessie verlopen. Genereer een nieuwe QR code.';
                
            } else if (data.status === 'waiting') {
                // Nog steeds wachten - update status met animatie
                const dots = '.'.repeat((Math.floor(Date.now() / 500) % 3) + 1);
                document.getElementById('qrStatus').innerHTML = `📱 Wachten op invoer${dots}`;
            }
            
        } catch (error) {
            console.error('❌ Polling fout:', error);
        }
        
    }, 2000); // Elke 2 seconden
}

/**
 * Start de match met de data van de QR code setup
 */
/**
 * Start de match met de data van de QR code setup
 */
function startMatchFromQRData(data) {
    console.log('🚀 Start match met QR data:', data);
    
    // Zet de data om naar het formaat dat de score app verwacht
    state.friendlyMatch = {
        numPlayers: data.num_players,
        gameType: data.game_type,
        players: {},
        teams: data.teams || null,
        orders: data.orders || null,
        whiteBallOwner: parseInt(data.white_ball) // ✅ FIX: Gebruik white_ball van GSM
    };
    
    // Zet spelers om naar het juiste formaat
    data.players.forEach((player, index) => {
        state.friendlyMatch.players[index + 1] = {
            name: player.name,
            target: player.target || 20,
            average: 0,
            isGuest: player.isGuest || false
        };
    });
    
    console.log('✅ Friendly match state gezet:', state.friendlyMatch);
    
    // ✅ FIX: Ga DIRECT naar het scorebord (sla bal selectie over)
    // Omdat de witte bal al gekozen is op de GSM
    if (state.friendlyMatch.numPlayers === 3) {
        // Voor 3 spelers: ga naar 3-speler scorebord
        window.initFriendlyScoring3Player();
        showPage('page14-3player');
    } else {
        // Voor 2 of 4 spelers: ga naar standaard scorebord
        window.initFriendlyScoring();
        showPage('page14');
    }
}
