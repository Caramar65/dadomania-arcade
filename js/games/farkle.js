// Farkle (10,000) Game Logic & Controller
class FarkleGame {
  constructor() {
    this.targetScore = 5000; // Fast and fun default, configurable to 10000
    this.totalScores = [0, 0]; // [Player 1, Player 2 / AI]
    this.turnBank = 0;
    this.activePlayer = 0;
    this.gameMode = 'vs-ai'; // 'vs-ai', 'solo', 'pvp'
    this.diceCount = 6;
    this.diceValues = [0, 0, 0, 0, 0, 0];
    this.keptDice = [false, false, false, false, false, false];
    this.diceAvailable = [true, true, true, true, true, true]; // Available to roll
    this.isRolling = false;
    this.hasRolledThisTurn = false;
    this.selectedThisRoll = [false, false, false, false, false, false];
    this.aiTimeout = null;
    this.farkleTimeout = null;
    this.isCancelled = false;
  }

  init() {
    this.resetGame();
    this.renderDiceArea();
    this.updateUI();
    this.bindEvents();
  }

  restartGame() {
    this.isCancelled = true;
    if (this.aiTimeout) {
      clearTimeout(this.aiTimeout);
      this.aiTimeout = null;
    }
    if (this.farkleTimeout) {
      clearTimeout(this.farkleTimeout);
      this.farkleTimeout = null;
    }
    this.resetGame();
    this.renderDiceArea();
    this.updateUI();
    this.updateSelectionScorePreview();
    const alertBanner = document.getElementById('farkle-alert');
    if (alertBanner) alertBanner.style.display = 'none';

    window.soundEngine.playChipClick();
    window.app.showToast('Partida de Farkle reiniciada • Dados en 0', 'info');
  }

  resetGame() {
    this.isCancelled = false;
    if (this.aiTimeout) {
      clearTimeout(this.aiTimeout);
      this.aiTimeout = null;
    }
    if (this.farkleTimeout) {
      clearTimeout(this.farkleTimeout);
      this.farkleTimeout = null;
    }
    this.totalScores = [0, 0];
    this.turnBank = 0;
    this.activePlayer = 0;
    this.isRolling = false;
    this.resetTurnDice();
    this.hasRolledThisTurn = false;
  }

  resetTurnDice() {
    this.diceValues = [0, 0, 0, 0, 0, 0];
    this.keptDice = [false, false, false, false, false, false];
    this.diceAvailable = [true, true, true, true, true, true];
    this.selectedThisRoll = [false, false, false, false, false, false];
  }

  setMode(mode) {
    this.gameMode = mode;
    this.restartGame();
  }

  setTarget(target) {
    this.targetScore = target;
    this.restartGame();
  }

  bindEvents() {
    const rollBtn = document.getElementById('farkle-roll-btn');
    const bankBtn = document.getElementById('farkle-bank-btn');
    if (rollBtn) rollBtn.onclick = () => this.handleRollClick();
    if (bankBtn) bankBtn.onclick = () => this.bankScore();
  }

  renderDiceArea() {
    const container = document.getElementById('farkle-dice-container');
    if (!container) return;
    let html = '';
    for (let i = 0; i < 6; i++) {
      html += window.diceManager.createDieHTML('farkle', i, this.diceValues[i]);
    }
    container.innerHTML = html;

    for (let i = 0; i < 6; i++) {
      const wrapper = document.getElementById(`farkle-die-wrapper-${i}`);
      if (wrapper) {
        wrapper.onclick = () => this.toggleDieSelection(i);
      }
    }
    this.updateDiceVisuals();
  }

