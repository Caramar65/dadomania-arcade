// Craps (Pase Inglés de Casino) Game Engine
class CrapsGame {
  constructor() {
    this.bankroll = Number(localStorage.getItem('craps_bankroll')) || 1000;
    this.selectedChip = 25;
    this.activeBets = {}; // { 'passLine': 50, 'field': 25, ... }
    this.point = null; // null = Come-out roll, 4,5,6,8,9,10 = Point established
    this.dice = [0, 0];
    this.isRolling = false;
    this.lastRollSum = 0;
  }

  init() {
    this.renderDiceArea();
    this.renderBetsBoard();
    this.updateBankrollUI();
    this.bindEvents();
  }

  bindEvents() {
    const rollBtn = document.getElementById('craps-roll-btn');
    const clearBtn = document.getElementById('craps-clear-btn');
    if (rollBtn) rollBtn.onclick = () => this.roll();
    if (clearBtn) clearBtn.onclick = () => this.clearAllBets();

    // Chip selectors
    document.querySelectorAll('.poker-chip').forEach(chip => {
      chip.onclick = () => {
        document.querySelectorAll('.poker-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectedChip = Number(chip.dataset.val);
        window.soundEngine.playChipClick();
      };
    });
  }

  renderDiceArea() {
    const container = document.getElementById('craps-dice-container');
    if (!container) return;
    let html = '';
    for (let i = 0; i < 2; i++) {
      html += window.diceManager.createDieHTML('craps', i, this.dice[i]);
    }
    container.innerHTML = html;
  }

  renderBetsBoard() {
    const board = document.getElementById('craps-bets-grid');
    if (!board) return;

    const betOptions = [
      { id: 'passLine', name: 'Línea de Pase', desc: '7 u 11 en salida gana. Punto antes del 7.', pay: '1 a 1' },
      { id: 'dontPass', name: "Don't Pass", desc: '2 o 3 en salida gana. 7 antes del Punto.', pay: '1 a 1' },
      { id: 'field', name: 'Field (El Campo)', desc: 'Gana en 2, 3, 4, 9, 10, 11, 12 (Tirada única)', pay: '1 a 1 (2 y 12 pagan doble)' },
      { id: 'anySeven', name: 'Cualquier 7', desc: 'Gana si la suma es exactamente 7', pay: '4 a 1' },
      { id: 'anyCraps', name: 'Craps (2, 3 o 12)', desc: 'Gana si sale 2, 3 o 12', pay: '7 a 1' },
      { id: 'eleven', name: 'Yo-Eleven (11)', desc: 'Gana si la suma es exactamente 11', pay: '15 a 1' }
    ];

    let html = '';
    betOptions.forEach(opt => {
      const currentBet = this.activeBets[opt.id] || 0;
      html += `
        <div class="bet-slot ${currentBet > 0 ? 'has-bet' : ''}" id="bet-slot-${opt.id}" 
             onclick="window.craps.placeBet('${opt.id}')"
             oncontextmenu="event.preventDefault(); window.craps.removeBet('${opt.id}');"
             title="Clic izquierdo para apostar • Clic derecho para retirar">
          <div class="bet-name">${opt.name}</div>
          <div class="bet-payout">${opt.pay}</div>
          <p style="font-size:0.7rem; color:var(--text-secondary); margin-top:4px;">${opt.desc}</p>
          ${currentBet > 0 ? `<div class="chip-stack">$${currentBet}</div>` : ''}
        </div>
      `;
    });

    board.innerHTML = html;
  }

  removeBet(betId) {
    if (this.isRolling) return;
    if (this.point !== null && (betId === 'passLine' || betId === 'dontPass')) {
      window.app.showToast('No puedes retirar Pase con el Punto activo', 'warning');
      return;
    }
    const current = this.activeBets[betId] || 0;
    if (current > 0) {
      const refund = Math.min(current, this.selectedChip);
      this.activeBets[betId] -= refund;
      this.bankroll += refund;
      if (this.activeBets[betId] <= 0) delete this.activeBets[betId];
      window.soundEngine.playChipClick();
      this.updateBankrollUI();
      this.renderBetsBoard();
    }
  }

  placeBet(betId) {
    if (this.isRolling) return;

    if (this.point !== null && (betId === 'passLine' || betId === 'dontPass')) {
      window.app.showToast('No puedes modificar Pase / No Pase una vez establecido el Punto', 'warning');
      return;
    }

    if (this.bankroll < this.selectedChip) {
      window.app.showToast('¡Fondos insuficientes! Recarga o baja tu apuesta.', 'error');
      return;
    }

    this.bankroll -= this.selectedChip;
    this.activeBets[betId] = (this.activeBets[betId] || 0) + this.selectedChip;
    window.soundEngine.playChipClick();
    this.updateBankrollUI();
    this.renderBetsBoard();
  }

  restartGame() {
    if (this.isRolling) return;
    this.bankroll = 1000;
    localStorage.setItem('craps_bankroll', '1000');
    this.activeBets = {};
    this.point = null;
    this.dice = [0, 0];
    this.lastRollSum = 0;
    this.renderDiceArea();
    this.renderBetsBoard();
    this.updateBankrollUI();
    window.soundEngine.playChipClick();
    window.app.showToast('Mesa de Craps reiniciada • Saldo $1.000 (Dados en 0)', 'info');
  }

  clearAllBets() {
    if (this.isRolling) return;

    const totalBetsCount = Object.keys(this.activeBets).length;
    if (totalBetsCount === 0) {
      window.app.showToast('No hay apuestas colocadas sobre la mesa para retirar', 'info');
      return;
    }

    let refunded = 0;
    let lockedPassLine = false;

    for (const [k, v] of Object.entries(this.activeBets)) {
      if (this.point !== null && (k === 'passLine' || k === 'dontPass')) {
        lockedPassLine = true;
        continue; // Pass line is locked during point
      }
      refunded += v;
      delete this.activeBets[k];
    }

    this.bankroll += refunded;
    this.updateBankrollUI();
    this.renderBetsBoard();
    window.soundEngine.playChipClick();

    if (refunded > 0) {
      window.app.showToast(`Se retiraron $${refunded} de la mesa a tu saldo`, 'success');
    }
    if (lockedPassLine) {
      window.app.showToast(`La Línea de Pase está bloqueada mientras el Punto (${this.point}) siga activo`, 'warning');
    }
  }

  async roll() {
    const totalBet = Object.values(this.activeBets).reduce((a, b) => a + b, 0);
    if (totalBet === 0) {
      window.app.showToast('¡Coloca al menos una apuesta en el tapete para lanzar!', 'warning');
      return;
    }

    this.isRolling = true;
    const rollBtn = document.getElementById('craps-roll-btn');
    if (rollBtn) rollBtn.disabled = true;

    window.soundEngine.playDiceRoll(2);

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    this.dice = [d1, d2];
    const sum = d1 + d2;
    this.lastRollSum = sum;

    const p1 = window.diceManager.rollDieElement(document.getElementById('craps-die-0'), d1);
    const p2 = window.diceManager.rollDieElement(document.getElementById('craps-die-1'), d2);

    await Promise.all([p1, p2]);
    this.isRolling = false;
    if (rollBtn) rollBtn.disabled = false;

    this.resolveRoll(sum);
  }

  resolveRoll(sum) {
    let winnings = 0;
    let messages = [];

    // 1. One-roll bets
    if (this.activeBets.field) {
      const b = this.activeBets.field;
      if ([3, 4, 9, 10, 11].includes(sum)) {
        winnings += b * 2;
        messages.push(`Field ganó +$${b * 2}`);
      } else if (sum === 2 || sum === 12) {
        winnings += b * 3; // Double payout
        messages.push(`¡Field Doble (${sum}) ganó +$${b * 3}!`);
      }
      delete this.activeBets.field;
    }

    if (this.activeBets.anySeven) {
      const b = this.activeBets.anySeven;
      if (sum === 7) {
        winnings += b * 5; // 4 to 1 + return bet
        messages.push(`¡Cualquier 7 acertado! +$${b * 5}`);
      }
      delete this.activeBets.anySeven;
    }

    if (this.activeBets.anyCraps) {
      const b = this.activeBets.anyCraps;
      if ([2, 3, 12].includes(sum)) {
        winnings += b * 8; // 7 to 1 + return bet
        messages.push(`¡Craps (${sum}) acertado! +$${b * 8}`);
      }
      delete this.activeBets.anyCraps;
    }

    if (this.activeBets.eleven) {
      const b = this.activeBets.eleven;
      if (sum === 11) {
        winnings += b * 16;
        messages.push(`¡Yo-Eleven (11)! +$${b * 16}`);
      }
      delete this.activeBets.eleven;
    }

    // 2. Line bets (Pass / Don't Pass)
    if (this.point === null) {
      // Come-out Roll
      if (sum === 7 || sum === 11) {
        // Natural
        if (this.activeBets.passLine) {
          winnings += this.activeBets.passLine * 2;
          messages.push(`¡Natural ${sum}! Línea de Pase gana +$${this.activeBets.passLine * 2}`);
          delete this.activeBets.passLine;
        }
        if (this.activeBets.dontPass) {
          delete this.activeBets.dontPass;
        }
      } else if ([2, 3, 12].includes(sum)) {
        // Craps out
        if (this.activeBets.passLine) {
          delete this.activeBets.passLine;
          messages.push(`Craps ${sum}: Línea de Pase pierde.`);
        }
        if (this.activeBets.dontPass) {
          if (sum === 12) {
            winnings += this.activeBets.dontPass; // Push on 12
            messages.push(`12 Empate (Push) en Don't Pass.`);
          } else {
            winnings += this.activeBets.dontPass * 2;
            messages.push(`Don't Pass gana +$${this.activeBets.dontPass * 2}`);
          }
          delete this.activeBets.dontPass;
        }
      } else {
        // Point is established (4, 5, 6, 8, 9, 10)
        this.point = sum;
        window.app.showToast(`🎯 ¡El Punto es ${sum}!`, 'info');
      }
    } else {
      // Point Phase
      if (sum === this.point) {
        // Winner: hit the point!
        if (this.activeBets.passLine) {
          winnings += this.activeBets.passLine * 2;
          messages.push(`🎯 ¡Acertaste el Punto (${sum})! Pase gana +$${this.activeBets.passLine * 2}`);
          delete this.activeBets.passLine;
        }
        if (this.activeBets.dontPass) {
          delete this.activeBets.dontPass;
        }
        this.point = null; // Reset to come-out
      } else if (sum === 7) {
        // Seven out!
        if (this.activeBets.dontPass) {
          winnings += this.activeBets.dontPass * 2;
          messages.push(`Don't Pass gana +$${this.activeBets.dontPass * 2}`);
          delete this.activeBets.dontPass;
        }
        if (this.activeBets.passLine) {
          messages.push(`Seven Out (7): Línea de Pase pierde.`);
          delete this.activeBets.passLine;
        }
        this.point = null; // Reset to come-out
      }
    }

    if (winnings > 0) {
      this.bankroll += winnings;
      window.soundEngine.playScoreGain();
      window.soundEngine.playChipClick();
      window.app.showToast(`🎉 ¡Ganancia total: +$${winnings}!`, 'success');
    } else if (messages.length > 0) {
      window.app.showToast(messages.join(' • '), 'info');
    }

    this.updateBankrollUI();
    this.renderBetsBoard();

    // Check if broke
    if (this.bankroll <= 0 && Object.keys(this.activeBets).length === 0) {
      window.app.showModal('Banca Agotada', `
        <div style="text-align:center;">
          <p>Te has quedado sin fichas. ¡El casino te regala una recarga de cortesía de $500!</p>
          <button class="btn-primary" style="margin:15px auto;" onclick="window.craps.reloadChips(500); window.app.closeModal();">Aceptar $500</button>
        </div>
      `);
    }
  }

  reloadChips(amount = 500) {
    this.bankroll += amount;
    this.updateBankrollUI();
    window.soundEngine.playChipClick();
    window.app.showToast(`¡Recibiste +$${amount} de cortesía en tu banca!`, 'success');
  }

  updateBankrollUI() {
    localStorage.setItem('craps_bankroll', this.bankroll);
    const bankEl = document.getElementById('craps-bankroll-val');
    const totalBetEl = document.getElementById('craps-total-bet-val');
    const puckEl = document.getElementById('craps-point-puck');
    const rollSumEl = document.getElementById('craps-last-sum');

    if (bankEl) bankEl.textContent = `$${this.bankroll}`;
    const totalBet = Object.values(this.activeBets).reduce((a, b) => a + b, 0);
    if (totalBetEl) totalBetEl.textContent = `$${totalBet}`;

    if (puckEl) {
      if (this.point !== null) {
        puckEl.textContent = `PUNTO: ${this.point}`;
        puckEl.style.background = 'var(--gold)';
        puckEl.style.color = '#000';
      } else {
        puckEl.textContent = 'SALIDA (OFF)';
        puckEl.style.background = 'rgba(255,255,255,0.15)';
        puckEl.style.color = '#fff';
      }
    }

    if (rollSumEl) {
      rollSumEl.textContent = this.lastRollSum ? `Suma: ${this.lastRollSum}` : '';
    }
  }
}

window.craps = new CrapsGame();
