// Yahtzee / Generala Game Logic & Controller
class YahtzeeGame {
  constructor() {
    this.dice = [0, 0, 0, 0, 0];
    this.held = [false, false, false, false, false];
    this.rollsLeft = 3;
    this.turn = 1;
    this.maxTurns = 13;
    this.gameMode = 'solo'; // 'solo', 'vs-ai', 'pvp'
    this.activePlayer = 0; // 0 = Player 1, 1 = Player 2 or AI
    this.isRolling = false;
    this.aiTimeout = null;

    this.categories = [
      { id: 'ones', name: 'Ases (1)', section: 'upper' },
      { id: 'twos', name: 'Doses (2)', section: 'upper' },
      { id: 'threes', name: 'Treses (3)', section: 'upper' },
      { id: 'fours', name: 'Cuatros (4)', section: 'upper' },
      { id: 'fives', name: 'Cincos (5)', section: 'upper' },
      { id: 'sixes', name: 'Seises (6)', section: 'upper' },
      { id: 'threeKind', name: 'Trío (Mín. 3 iguales)', section: 'lower' },
      { id: 'fourKind', name: 'Póker (Mín. 4 iguales)', section: 'lower' },
      { id: 'fullHouse', name: 'Full House (3 + 2)', section: 'lower' },
      { id: 'smallStraight', name: 'Escalera Menor (4 seguidos)', section: 'lower' },
      { id: 'largeStraight', name: 'Escalera Mayor (5 seguidos)', section: 'lower' },
      { id: 'yahtzee', name: '¡Generala! (5 iguales)', section: 'lower' },
      { id: 'chance', name: 'Chance (Cualquiera)', section: 'lower' }
    ];

    this.scores = [{}, {}]; // [Player1, Player2/AI]
  }

  init() {
    this.resetGame();
    this.renderDiceArea();
    this.renderScorecard();
    this.bindEvents();
  }

  restartGame() {
    if (this.aiTimeout) {
      clearTimeout(this.aiTimeout);
      this.aiTimeout = null;
    }
    this.isRolling = false;
    this.resetGame();
    this.renderDiceArea();
    this.renderScorecard();
    window.soundEngine.playChipClick();
    window.app.showToast('Partida de Generala reiniciada • Dados en 0', 'info');
  }

  resetGame() {
    if (this.aiTimeout) {
      clearTimeout(this.aiTimeout);
      this.aiTimeout = null;
    }
    this.dice = [0, 0, 0, 0, 0];
    this.held = [false, false, false, false, false];
    this.rollsLeft = 3;
    this.turn = 1;
    this.activePlayer = 0;
    this.isRolling = false;
    this.scores = [{}, {}];
    this.updateStatusText();
  }

  setMode(mode) {
    this.gameMode = mode;
    this.restartGame();
  }

  bindEvents() {
    const rollBtn = document.getElementById('yahtzee-roll-btn');
    if (rollBtn) {
      rollBtn.onclick = () => this.roll();
    }
  }

  renderDiceArea() {
    const container = document.getElementById('yahtzee-dice-container');
    if (!container) return;
    let html = '';
    for (let i = 0; i < 5; i++) {
      html += window.diceManager.createDieHTML('yahtzee', i, this.dice[i]);
    }
    container.innerHTML = html;

    // Attach click to hold/unhold
    for (let i = 0; i < 5; i++) {
      const wrapper = document.getElementById(`yahtzee-die-wrapper-${i}`);
      if (wrapper) {
        wrapper.onclick = () => this.toggleHold(i);
      }
    }
    this.updateDiceVisuals();
  }

  toggleHold(index) {
    if (this.rollsLeft === 3 || this.isRolling || this.dice[index] === 0) return; // Cannot hold before first roll or in 0 state
    if (this.gameMode === 'vs-ai' && this.activePlayer === 1) return; // AI turn

    this.held[index] = !this.held[index];
    window.soundEngine.playHoldClick(this.held[index]);
    this.updateDiceVisuals();
  }

  updateDiceVisuals() {
    for (let i = 0; i < 5; i++) {
      const wrapper = document.getElementById(`yahtzee-die-wrapper-${i}`);
      const badge = document.getElementById(`yahtzee-die-badge-${i}`);
      if (wrapper && badge) {
        if (this.held[i]) {
          wrapper.classList.add('held');
          badge.textContent = 'Guardado';
        } else {
          wrapper.classList.remove('held');
          badge.textContent = this.dice[i] === 0 ? 'En Cero (0)' : 'Libre';
        }
      }
    }
  }