  updateDiceVisuals() {
    // Check scoring combinations among currently available dice
    const availVals = [];
    this.diceAvailable.forEach((isAvail, idx) => {
      if (isAvail && this.diceValues[idx] > 0) {
        availVals.push(this.diceValues[idx]);
      }
    });

    const counts = {};
    availVals.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const isStraight = availVals.length === 6 && [1, 2, 3, 4, 5, 6].every(n => counts[n] === 1);
    const isThreePairs = availVals.length === 6 && Object.values(counts).filter(c => c === 2).length === 3;

    for (let i = 0; i < 6; i++) {
      const wrapper = document.getElementById(`farkle-die-wrapper-${i}`);
      const badge = document.getElementById(`farkle-die-badge-${i}`);
      if (!wrapper || !badge) continue;

      const val = this.diceValues[i];

      if (val === 0) {
        wrapper.classList.remove('held');
        wrapper.style.opacity = '0.75';
        badge.textContent = 'En Cero (0)';
        badge.style.background = 'rgba(0,0,0,0.6)';
        badge.style.border = 'none';
        badge.style.color = 'var(--text-secondary)';
      } else if (!this.diceAvailable[i]) {
        // Locked in from a previous roll of this turn
        wrapper.classList.add('held');
        wrapper.style.opacity = '0.55';
        badge.textContent = '🔒 Guardado';
        badge.style.background = 'var(--accent-green)';
        badge.style.border = 'none';
        badge.style.color = '#0b131f';
      } else if (this.selectedThisRoll[i]) {
        // Selected by player on current roll
        wrapper.classList.add('held');
        wrapper.style.opacity = '1';
        badge.textContent = '✓ Apartado';
        badge.style.background = 'var(--gold)';
        badge.style.border = 'none';
        badge.style.color = '#0b131f';
      } else {
        // Available to be selected on this roll
        wrapper.classList.remove('held');
        wrapper.style.opacity = '1';

        let scoreLabel = 'Libre';
        let isScorer = false;

        if (isStraight) {
          scoreLabel = '⭐ Escalera';
          isScorer = true;
        } else if (isThreePairs) {
          scoreLabel = '⭐ Pareja';
          isScorer = true;
        } else if (counts[val] >= 3) {
          scoreLabel = `⭐ Trío ${val}s`;
          isScorer = true;
        } else if (val === 1) {
          scoreLabel = '⭐ +100 pts';
          isScorer = true;
        } else if (val === 5) {
          scoreLabel = '⭐ +50 pts';
          isScorer = true;
        } else {
          scoreLabel = 'Sin puntos';
        }

        badge.textContent = scoreLabel;
        if (isScorer) {
          badge.style.background = 'rgba(245, 176, 65, 0.25)';
          badge.style.border = '1px solid var(--gold)';
          badge.style.color = 'var(--gold)';
        } else {
          badge.style.background = 'rgba(0,0,0,0.6)';
          badge.style.border = '1px solid rgba(255,255,255,0.1)';
          badge.style.color = 'var(--text-secondary)';
        }
      }
    }
  }

  toggleDieSelection(idx) {
    if (this.isRolling || !this.hasRolledThisTurn || !this.diceAvailable[idx] || this.diceValues[idx] === 0) return;
    if (this.gameMode === 'vs-ai' && this.activePlayer === 1) return;

    this.selectedThisRoll[idx] = !this.selectedThisRoll[idx];
    window.soundEngine.playHoldClick(this.selectedThisRoll[idx]);
    this.updateDiceVisuals();
    this.updateSelectionScorePreview();
  }

  autoSelectScoringDice() {
    if (this.isRolling || !this.hasRolledThisTurn) return;
    if (this.gameMode === 'vs-ai' && this.activePlayer === 1) return;

    const availIndices = [];
    const availVals = [];
    this.diceAvailable.forEach((isAvail, idx) => {
      if (isAvail && this.diceValues[idx] > 0) {
        availIndices.push(idx);
        availVals.push(this.diceValues[idx]);
      }
    });

    this.selectScoringDiceLogic(availIndices, availVals);

    const hasSelected = this.selectedThisRoll.some(Boolean);
    if (hasSelected) {
      window.soundEngine.playHoldClick(true);
      window.app.showToast('✨ Se apartaron automáticamente los dados con puntos válidos', 'success');
    } else {
      window.app.showToast('No hay dados con puntos disponibles para apartar', 'info');
    }

    this.updateDiceVisuals();
    this.updateSelectionScorePreview();
  }

