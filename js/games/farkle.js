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
    this.resetGame();
    this.renderDiceArea();
    this.updateUI();
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
    for (let i = 0; i < 6; i++) {
      const wrapper = document.getElementById(`farkle-die-wrapper-${i}`);
      const badge = document.getElementById(`farkle-die-badge-${i}`);
      if (!wrapper || !badge) continue;

      if (this.diceValues[i] === 0) {
        wrapper.classList.remove('held');
        wrapper.style.opacity = '0.8';
        badge.textContent = 'En Cero (0)';
        badge.style.background = 'rgba(0,0,0,0.6)';
      } else if (!this.diceAvailable[i]) {
        // Locked in from previous roll
        wrapper.classList.add('held');
        wrapper.style.opacity = '0.55';
        badge.textContent = 'Anotado';
        badge.style.background = 'var(--accent-green)';
      } else if (this.selectedThisRoll[i]) {
        // Selected during current roll
        wrapper.classList.add('held');
        wrapper.style.opacity = '1';
        badge.textContent = 'Seleccionado';
        badge.style.background = 'var(--gold)';
      } else {
        wrapper.classList.remove('held');
        wrapper.style.opacity = '1';
        badge.textContent = 'Para Rodar';
        badge.style.background = 'rgba(0,0,0,0.6)';
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
        previewEl.textContent = '+0 pts';
        previewEl.style.color = 'var(--text-secondary)';
      } else if (scoreResult.isValid) {
        previewEl.textContent = `+${scoreResult.score} pts (Válido)`;
        previewEl.style.color = 'var(--accent-green)';
      } else {
        previewEl.textContent = `0 pts (Combinación incompleta / no válida)`;
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

    const canContinue = scoreResult.isValid && scoreResult.score > 0;
    const canBank = totalPotentialTurn > 0 && (scoreResult.isValid || selectedVals.length === 0);

    if (bankBtn) {
      bankBtn.disabled = !canBank;
      bankBtn.innerHTML = `💰 Guardar +${totalPotentialTurn} pts en Banco`;
    }
    if (rollBtn) {
      rollBtn.disabled = !canContinue;
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
      return;
    }

    this.updateUI();
  }

  handleFarkle() {
    this.isRolling = true;
    window.soundEngine.playFarkleBuzzer();
    window.app.showToast('💥 ¡FARKLE! Tirada nula, pierdes los puntos acumulados en esta ronda 💥', 'error');

    const alertBanner = document.getElementById('farkle-alert');
    if (alertBanner) {
      alertBanner.style.display = 'block';
      alertBanner.textContent = '💥 ¡FARKLE! Sin puntos en esta tirada';
      setTimeout(() => alertBanner.style.display = 'none', 2500);
    }

    this.turnBank = 0;
    setTimeout(() => {
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

    if (this.gameMode === 'vs-ai' && this.activePlayer === 1 && !this.isCancelled) {
      this.aiTimeout = setTimeout(() => this.playAITurn(), 900);
    }
  }

  // Farkle AI Bot with intelligent risk management
  async playAITurn() {
    if (this.isCancelled) return;
    window.app.showToast('El Rival IA está lanzando en Farkle...', 'info');
    await this.performRoll();

    while (this.activePlayer === 1 && this.hasRolledThisTurn && !this.isCancelled) {
      await new Promise(r => setTimeout(r, 900));
      if (this.isCancelled) break;

      // AI selects all scoring dice from roll
      const availIndices = [];
      this.diceAvailable.forEach((av, i) => { if (av) availIndices.push(i); });
      const availVals = availIndices.map(i => this.diceValues[i]);

      if (!this.hasAnyScoringPossibility(availVals)) {
        // AI already hit Farkle in performRoll
        break;
      }

      // Automatically select best scoring dice
      availIndices.forEach(idx => {
        const v = this.diceValues[idx];
        if (v === 1 || v === 5) {
          this.selectedThisRoll[idx] = true;
        }
      });

      // Check if 3-of-a-kind
      const counts = {};
      availVals.forEach(v => counts[v] = (counts[v] || 0) + 1);
      Object.keys(counts).forEach(numStr => {
        const n = Number(numStr);
        if (counts[n] >= 3) {
          availIndices.forEach(idx => {
            if (this.diceValues[idx] === n) this.selectedThisRoll[idx] = true;
          });
        }
      });

      this.updateDiceVisuals();
      await new Promise(r => setTimeout(r, 600));
      if (this.isCancelled) break;

      // Commit selection
      this.selectedThisRoll.forEach((sel, i) => {
        if (sel && this.diceAvailable[i]) {
          this.diceAvailable[i] = false;
        }
      });

      // Evaluate score of current selection
      const newlySelected = availIndices.filter(i => this.selectedThisRoll[i]).map(i => this.diceValues[i]);
      const combo = this.calculateComboScore(newlySelected);
      this.turnBank += combo.score;
      this.selectedThisRoll = [false, false, false, false, false, false];

      // If hot dice:
      if (this.diceAvailable.every(av => !av)) {
        this.diceAvailable = [true, true, true, true, true, true];
      }

      this.updateUI();

      // Decision: Risk or Bank?
      const remainingDice = this.diceAvailable.filter(Boolean).length;
      const shouldBank = (this.turnBank >= 450 && remainingDice <= 2) || (this.turnBank >= 750);

      if (shouldBank || (this.totalScores[1] + this.turnBank >= this.targetScore)) {
        await new Promise(r => setTimeout(r, 700));
        if (!this.isCancelled) this.bankScore();
        break;
      } else {
        await new Promise(r => setTimeout(r, 700));
        if (this.isCancelled) break;
        await this.performRoll();
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
      bankBtn.disabled = !isHumanTurn || this.isRolling || this.turnBank === 0;
      bankBtn.innerHTML = `💰 Guardar +${this.turnBank} pts en Banco`;
    }
  }

  endGame() {
    const winnerName = this.activePlayer === 0 ? '¡Tú has ganado!' : (this.gameMode === 'vs-ai' ? '¡El Rival IA ha ganado!' : '¡Jugador 2 ha ganado!');
    window.soundEngine.playVictory();
    window.app.triggerConfetti();
    window.app.recordGameStat('farkle', this.totalScores[0]);
    window.app.showModal('¡Victoria en Farkle!', `
      <div style="text-align:center; padding:15px;">
        <h3 style="color:var(--gold); font-size:1.8rem; margin-bottom:10px;">${winnerName}</h3>
        <p style="font-size:1.1rem; color:var(--text-secondary);">Marcador Final: ${this.totalScores[0]} vs ${this.totalScores[1]} puntos.</p>
      </div>
    `);
  }
}

window.farkle = new FarkleGame();
