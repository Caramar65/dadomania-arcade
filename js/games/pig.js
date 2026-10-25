// Pig (El Cerdo / Duelo de Dados) Game Logic & Controller
class PigGame {
  constructor() {
    this.targetScore = 100;
    this.scores = [0, 0]; // [P1, P2 / AI]
    this.turnScore = 0;
    this.activePlayer = 0;
    this.gameMode = 'vs-ai'; // 'vs-ai' or 'pvp'
    this.diceValue = 0;
    this.isRolling = false;
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
    window.soundEngine.playChipClick();
    window.app.showToast('Partida de Duelo reiniciada • Dado en 0', 'info');
  }

  resetGame() {
    this.isCancelled = false;
    if (this.aiTimeout) {
      clearTimeout(this.aiTimeout);
      this.aiTimeout = null;
    }
    this.scores = [0, 0];
    this.turnScore = 0;
    this.activePlayer = 0;
    this.diceValue = 0;
    this.isRolling = false;
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
    const rollBtn = document.getElementById('pig-roll-btn');
    const holdBtn = document.getElementById('pig-hold-btn');
    if (rollBtn) rollBtn.onclick = () => this.roll();
    if (holdBtn) holdBtn.onclick = () => this.hold();
  }

  renderDiceArea() {
    const container = document.getElementById('pig-dice-container');
    if (!container) return;
    container.innerHTML = window.diceManager.createDieHTML('pig', 0, this.diceValue);
  }

  async roll() {
    if (this.isRolling) return;
    if (this.gameMode === 'vs-ai' && this.activePlayer === 1) return;

    await this.performRoll();
  }

  async performRoll() {
    this.isRolling = true;
    const rollBtn = document.getElementById('pig-roll-btn');
    const holdBtn = document.getElementById('pig-hold-btn');
    if (rollBtn) rollBtn.disabled = true;
    if (holdBtn) holdBtn.disabled = true;

    window.soundEngine.playDiceRoll(1);

    const val = Math.floor(Math.random() * 6) + 1;
    this.diceValue = val;

    const dieEl = document.getElementById('pig-die-0');
    if (dieEl) {
      await window.diceManager.rollDieElement(dieEl, val, 550);
    }

    this.isRolling = false;

    if (val === 1) {
      // Busted on 1!
      window.soundEngine.playFarkleBuzzer();
      window.app.showToast('🐷 ¡Salió un 1! Pierdes los puntos acumulados en esta ronda.', 'error');
      this.turnScore = 0;
      this.updateUI();

      setTimeout(() => {
        this.nextPlayer();
      }, 1200);
      return;
    }

    // Gained points
    this.turnScore += val;
    window.soundEngine.playScoreGain();
    this.updateUI();

    if (rollBtn) rollBtn.disabled = false;
    if (holdBtn) holdBtn.disabled = false;
  }

  hold() {
    if (this.turnScore === 0 || this.isRolling) return;

    const added = this.turnScore;
    this.scores[this.activePlayer] += added;
    window.soundEngine.playScoreGain();
    window.app.showToast(`¡Aseguraste +${added} puntos! Total: ${this.scores[this.activePlayer]} pts`, 'success');

    if (this.scores[this.activePlayer] >= this.targetScore) {
      this.endGame();
      return;
    }

    this.turnScore = 0;
    this.nextPlayer();
  }

  nextPlayer() {
    this.turnScore = 0;
    this.activePlayer = this.activePlayer === 0 ? 1 : 0;
    this.updateUI();

    if (this.gameMode === 'vs-ai' && this.activePlayer === 1 && !this.isCancelled) {
      this.aiTimeout = setTimeout(() => this.playAITurn(), 800);
    }
  }

  // AI strategy for Pig Game
  async playAITurn() {
    if (this.isCancelled) return;
    const rollBtn = document.getElementById('pig-roll-btn');
    const holdBtn = document.getElementById('pig-hold-btn');
    if (rollBtn) rollBtn.disabled = true;
    if (holdBtn) holdBtn.disabled = true;

    window.app.showToast('El Rival IA está tomando su turno...', 'info');

    while (this.activePlayer === 1 && !this.isCancelled) {
      await this.performRoll();
      if (this.isCancelled) break;

      if (this.diceValue === 1) {
        // AI busted, performRoll already scheduled nextPlayer
        break;
      }

      // Check if AI wins right now by holding
      if (this.scores[1] + this.turnScore >= this.targetScore) {
        await new Promise(r => setTimeout(r, 600));
        if (!this.isCancelled) this.hold();
        break;
      }

      // Mathematical Pig Optimal Hold: usually 20 or when catching up
      const p1Lead = this.scores[0] - this.scores[1];
      const riskThreshold = p1Lead > 30 ? 25 : 18;

      if (this.turnScore >= riskThreshold) {
        await new Promise(r => setTimeout(r, 800));
        if (!this.isCancelled) this.hold();
        break;
      }

      await new Promise(r => setTimeout(r, 800));
    }
  }