  selectScoringDiceLogic(availIndices, availVals) {
    this.selectedThisRoll = [false, false, false, false, false, false];
    const counts = {};
    availVals.forEach(v => counts[v] = (counts[v] || 0) + 1);

    // 1. Check straight 1-6
    if (availVals.length === 6 && [1, 2, 3, 4, 5, 6].every(n => counts[n] === 1)) {
      availIndices.forEach(idx => this.selectedThisRoll[idx] = true);
      return;
    }

    // 2. Check 3 pairs
    if (availVals.length === 6 && Object.values(counts).filter(c => c === 2).length === 3) {
      availIndices.forEach(idx => this.selectedThisRoll[idx] = true);
      return;
    }

    // 3. Select 3-of-a-kind or more
    Object.keys(counts).forEach(numStr => {
      const n = Number(numStr);
      if (counts[n] >= 3) {
        availIndices.forEach(idx => {
          if (this.diceValues[idx] === n) this.selectedThisRoll[idx] = true;
        });
      }
    });

    // 4. Select remaining 1s and 5s
    availIndices.forEach(idx => {
      const v = this.diceValues[idx];
      if (v === 1 || v === 5) {
        this.selectedThisRoll[idx] = true;
      }
    });
  }

  updateSelectionScorePreview() {
    const selectedVals = [];
    this.selectedThisRoll.forEach((sel, i) => {
      if (sel && this.diceAvailable[i] && this.diceValues[i] > 0) {
        selectedVals.push(this.diceValues[i]);
      }
    });

    const scoreResult = this.calculateComboScore(selectedVals);
    const previewEl = document.getElementById('farkle-selection-score');
    if (previewEl) {
      if (selectedVals.length === 0) {
        previewEl.innerHTML = '+0 pts <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:normal; margin-left:8px;">(Haz clic en dados con puntos: ⭐ 1, 5 o tríos)</span>';
        previewEl.style.color = 'var(--text-secondary)';
      } else if (scoreResult.isValid) {
        previewEl.innerHTML = `+${scoreResult.score} pts (Válido) <span style="font-size:0.75rem; color:var(--accent-green); font-weight:normal; margin-left:8px;">✓ ¡Puedes guardar en banco o seguir tirando!</span>`;
        previewEl.style.color = 'var(--accent-green)';
      } else {
        previewEl.innerHTML = `0 pts <span style="font-size:0.78rem; color:var(--accent-red); font-weight:normal; margin-left:8px;">⚠️ Los dados 2, 3, 4 y 6 no suman solos; requieren al menos 3 iguales. Solo el 1 (100 pts) y el 5 (50 pts) dan puntos individuales.</span>`;
        previewEl.style.color = 'var(--accent-red)';
      }
    }

    const currentSelectionScore = scoreResult.isValid ? scoreResult.score : 0;
    const totalPotentialTurn = this.turnBank + currentSelectionScore;

    const turnBankEl = document.getElementById('farkle-turn-bank');
    if (turnBankEl) {
      turnBankEl.textContent = `+${totalPotentialTurn}`;
    }

    const rollBtn = document.getElementById('farkle-roll-btn');
    const bankBtn = document.getElementById('farkle-bank-btn');
    const isHumanTurn = !(this.gameMode === 'vs-ai' && this.activePlayer === 1);

    const canContinue = !this.hasRolledThisTurn || (scoreResult.isValid && scoreResult.score > 0);
    const canBank = totalPotentialTurn > 0 && (scoreResult.isValid || (this.turnBank > 0 && selectedVals.length === 0));

    if (bankBtn) {
      bankBtn.disabled = !canBank || !isHumanTurn || this.isRolling;
      bankBtn.innerHTML = `💰 Guardar +${totalPotentialTurn} pts en Banco`;
    }
    if (rollBtn) {
      rollBtn.disabled = !canContinue || !isHumanTurn || this.isRolling;
      const freeCount = this.diceAvailable.filter(Boolean).length - selectedVals.length;
      if (!this.hasRolledThisTurn) {
        rollBtn.innerHTML = `🎲 Tirar Dados Libres (6)`;
      } else if (canContinue) {
        rollBtn.innerHTML = `🎲 Tirar Dados Libres (${freeCount > 0 ? freeCount : 6})`;
      } else {
        rollBtn.innerHTML = `🎲 Selecciona Puntos para Tirar`;
      }
    }
  }