  async roll() {
    if (this.rollsLeft <= 0 || this.isRolling) return;

    this.isRolling = true;
    const rollBtn = document.getElementById('yahtzee-roll-btn');
    if (rollBtn) rollBtn.disabled = true;

    window.soundEngine.playDiceRoll(5);

    const rollPromises = [];
    for (let i = 0; i < 5; i++) {
      if (!this.held[i]) {
        const newVal = Math.floor(Math.random() * 6) + 1;
        this.dice[i] = newVal;
        const dieEl = document.getElementById(`yahtzee-die-${i}`);
        if (dieEl) {
          rollPromises.push(window.diceManager.rollDieElement(dieEl, newVal));
        }
      }
    }

    await Promise.all(rollPromises);
    this.rollsLeft--;
    this.isRolling = false;
    this.updateDiceVisuals();
    this.updateStatusText();
    this.renderScorecard();

    if (rollBtn) {
      rollBtn.disabled = this.rollsLeft <= 0;
    }
  }

  updateStatusText() {
    const textEl = document.getElementById('yahtzee-status-text');
    const rollBtn = document.getElementById('yahtzee-roll-btn');
    if (!textEl) return;

    const p1Total = this.calculateTotals(0).grandTotal;
    const p2Total = this.calculateTotals(1).grandTotal;

    let playerLabel = `👤 Tu Turno (${p1Total} pts)`;
    if (this.gameMode === 'pvp') {
      playerLabel = this.activePlayer === 0 ? `👤 Jugador 1 (${p1Total} pts)` : `👥 Jugador 2 (${p2Total} pts)`;
    } else if (this.gameMode === 'vs-ai' && this.activePlayer === 1) {
      playerLabel = `🤖 Turno del Rival IA (${p2Total} pts)`;
    }

    let instruction = '';
    if (this.rollsLeft === 3) {
      instruction = 'Haz clic en <strong>Lanzar Dados</strong> para comenzar';
    } else if (this.rollsLeft === 0) {
      instruction = '<span style="color:var(--gold); font-weight:800;">👉 Elige una fila en la tabla de la derecha para guardar tus puntos</span>';
    } else {
      instruction = `Tiradas: <strong>${this.rollsLeft}</strong>/3 • Puedes volver a tirar o elegir fila para guardar puntos`;
    }

    textEl.innerHTML = `<span>${playerLabel}</span> • Ronda ${this.turn}/${this.maxTurns} • ${instruction}`;

    if (rollBtn) {
      rollBtn.innerHTML = `🎲 Lanzar Dados (${this.rollsLeft})`;
      rollBtn.disabled = this.rollsLeft <= 0 || (this.gameMode === 'vs-ai' && this.activePlayer === 1) || this.isRolling;
    }
  }

  // Scoring engine calculation for Yahtzee
  calculateScore(categoryId, dice) {
    // If any die is 0 or invalid (e.g. before roll), score is 0
    if (!dice || dice.length !== 5 || dice.some(d => d < 1 || d > 6)) {
      return 0;
    }

    const counts = {};
    let sum = 0;
    dice.forEach(d => {
      counts[d] = (counts[d] || 0) + 1;
      sum += d;
    });

    const uniqueSorted = [...new Set(dice)].sort((a, b) => a - b);
    const uniqueStr = uniqueSorted.join('');

    switch (categoryId) {
      case 'ones': return (counts[1] || 0) * 1;
      case 'twos': return (counts[2] || 0) * 2;
      case 'threes': return (counts[3] || 0) * 3;
      case 'fours': return (counts[4] || 0) * 4;
      case 'fives': return (counts[5] || 0) * 5;
      case 'sixes': return (counts[6] || 0) * 6;

      case 'threeKind':
        return Object.values(counts).some(c => c >= 3) ? sum : 0;

      case 'fourKind':
        return Object.values(counts).some(c => c >= 4) ? sum : 0;

      case 'fullHouse': {
        const vals = Object.values(counts);
        return (vals.includes(3) && vals.includes(2)) || vals.includes(5) ? 25 : 0;
      }

      case 'smallStraight': {
        if (uniqueStr.includes('1234') || uniqueStr.includes('2345') || uniqueStr.includes('3456')) return 30;
        return 0;
      }

      case 'largeStraight': {
        if (uniqueStr === '12345' || uniqueStr === '23456') return 40;
        return 0;
      }

      case 'yahtzee':
        return Object.values(counts).some(c => c === 5) ? 50 : 0;

      case 'chance':
        return sum;

      default:
        return 0;
    }
  }