  updateUI() {
    const p1ScoreEl = document.getElementById('pig-p1-score');
    const p2ScoreEl = document.getElementById('pig-p2-score');
    const p1Card = document.getElementById('pig-p1-card');
    const p2Card = document.getElementById('pig-p2-card');
    const p1Round = document.getElementById('pig-p1-round');
    const p2Round = document.getElementById('pig-p2-round');
    const p1Prog = document.getElementById('pig-p1-progress');
    const p2Prog = document.getElementById('pig-p2-progress');
    const p2Name = document.getElementById('pig-p2-name');

    if (p1ScoreEl) p1ScoreEl.textContent = this.scores[0];
    if (p2ScoreEl) p2ScoreEl.textContent = this.scores[1];

    if (p2Name) {
      p2Name.textContent = this.gameMode === 'vs-ai' ? 'Rival IA 🤖' : 'Jugador 2 👤';
    }

    if (p1Card && p2Card) {
      if (this.activePlayer === 0) {
        p1Card.classList.add('active-turn');
        p2Card.classList.remove('active-turn');
      } else {
        p2Card.classList.add('active-turn');
        p1Card.classList.remove('active-turn');
      }
    }

    if (p1Round && p2Round) {
      const p1Proj = this.scores[0] + (this.activePlayer === 0 ? this.turnScore : 0);
      const p2Proj = this.scores[1] + (this.activePlayer === 1 ? this.turnScore : 0);
      p1Round.innerHTML = this.activePlayer === 0 
        ? `<strong>+${this.turnScore}</strong> en juego <span style="font-size:0.75rem; color:var(--text-secondary);">(Total: ${p1Proj})</span>` 
        : '+0 en juego';
      p2Round.innerHTML = this.activePlayer === 1 
        ? `<strong>+${this.turnScore}</strong> en juego <span style="font-size:0.75rem; color:var(--text-secondary);">(Total: ${p2Proj})</span>` 
        : '+0 en juego';
    }

    if (p1Prog) p1Prog.style.width = `${Math.min(100, (this.scores[0] / this.targetScore) * 100)}%`;
    if (p2Prog) p2Prog.style.width = `${Math.min(100, (this.scores[1] / this.targetScore) * 100)}%`;

    const rollBtn = document.getElementById('pig-roll-btn');
    const holdBtn = document.getElementById('pig-hold-btn');
    const isHumanTurn = !(this.gameMode === 'vs-ai' && this.activePlayer === 1);

    if (rollBtn) rollBtn.disabled = !isHumanTurn || this.isRolling;
    if (holdBtn) {
      holdBtn.disabled = !isHumanTurn || this.turnScore === 0 || this.isRolling;
      holdBtn.innerHTML = `📥 Guardar +${this.turnScore} pts y Pasar`;
    }
  }

  endGame() {
    const winner = this.activePlayer === 0 ? '¡Has ganado la partida de Duelo!' : (this.gameMode === 'vs-ai' ? '¡El Rival IA ha alcanzado la meta!' : '¡Jugador 2 ha ganado!');
    const finalScore = this.scores[this.activePlayer];
    window.soundEngine.playVictory();
    window.app.triggerConfetti();
    window.app.recordGameStat('pig', this.scores[0]);

    const cloudPrompt = `
      <div style="margin-top:18px; background:rgba(0,0,0,0.4); padding:16px; border-radius:12px; text-align:center;">
        <p style="font-size:0.9rem; color:var(--accent-cyan); font-weight:700; margin-bottom:10px;">
          🌐 ¿Publicar tu puntuación (${finalScore} pts) en el Récord Mundial de Supabase?
        </p>
        <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap;">
          <input type="text" id="player-cloud-name" placeholder="Tu Nombre o Apodo" style="background:#0e1724; border:1px solid rgba(255,255,255,0.2); color:#fff; padding:8px 14px; border-radius:8px; font-size:0.9rem; outline:none; max-width:200px;">
          <button class="btn-primary" style="padding:8px 18px; font-size:0.9rem;" onclick="window.app.uploadScoreToCloud('pig', ${finalScore})">Subir Récord 🚀</button>
        </div>
      </div>
    `;

    window.app.showModal('¡Victoria en Duelo de Dados!', `
      <div style="text-align:center; padding:15px;">
        <div style="font-size:3.5rem;">👑</div>
        <h3 style="color:var(--gold); font-size:1.8rem; margin:10px 0;">${winner}</h3>
        <p style="font-size:1.1rem; color:var(--text-secondary);">Marcador: ${this.scores[0]} a ${this.scores[1]} pts (Meta: ${this.targetScore})</p>
        ${cloudPrompt}
      </div>
    `);
  }
}

window.pig = new PigGame();