  // Pure scoring evaluator for Farkle combinations
  calculateComboScore(diceArr) {
    if (!diceArr || diceArr.length === 0 || diceArr.some(d => d < 1 || d > 6)) {
      return { score: 0, isValid: false, scoringCount: 0 };
    }

    const counts = {};
    diceArr.forEach(v => counts[v] = (counts[v] || 0) + 1);

    // Check 1-2-3-4-5-6 straight
    if (diceArr.length === 6 && [1, 2, 3, 4, 5, 6].every(n => counts[n] === 1)) {
      return { score: 1500, isValid: true, scoringCount: 6 };
    }

    // Check 3 pairs
    const pairs = Object.values(counts).filter(c => c === 2);
    if (pairs.length === 3 && diceArr.length === 6) {
      return { score: 1500, isValid: true, scoringCount: 6 };
    }

    let score = 0;
    let scoredDice = 0;

    for (let num = 1; num <= 6; num++) {
      const count = counts[num] || 0;
      if (count === 0) continue;

      if (num === 1) {
        if (count >= 6) {
          score += 4000;
          scoredDice += 6;
        } else if (count === 5) {
          score += 3000;
          scoredDice += 5;
        } else if (count === 4) {
          score += 2000;
          scoredDice += 4;
        } else if (count === 3) {
          score += 1000;
          scoredDice += 3;
        } else {
          score += count * 100;
          scoredDice += count;
        }
      } else {
        if (count >= 6) {
          score += 3000;
          scoredDice += 6;
        } else if (count === 5) {
          score += 2000;
          scoredDice += 5;
        } else if (count === 4) {
          score += 1000;
          scoredDice += 4;
        } else if (count === 3) {
          score += num * 100;
          scoredDice += 3;
        } else if (num === 5) {
          score += count * 50;
          scoredDice += count;
        }
      }
    }

    // All selected dice must contribute to points
    const isValid = (scoredDice === diceArr.length) && (score > 0);
    return { score, isValid, scoringCount: scoredDice };
  }

  // Check if a roll has ANY possible score (if 0 => FARKLE!)
  hasAnyScoringPossibility(diceArr) {
    const counts = {};
    diceArr.forEach(v => counts[v] = (counts[v] || 0) + 1);

    if (diceArr.length === 6 && [1, 2, 3, 4, 5, 6].every(n => counts[n] === 1)) return true;
    if (Object.values(counts).filter(c => c === 2).length === 3) return true;
    if (counts[1] > 0 || counts[5] > 0) return true;
    if (Object.values(counts).some(c => c >= 3)) return true;

    return false;
  }

  async handleRollClick() {
    if (this.isRolling) return;

    // If rolling from an active selection, commit the selection first
    if (this.hasRolledThisTurn) {
      const selectedIndices = [];
      const selectedVals = [];
      this.selectedThisRoll.forEach((sel, i) => {
        if (sel && this.diceAvailable[i]) {
          selectedIndices.push(i);
          selectedVals.push(this.diceValues[i]);
        }
      });

      const combo = this.calculateComboScore(selectedVals);
      if (!combo.isValid || combo.score === 0) {
        window.app.showToast('¡Selecciona dados válidos que sumen puntos antes de volver a tirar!', 'warning');
        return;
      }

      // Valid combo: now commit the dice
      selectedIndices.forEach(i => {
        this.diceAvailable[i] = false;
      });

      this.turnBank += combo.score;
      window.soundEngine.playScoreGain();
      this.selectedThisRoll = [false, false, false, false, false, false];

      // Check Hot Dice: If all 6 dice are locked in, reset all 6 as available!
      if (this.diceAvailable.every(av => !av)) {
        window.app.showToast('🔥 ¡DADOS CALIENTES (HOT DICE)! Tienes los 6 dados libres de nuevo 🔥', 'success');
        this.diceAvailable = [true, true, true, true, true, true];
      }
    }

    await this.performRoll();
  }