  calculateTotals(playerIdx) {
    const pScores = this.scores[playerIdx] || {};
    let upperSum = 0;
    ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'].forEach(id => {
      if (pScores[id] !== undefined) upperSum += Number(pScores[id]);
    });

    const upperBonus = upperSum >= 63 ? 35 : 0;

    let lowerSum = 0;
    ['threeKind', 'fourKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yahtzee', 'chance'].forEach(id => {
      if (pScores[id] !== undefined) lowerSum += Number(pScores[id]);
    });

    return {
      upperSum,
      upperBonus,
      lowerSum,
      grandTotal: upperSum + upperBonus + lowerSum
    };
  }

  renderScorecard() {
    const container = document.getElementById('yahtzee-score-table-body');
    const headerRow = document.getElementById('yahtzee-table-header');
    if (!container) return;

    const p1Totals = this.calculateTotals(0);
    const p2Totals = this.calculateTotals(1);

    // Update table header based on mode
    if (headerRow) {
      if (this.gameMode === 'solo') {
        headerRow.innerHTML = `
          <th>Categoría</th>
          <th style="color:var(--gold); text-align:right;">👤 Puntos (${p1Totals.grandTotal} pts)</th>
        `;
      } else if (this.gameMode === 'vs-ai') {
        const p1Style = this.activePlayer === 0 ? 'color:var(--gold); font-weight:800;' : 'color:var(--text-secondary);';
        const p2Style = this.activePlayer === 1 ? 'color:var(--gold); font-weight:800;' : 'color:var(--text-secondary);';
        headerRow.innerHTML = `
          <th>Categoría</th>
          <th style="${p1Style} text-align:right;">👤 Tú (${p1Totals.grandTotal})</th>
          <th style="${p2Style} text-align:right;">🤖 Rival IA (${p2Totals.grandTotal})</th>
        `;
      } else {
        const p1Style = this.activePlayer === 0 ? 'color:var(--gold); font-weight:800;' : 'color:var(--text-secondary);';
        const p2Style = this.activePlayer === 1 ? 'color:var(--gold); font-weight:800;' : 'color:var(--text-secondary);';
        headerRow.innerHTML = `
          <th>Categoría</th>
          <th style="${p1Style} text-align:right;">👤 P1 (${p1Totals.grandTotal})</th>
          <th style="${p2Style} text-align:right;">👥 P2 (${p2Totals.grandTotal})</th>
        `;
      }
    }

    let html = '';

    this.categories.forEach(cat => {
      const p1Val = this.scores[0][cat.id];
      const p2Val = this.scores[1][cat.id];
      const isCurrentP1 = this.activePlayer === 0;
      const isCurrentP2 = this.activePlayer === 1;

      // Potential preview score if current player clicks
      const hasRolled = this.rollsLeft < 3 && !this.dice.some(d => d === 0);
      const potential = hasRolled ? this.calculateScore(cat.id, this.dice) : 0;

      const canSelectP1 = isCurrentP1 && hasRolled && p1Val === undefined && !(this.gameMode === 'vs-ai' && this.activePlayer === 1);
      const canSelectP2 = isCurrentP2 && hasRolled && p2Val === undefined && this.gameMode === 'pvp';
      const isSelectable = canSelectP1 || canSelectP2;

      html += `
        <tr class="${isSelectable ? 'selectable-row' : ''}" 
            ${isSelectable ? `onclick="window.yahtzee.selectCategory('${cat.id}')"` : ''}
            style="${isSelectable ? 'cursor:pointer; background:rgba(0, 210, 211, 0.08);' : ''}"
            title="${isSelectable ? `Haz clic para guardar +${potential} pts en ${cat.name}` : ''}">
          <td><strong>${cat.name}</strong></td>
          <td style="text-align:right;">`;

      if (p1Val !== undefined) {
        html += `<span class="score-row-btn filled" style="color:var(--gold); font-size:1.1rem; font-weight:900;">${p1Val}</span>`;
      } else if (canSelectP1) {
        html += `<button class="score-row-btn active-choice" onclick="event.stopPropagation(); window.yahtzee.selectCategory('${cat.id}')">+${potential}</button>`;
      } else {
        html += `<span class="score-row-btn filled" style="color:var(--text-muted)">-</span>`;
      }

      html += `</td>`;

      if (this.gameMode !== 'solo') {
        html += `<td style="text-align:right;">`;
        if (p2Val !== undefined) {
          html += `<span class="score-row-btn filled ai-filled" style="color:var(--text-secondary); font-size:1.1rem; font-weight:800;">${p2Val}</span>`;
        } else if (canSelectP2) {
          html += `<button class="score-row-btn active-choice" onclick="event.stopPropagation(); window.yahtzee.selectCategory('${cat.id}')">+${potential}</button>`;
        } else {
          html += `<span class="score-row-btn filled" style="color:var(--text-muted)">-</span>`;
        }
        html += `</td>`;
      }

      html += `</tr>`;
    });

    // Subtotals, Upper Bonus and Grand Total rows
    html += `
      <tr style="border-top: 2px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.3);">
        <td><strong>Subtotal Superior</strong> (1s al 6s)</td>
        <td style="text-align:right;"><strong>${p1Totals.upperSum} / 63</strong></td>
        ${this.gameMode !== 'solo' ? `<td style="text-align:right;"><strong>${p2Totals.upperSum} / 63</strong></td>` : ''}
      </tr>
      <tr style="background: rgba(0,0,0,0.3);">
        <td><em>Bono Superior (≥63 pts = +35)</em></td>
        <td style="text-align:right; color:${p1Totals.upperBonus > 0 ? 'var(--accent-green)' : 'var(--text-muted)'};">
          <strong>${p1Totals.upperBonus > 0 ? '+35' : '+0'}</strong>
        </td>
        ${this.gameMode !== 'solo' ? `
          <td style="text-align:right; color:${p2Totals.upperBonus > 0 ? 'var(--accent-green)' : 'var(--text-muted)'};">
            <strong>${p2Totals.upperBonus > 0 ? '+35' : '+0'}</strong>
          </td>
        ` : ''}
      </tr>
      <tr style="background: rgba(0,0,0,0.3);">
        <td><strong>Subtotal Inferior</strong> (Combinaciones)</td>
        <td style="text-align:right;"><strong>${p1Totals.lowerSum}</strong></td>
        ${this.gameMode !== 'solo' ? `<td style="text-align:right;"><strong>${p2Totals.lowerSum}</strong></td>` : ''}
      </tr>
      <tr class="score-total-row">
        <td>🏆 TOTAL GENERAL</td>
        <td style="text-align:right; font-size:1.25rem; font-weight:900; color:var(--gold);">${p1Totals.grandTotal} pts</td>
        ${this.gameMode !== 'solo' ? `<td style="text-align:right; font-size:1.25rem; font-weight:900; color:var(--gold);">${p2Totals.grandTotal} pts</td>` : ''}
      </tr>
    `;

    container.innerHTML = html;
  }

  selectCategory(categoryId) {
    if (this.rollsLeft === 3 || this.isRolling) {
      if (this.rollsLeft === 3) {
        window.app.showToast('Primero debes lanzar los dados antes de elegir dónde guardar puntos', 'warning');
      }
      return;
    }

    if (this.scores[this.activePlayer][categoryId] !== undefined) {
      window.app.showToast('Esta categoría ya está guardada en la tabla', 'warning');
      return;
    }

    const score = this.calculateScore(categoryId, this.dice);
    this.scores[this.activePlayer][categoryId] = score;

    const catObj = this.categories.find(c => c.id === categoryId);
    const catName = catObj ? catObj.name : categoryId;

    window.soundEngine.playScoreGain();
    const playerMsg = (this.gameMode === 'vs-ai' && this.activePlayer === 1) ? 'El Rival anotó' : '¡Puntos guardados!';
    window.app.showToast(`${playerMsg} +${score} pts en ${catName}`, 'success');

    // Switch turn or end game
    this.nextTurn();
  }

  nextTurn() {
    this.dice = [0, 0, 0, 0, 0];
    this.held = [false, false, false, false, false];
    this.rollsLeft = 3;

    if (this.gameMode === 'solo') {
      this.turn++;
      if (this.turn > this.maxTurns) {
        this.endGame();
        return;
      }
    } else {
      if (this.activePlayer === 0) {
        this.activePlayer = 1;
      } else {
        this.activePlayer = 0;
        this.turn++;
        if (this.turn > this.maxTurns) {
          this.endGame();
          return;
        }
      }
    }

    this.updateStatusText();
    this.renderDiceArea();
    this.renderScorecard();

    // If next is AI
    if (this.gameMode === 'vs-ai' && this.activePlayer === 1) {
      this.aiTimeout = setTimeout(() => this.playAITurn(), 900);
    }
  }

  // Artificial Intelligence Turn logic
  async playAITurn() {
    window.app.showToast('El Rival IA está pensando su tirada...', 'info');
    await this.roll();

    // AI strategy: evaluate re-roll
    for (let r = 0; r < 2; r++) {
      await new Promise(res => setTimeout(res, 800));

      // Check if we have yahtzee or full house already
      const currentScores = {};
      this.categories.forEach(c => {
        if (this.scores[1][c.id] === undefined) {
          currentScores[c.id] = this.calculateScore(c.id, this.dice);
        }
      });

      if (currentScores.yahtzee === 50 || currentScores.largeStraight === 40) {
        break; // Keep excellent roll!
      }

      // Simple AI hold logic: hold most frequent numbers or straight sequence
      const counts = {};
      this.dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
      let maxNum = 1, maxC = 0;
      for (const [k, v] of Object.entries(counts)) {
        if (v > maxC) { maxC = v; maxNum = Number(k); }
      }

      this.held = this.dice.map(d => (maxC >= 2 && d === maxNum));
      this.updateDiceVisuals();

      if (this.rollsLeft > 0) {
        await this.roll();
      }
    }

    // Pick best available scoring category for AI
    await new Promise(res => setTimeout(res, 800));
    let bestCat = null;
    let highestScore = -1;

    this.categories.forEach(c => {
      if (this.scores[1][c.id] === undefined) {
        const sc = this.calculateScore(c.id, this.dice);
        if (sc > highestScore) {
          highestScore = sc;
          bestCat = c.id;
        }
      }
    });

    // Fallback: pick any open
    if (!bestCat) {
      bestCat = this.categories.find(c => this.scores[1][c.id] === undefined).id;
    }

    this.selectCategory(bestCat);
  }

  endGame() {
    const p1Total = this.calculateTotals(0).grandTotal;
    let msg = `¡Partida finalizada! Puntuación final: <strong>${p1Total} pts</strong>.`;

    if (this.gameMode !== 'solo') {
      const p2Total = this.calculateTotals(1).grandTotal;
      if (p1Total > p2Total) {
        msg = `¡Victoria! Ganaste ${p1Total} a ${p2Total}. 🏆`;
      } else if (p2Total > p1Total) {
        msg = `El Rival ganó ${p2Total} a ${p1Total}. ¡Inténtalo de nuevo!`;
      } else {
        msg = `¡Empate histórico a ${p1Total} puntos!`;
      }
    }

    window.soundEngine.playVictory();
    window.app.triggerConfetti();
    window.app.recordGameStat('yahtzee', p1Total);

    const cloudPrompt = `
      <div style="margin-top:18px; background:rgba(0,0,0,0.4); padding:16px; border-radius:12px; text-align:center;">
        <p style="font-size:0.9rem; color:var(--accent-cyan); font-weight:700; margin-bottom:10px;">
          🌐 ¿Publicar tu puntuación en el Récord Mundial de Supabase?
        </p>
        <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap;">
          <input type="text" id="player-cloud-name" placeholder="Tu Nombre o Apodo" style="background:#0e1724; border:1px solid rgba(255,255,255,0.2); color:#fff; padding:8px 14px; border-radius:8px; font-size:0.9rem; outline:none; max-width:200px;">
          <button class="btn-primary" style="padding:8px 18px; font-size:0.9rem;" onclick="window.app.uploadScoreToCloud('yahtzee', ${p1Total})">Subir Récord 🚀</button>
        </div>
      </div>
    `;

    window.app.showModal('¡Fin de la Partida!', `
      <div style="text-align:center;">
        <p style="font-size:1.2rem; margin-bottom:10px;">${msg}</p>
        ${cloudPrompt}
      </div>
    `);
  }
}

window.yahtzee = new YahtzeeGame();