  async performRoll() {
    this.isRolling = true;
    const rollBtn = document.getElementById('farkle-roll-btn');
    const bankBtn = document.getElementById('farkle-bank-btn');
    if (rollBtn) rollBtn.disabled = true;
    if (bankBtn) bankBtn.disabled = true;

    const availableCount = this.diceAvailable.filter(Boolean).length;
    window.soundEngine.playDiceRoll(availableCount);

    const rollPromises = [];
    const currentRollValues = [];

    for (let i = 0; i < 6; i++) {
      if (this.diceAvailable[i]) {
        const newVal = Math.floor(Math.random() * 6) + 1;
        this.diceValues[i] = newVal;
        currentRollValues.push(newVal);
        const dieEl = document.getElementById(`farkle-die-${i}`);
        if (dieEl) {
          rollPromises.push(window.diceManager.rollDieElement(dieEl, newVal));
        }
      }
    }

    await Promise.all(rollPromises);
    this.hasRolledThisTurn = true;
    this.isRolling = false;
    this.updateDiceVisuals();

    // Verify Farkle!
    const canScore = this.hasAnyScoringPossibility(currentRollValues);
    if (!canScore) {
      // FARKLE!
      this.handleFarkle();
      return false;
    }

    this.updateUI();
    this.updateSelectionScorePreview();
    return true;
  }

  handleFarkle() {
    this.isRolling = true;
    window.soundEngine.playFarkleBuzzer();

    const isHuman = (this.activePlayer === 0) || (this.gameMode === 'pvp');
    const farkleMsg = isHuman
      ? '💥 ¡FARKLE! Sin combinaciones de puntos. Pierdes los puntos acumulados en esta ronda.'
      : '💥 ¡FARKLE DEL RIVAL! El Rival IA no sacó puntos y termina su turno.';
    window.app.showToast(farkleMsg, 'error');

    const alertBanner = document.getElementById('farkle-alert');
    if (alertBanner) {
      alertBanner.style.display = 'block';
      alertBanner.textContent = isHuman ? '💥 ¡FARKLE! Sin puntos en esta tirada' : '💥 ¡FARKLE DEL RIVAL! Sin puntos';
      setTimeout(() => {
        if (alertBanner) alertBanner.style.display = 'none';
      }, 2500);
    }

    this.turnBank = 0;
    if (this.farkleTimeout) clearTimeout(this.farkleTimeout);
    this.farkleTimeout = setTimeout(() => {
      this.isRolling = false;
      this.endTurn();
    }, 1800);
  }

  bankScore() {
    if (this.isRolling) return;

    // If there are currently selected dice, validate and add them
    const selectedVals = [];
    this.selectedThisRoll.forEach((sel, i) => {
      if (sel && this.diceAvailable[i] && this.diceValues[i] > 0) {
        selectedVals.push(this.diceValues[i]);
      }
    });

    let additional = 0;
    if (selectedVals.length > 0) {
      const combo = this.calculateComboScore(selectedVals);
      if (!combo.isValid) {
        window.app.showToast('Deselecciona los dados que no forman puntos válidos antes de guardar en el banco', 'warning');
        return;
      }
      additional = combo.score;
    }

    const totalToBank = this.turnBank + additional;
    if (totalToBank <= 0) {
      window.app.showToast('No tienes puntos válidos acumulados para guardar en el banco', 'warning');
      return;
    }

    this.totalScores[this.activePlayer] += totalToBank;
    window.soundEngine.playScoreGain();
    const playerName = (this.gameMode === 'vs-ai' && this.activePlayer === 1) ? 'El Rival aseguró' : '¡Aseguraste';
    window.app.showToast(`${playerName} +${totalToBank} puntos! Marcador: ${this.totalScores[this.activePlayer]} pts`, 'success');

    // Check winner
    if (this.totalScores[this.activePlayer] >= this.targetScore) {
      this.endGame();
      return;
    }

    this.endTurn();
  }

  endTurn() {
    this.isRolling = false;
    this.turnBank = 0;
    this.resetTurnDice();
    this.hasRolledThisTurn = false;

    if (this.gameMode === 'solo') {
      // Keep going
    } else {
      this.activePlayer = this.activePlayer === 0 ? 1 : 0;
    }

    this.updateUI();
    this.renderDiceArea();
    this.updateSelectionScorePreview();

    if (this.gameMode === 'vs-ai' && this.activePlayer === 1 && !this.isCancelled) {
      if (this.aiTimeout) clearTimeout(this.aiTimeout);
      this.aiTimeout = setTimeout(() => this.playAITurn(), 900);
    }
  }

  // Farkle AI Bot with intelligent risk management
  async playAITurn() {
    if (this.isCancelled || this.activePlayer !== 1) return;
    window.app.showToast('El Rival IA está lanzando en Farkle...', 'info');

    let rollSuccess = await this.performRoll();
    if (!rollSuccess || this.isCancelled || this.activePlayer !== 1) return;

    while (this.activePlayer === 1 && this.hasRolledThisTurn && !this.isCancelled) {
      await new Promise(r => setTimeout(r, 900));
      if (this.isCancelled || this.activePlayer !== 1) break;

      // AI selects all scoring dice from roll
      const availIndices = [];
      this.diceAvailable.forEach((av, i) => { if (av) availIndices.push(i); });
      const availVals = availIndices.map(i => this.diceValues[i]);

      if (!this.hasAnyScoringPossibility(availVals)) {
        // Handled by performRoll -> handleFarkle
        break;
      }

      // Automatically select best scoring dice
      this.selectScoringDiceLogic(availIndices, availVals);
      this.updateDiceVisuals();
      await new Promise(r => setTimeout(r, 600));
      if (this.isCancelled || this.activePlayer !== 1) break;

      // Commit selection
      const newlySelected = [];
      this.selectedThisRoll.forEach((sel, i) => {
        if (sel && this.diceAvailable[i]) {
          this.diceAvailable[i] = false;
          newlySelected.push(this.diceValues[i]);
        }
      });

      // Evaluate score of current selection
      const combo = this.calculateComboScore(newlySelected);
      if (combo.isValid && combo.score > 0) {
        this.turnBank += combo.score;
        window.soundEngine.playScoreGain();
      }
      this.selectedThisRoll = [false, false, false, false, false, false];

      // If hot dice:
      if (this.diceAvailable.every(av => !av)) {
        window.app.showToast('🔥 ¡DADOS CALIENTES DEL RIVAL! Vuelve a tirar los 6 dados 🔥', 'info');
        this.diceAvailable = [true, true, true, true, true, true];
      }

      this.updateUI();

      // Decision: Risk or Bank?
      const remainingDice = this.diceAvailable.filter(Boolean).length;
      const shouldBank = (this.turnBank >= 450 && remainingDice <= 2) || (this.turnBank >= 750);

      if (shouldBank || (this.totalScores[1] + this.turnBank >= this.targetScore)) {
        await new Promise(r => setTimeout(r, 800));
        if (!this.isCancelled && this.activePlayer === 1) {
          this.bankScore();
        }
        break;
      } else {
        await new Promise(r => setTimeout(r, 800));
        if (this.isCancelled || this.activePlayer !== 1) break;
        rollSuccess = await this.performRoll();
        if (!rollSuccess) break;
      }
    }
  }

  updateUI() {
    const p1ScoreEl = document.getElementById('farkle-p1-score');
    const p2ScoreEl = document.getElementById('farkle-p2-score');
    const p1Card = document.getElementById('farkle-p1-card');
    const p2Card = document.getElementById('farkle-p2-card');
    const turnBankEl = document.getElementById('farkle-turn-bank');
    const statusText = document.getElementById('farkle-status-text');
    const previewEl = document.getElementById('farkle-selection-score');
    const rollBtn = document.getElementById('farkle-roll-btn');
    const bankBtn = document.getElementById('farkle-bank-btn');

    if (p1ScoreEl) p1ScoreEl.textContent = this.totalScores[0];
    if (p2ScoreEl) p2ScoreEl.textContent = this.totalScores[1];

    if (p1Card && p2Card) {
      if (this.activePlayer === 0) {
        p1Card.style.borderColor = 'var(--gold)';
        p1Card.style.boxShadow = '0 0 16px rgba(245, 176, 65, 0.4)';
        p2Card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        p2Card.style.boxShadow = 'none';
      } else {
        p2Card.style.borderColor = 'var(--gold)';
        p2Card.style.boxShadow = '0 0 16px rgba(245, 176, 65, 0.4)';
        p1Card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        p1Card.style.boxShadow = 'none';
      }
    }

    if (p2Card) {
      p2Card.style.display = this.gameMode === 'solo' ? 'none' : 'flex';
      const label = p2Card.querySelector('h4');
      if (label) label.textContent = this.gameMode === 'vs-ai' ? 'Rival IA' : 'Jugador 2';
    }

    if (turnBankEl) turnBankEl.textContent = `+${this.turnBank}`;

    if (previewEl && !this.selectedThisRoll.some(Boolean)) {
      previewEl.textContent = '+0 pts';
      previewEl.style.color = 'var(--text-secondary)';
    }

    if (statusText) {
      let turnName = 'Tu Turno';
      if (this.gameMode === 'pvp') {
        turnName = this.activePlayer === 0 ? 'Jugador 1' : 'Jugador 2';
      } else if (this.gameMode === 'vs-ai' && this.activePlayer === 1) {
        turnName = 'Turno del Rival IA';
      }
      statusText.innerHTML = `<span>${turnName}</span> • Meta: <strong>${this.targetScore}</strong> pts`;
    }

    const isHumanTurn = !(this.gameMode === 'vs-ai' && this.activePlayer === 1);
    if (rollBtn) {
      rollBtn.disabled = !isHumanTurn || this.isRolling;
    }
    if (bankBtn) {
      const hasSelection = this.selectedThisRoll.some(Boolean);
      bankBtn.disabled = !isHumanTurn || this.isRolling || (this.turnBank === 0 && !hasSelection);
      bankBtn.innerHTML = `💰 Guardar +${this.turnBank} pts en Banco`;
    }
  }

  endGame() {
    const winnerName = this.activePlayer === 0 ? '¡Tú has ganado!' : (this.gameMode === 'vs-ai' ? '¡El Rival IA ha ganado!' : '¡Jugador 2 ha ganado!');
    const finalScore = this.totalScores[this.activePlayer];
    window.soundEngine.playVictory();
    window.app.triggerConfetti();
    window.app.recordGameStat('farkle', this.totalScores[0]);

    const cloudPrompt = `
      <div style="margin-top:18px; background:rgba(0,0,0,0.4); padding:16px; border-radius:12px; text-align:center;">
        <p style="font-size:0.9rem; color:var(--accent-cyan); font-weight:700; margin-bottom:10px;">
          🌐 ¿Publicar tu puntuación (${finalScore} pts) en el Récord Mundial de Supabase?
        </p>
        <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap;">
          <input type="text" id="player-cloud-name" placeholder="Tu Nombre o Apodo" style="background:#0e1724; border:1px solid rgba(255,255,255,0.2); color:#fff; padding:8px 14px; border-radius:8px; font-size:0.9rem; outline:none; max-width:200px;">
          <button class="btn-primary" style="padding:8px 18px; font-size:0.9rem;" onclick="window.app.uploadScoreToCloud('farkle', ${finalScore})">Subir Récord 🚀</button>
        </div>
      </div>
    `;

    window.app.showModal('¡Victoria en Farkle!', `
      <div style="text-align:center; padding:15px;">
        <h3 style="color:var(--gold); font-size:1.8rem; margin-bottom:10px;">${winnerName}</h3>
        <p style="font-size:1.1rem; color:var(--text-secondary);">Marcador Final: ${this.totalScores[0]} vs ${this.totalScores[1]} puntos.</p>
        ${cloudPrompt}
      </div>
    `);
  }
}

window.farkle = new FarkleGame();
