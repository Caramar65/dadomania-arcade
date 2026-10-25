// Main Application Controller & Arcade Coordinator
class App {
  constructor() {
    this.currentGame = 'yahtzee';
    this.stats = JSON.parse(localStorage.getItem('dado_stats')) || {
      gamesPlayed: 0,
      yahtzeeHigh: 0,
      farkleHigh: 0,
      pigWins: 0,
      totalRolls: 0
    };
  }

  init() {
    this.setupNavigation();
    this.setupModals();
    this.setupSkinSelector();
    this.setupSoundButton();
    this.setupConfetti();

    // Initialize all 4 games so their dice and DOM are completely ready from start
    if (window.yahtzee) window.yahtzee.init();
    if (window.farkle) window.farkle.init();
    if (window.craps) window.craps.init();
    if (window.pig) window.pig.init();

    // Start with default game
    this.switchGame('yahtzee');
  }

  setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.onclick = () => {
        const gameId = btn.dataset.game;
        this.switchGame(gameId);
      };
    });
  }

  switchGame(gameId) {
    this.currentGame = gameId;

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(b => {
      if (b.dataset.game === gameId) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    // Update views
    document.querySelectorAll('.game-view').forEach(v => {
      v.classList.remove('active');
    });

    const activeView = document.getElementById(`view-${gameId}`);
    if (activeView) activeView.classList.add('active');
  }

  setupSkinSelector() {
    const skinSelect = document.getElementById('skin-selector');
    if (skinSelect) {
      skinSelect.value = window.diceManager.currentSkin;
      skinSelect.onchange = (e) => {
        window.diceManager.setSkin(e.target.value);
        this.showToast(`Estilo de dados: ${e.target.options[e.target.selectedIndex].text}`, 'info');
      };
    }
  }

  setupSoundButton() {
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (!soundBtn) return;

    const updateIcon = () => {
      soundBtn.innerHTML = window.soundEngine.isMuted ? '🔇' : '🔊';
      soundBtn.title = window.soundEngine.isMuted ? 'Activar Sonido' : 'Silenciar';
    };

    updateIcon();
    soundBtn.onclick = () => {
      const isMuted = window.soundEngine.toggleMute();
      updateIcon();
      this.showToast(isMuted ? 'Sonido silenciado' : 'Sonido activado', 'info');
    };
  }

  setupModals() {
    const rulesBtn = document.getElementById('rules-btn');
    const statsBtn = document.getElementById('stats-btn');
    const modalOverlay = document.getElementById('app-modal');
    const modalClose = document.getElementById('modal-close-btn');

    if (rulesBtn) rulesBtn.onclick = () => this.showCurrentGameRules();
    if (statsBtn) statsBtn.onclick = () => this.showStatsModal();
    if (modalClose) modalClose.onclick = () => this.closeModal();

    if (modalOverlay) {
      modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) this.closeModal();
      };
    }
  }

  showModal(title, bodyHTML) {
    const modalOverlay = document.getElementById('app-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');

    if (titleEl) titleEl.innerHTML = title;
    if (bodyEl) bodyEl.innerHTML = bodyHTML;
    if (modalOverlay) modalOverlay.classList.add('open');
  }

  closeModal() {
    const modalOverlay = document.getElementById('app-modal');
    if (modalOverlay) modalOverlay.classList.remove('open');
  }

  showCurrentGameRules() {
    let title = 'Reglas del Juego';
    let body = '';

    switch (this.currentGame) {
      case 'yahtzee':
        title = '📜 Reglas: Generala / Yahtzee';
        body = `
          <div class="rules-body">
            <p>El objetivo es conseguir la mayor cantidad de puntos completando las 13 combinaciones de la tabla con 5 dados.</p>
            <h4>Dinámica del Turno:</h4>
            <ul>
              <li>Tienes hasta <strong>3 tiradas por turno</strong>.</li>
              <li>Haz clic en los dados para <strong>Guardar/Liberar</strong> los que quieras conservar antes del siguiente tiro.</li>
              <li>Tras tirar, selecciona una categoría vacía en la tabla para registrar tu puntuación.</li>
            </ul>
            <h4>Sección Superior (1 al 6):</h4>
            <p>Suma únicamente los dados que coincidan con el número elegido. Si logras 63 o más puntos sumados aquí, ganas un <strong>Bono extra de +35 puntos</strong>.</p>
            <h4>Sección Inferior:</h4>
            <ul>
              <li><strong>Trío (Mín. 3 iguales):</strong> Suma total de los 5 dados.</li>
              <li><strong>Póker (Mín. 4 iguales):</strong> Suma total de los 5 dados.</li>
              <li><strong>Full House (3 de un valor + 2 de otro):</strong> 25 puntos fijos.</li>
              <li><strong>Escalera Menor (4 consecutivos):</strong> 30 puntos fijos.</li>
              <li><strong>Escalera Mayor (5 consecutivos):</strong> 40 puntos fijos.</li>
              <li><strong>¡Generala! (5 dados iguales):</strong> 50 puntos fijos.</li>
              <li><strong>Chance:</strong> Suma de todos los dados sin condición.</li>
            </ul>
          </div>
        `;
        break;

      case 'farkle':
        title = '📜 Reglas: Farkle (10.000)';
        body = `
          <div class="rules-body">
            <p>¡El juego definitivo de riesgo y adrenalina! Lanza 6 dados y acumula puntos eligiendo cuándo plantarte.</p>
            <h4>Combinaciones que dan puntos:</h4>
            <ul>
              <li>Cada <span class="combo-pill">Dado 1</span> = 100 puntos.</li>
              <li>Cada <span class="combo-pill">Dado 5</span> = 50 puntos.</li>
              <li><strong>Tríos (3 iguales):</strong> 1s = 1.000 pts • 2s = 200 • 3s = 300 • 4s = 400 • 5s = 500 • 6s = 600 pts.</li>
              <li><strong>Cuarteto:</strong> 1.000 pts • Quinteto: 2.000 pts • Sexteto: 3.000 pts.</li>
              <li><strong>Escalera completa (1-2-3-4-5-6):</strong> 1.500 pts.</li>
              <li><strong>3 Parejas:</strong> 1.500 pts.</li>
            </ul>
            <h4>Cuidado con el Farkle:</h4>
            <p>Si lanzas y ninguno de los dados restantes forma una combinación con puntos, ¡cometes un <strong>Farkle</strong> y pierdes todos los puntos acumulados en esa ronda!</p>
            <h4>Dados Calientes (Hot Dice):</h4>
            <p>Si logras apartar los 6 dados sumando puntos, ¡vuelves a tener los 6 dados disponibles para seguir tirando con los puntos que ya llevas!</p>
          </div>
        `;
        break;

      case 'craps':
        title = '📜 Reglas: Craps (Pase Inglés)';
        body = `
          <div class="rules-body">
            <p>La clásica y emocionante mesa de dados de casino con apuestas en fichas.</p>
            <h4>Fase 1: Tirada de Salida (Come-out Roll)</h4>
            <ul>
              <li><strong>7 u 11 (Natural):</strong> La Línea de Pase (Pass Line) GANA inmediatamente (paga 1:1).</li>
              <li><strong>2, 3 o 12 (Craps):</strong> La Línea de Pase PIERDE inmediatamente.</li>
              <li><strong>Cualquier otro número (4, 5, 6, 8, 9, 10):</strong> Ese número se convierte en <strong>EL PUNTO</strong>.</li>
            </ul>
            <h4>Fase 2: Fase del Punto</h4>
            <ul>
              <li>El tirador continúa lanzando hasta que vuelva a salir el Punto (Gana Pass Line) o salga un 7 (Seven Out - Pierde Pass Line).</li>
            </ul>
            <h4>Apuestas Especiales de Una Sola Tirada:</h4>
            <ul>
              <li><strong>Field (El Campo):</strong> Gana en 2, 3, 4, 9, 10, 11 o 12. ¡El 2 y el 12 pagan doble!</li>
              <li><strong>Cualquier 7:</strong> Paga 4 a 1 si la suma es exactamente 7.</li>
              <li><strong>Cualquier Craps:</strong> Paga 7 a 1 si sale 2, 3 o 12.</li>
              <li><strong>Yo-Eleven (11):</strong> Paga 15 a 1 si la suma es 11.</li>
            </ul>
          </div>
        `;
        break;

      case 'pig':
        title = '📜 Reglas: Duelo de Dados (Pig / El Cerdo)';
        body = `
          <div class="rules-body">
            <p>Duelo rápido cara a cara entre 2 jugadores (o contra la IA) para ver quién llega primero a la meta (100 puntos).</p>
            <h4>Mecánica:</h4>
            <ul>
              <li>En tu turno, lanza el dado tantas veces como te atrevas.</li>
              <li>Cada número del 2 al 6 se acumula en tu reserva de la ronda.</li>
              <li>Si decides <strong>Guardar (Plantarte)</strong>, los puntos se aseguran en tu marcador total.</li>
              <li><strong>¡Peligro del 1!:</strong> Si sacas un <strong>1</strong>, pierdes inmediatamente todos los puntos que acumulabas en esa ronda y pasa el turno al rival.</li>
            </ul>
          </div>
        `;
        break;
    }

    this.showModal(title, body);
  }

  showStatsModal(activeTab = 'local') {
    const s = this.stats;
    let body = `
      <div style="display:flex; justify-content:center; gap:10px; margin-bottom:18px;">
        <button class="nav-btn ${activeTab === 'local' ? 'active' : ''}" onclick="window.app.showStatsModal('local')">
          🏠 Mis Récords Locales
        </button>
        <button class="nav-btn ${activeTab === 'cloud' ? 'active' : ''}" onclick="window.app.showStatsModal('cloud')">
          🌐 Récords Mundiales (Supabase)
        </button>
      </div>
    `;

    if (activeTab === 'local') {
      body += `
        <div class="stats-grid">
          <div class="stat-tile">
            <div class="num">${s.gamesPlayed}</div>
            <div class="label">Partidas Jugadas</div>
          </div>
          <div class="stat-tile">
            <div class="num">${s.yahtzeeHigh}</div>
            <div class="label">Récord Generala</div>
          </div>
          <div class="stat-tile">
            <div class="num">${s.farkleHigh}</div>
            <div class="label">Récord Farkle</div>
          </div>
          <div class="stat-tile">
            <div class="num">${s.pigWins}</div>
            <div class="label">Victorias Duelo</div>
          </div>
          <div class="stat-tile">
            <div class="num">$${window.craps ? window.craps.bankroll : 1000}</div>
            <div class="label">Banca Casino Craps</div>
          </div>
        </div>
        <div style="text-align:center; margin-top:20px;">
          <button class="btn-secondary" onclick="window.app.resetStats(); window.app.closeModal();">Restablecer Estadísticas Locales</button>
        </div>
      `;
    } else {
      body += `
        <div id="cloud-leaderboard-container">
          <div style="text-align:center; padding:20px; color:var(--text-secondary);">
            Cargando récords mundiales desde Supabase... ⏳
          </div>
        </div>
      `;
    }

    this.showModal('🏆 Estadísticas y Récords', body);

    if (activeTab === 'cloud') {
      this.loadCloudLeaderboard();
    }
  }

  async loadCloudLeaderboard() {
    const container = document.getElementById('cloud-leaderboard-container');
    if (!container) return;

    if (!window.supabaseService) {
      container.innerHTML = '<p style="text-align:center; color:var(--accent-red);">Servicio Supabase no inicializado.</p>';
      return;
    }

    if (!window.supabaseService.key) {
      container.innerHTML = `
        <div style="text-align:center; padding:15px; background:rgba(0,0,0,0.25); border-radius:12px;">
          <h3 style="color:var(--gold); margin-bottom:8px;">☁️ Conectar con Supabase</h3>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:12px;">
            Ingresa tu clave pública <code>anon</code> (la que inicia con <code>eyJ...</code> de Project Settings &gt; API) para sincronizar puntuaciones en la nube:
          </p>
          <input type="password" id="input-supabase-key" placeholder="Pega tu clave anon (eyJ...)" style="width:100%; padding:10px; border-radius:8px; border:1px solid #444; background:#1e1e24; color:#fff; font-size:0.85rem; margin-bottom:12px; box-sizing:border-box;">
          <button class="btn-primary" style="width:100%;" onclick="
            const val = document.getElementById('input-supabase-key').value;
            if (val) {
              window.supabaseService.setAnonKey(val);
              window.app.showToast('¡Clave Supabase configurada!', 'success');
              window.app.showStatsModal('cloud');
            }
          ">💾 Guardar y Conectar</button>
        </div>
      `;
      return;
    }

    const scores = await window.supabaseService.getTopScores(null, 15);
    if (!scores || scores.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:20px;">
          <p style="color:var(--text-secondary); margin-bottom:12px;">Aún no hay puntuaciones registradas en la tabla <code>leaderboard</code> de Supabase.</p>
          <div style="background:rgba(0,0,0,0.3); padding:14px; border-radius:12px; font-size:0.85rem; color:var(--gold);">
            💡 ¡Completa una partida para subir tu récord con tu nombre a Supabase!
          </div>
          <div style="text-align:center; margin-top:14px; font-size:0.75rem; color:var(--text-secondary);">
            Supabase Conectado • <a href=\"#\" style=\"color:var(--gold); text-decoration:underline;\" onclick=\"localStorage.removeItem('dadomania_supabase_anon_key'); window.supabaseService.key = ''; window.app.showStatsModal('cloud'); return false;\">Cambiar clave API</a>
          </div>
        </div>
      `;
      return;
    }

    let listHtml = `
      <table class="score-table" style="margin-top:10px;">
        <thead>
          <tr style="color:var(--gold); font-size:0.85rem;">
            <th>#</th>
            <th>Jugador</th>
            <th>Juego</th>
            <th style="text-align:right;">Puntuación</th>
          </tr>
        </thead>
        <tbody>
    `;

    scores.forEach((row, idx) => {
      let medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
      let gameName = row.game_type === 'yahtzee' ? '🎲 Generala' :
                     row.game_type === 'farkle' ? '🔥 Farkle' :
                     row.game_type === 'craps' ? '🎰 Craps' : '🐷 Duelo';

      listHtml += `
        <tr>
          <td><strong>${medal}</strong></td>
          <td><strong>${row.player_name || 'Anónimo'}</strong></td>
          <td>${gameName}</td>
          <td style="text-align:right; font-weight:800; color:var(--accent-green);">${row.score} pts</td>
        </tr>
      `;
    });

    listHtml += `</tbody></table>`;
    listHtml += `
      <div style="text-align:center; margin-top:14px; font-size:0.75rem; color:var(--text-secondary);">
        Supabase Conectado • <a href="#" style="color:var(--gold); text-decoration:underline;" onclick="localStorage.removeItem('dadomania_supabase_anon_key'); window.supabaseService.key = ''; window.app.showStatsModal('cloud'); return false;">Cambiar clave API</a>
      </div>
    `;
    container.innerHTML = listHtml;
  }

  async uploadScoreToCloud(gameType, score) {
    const input = document.getElementById('player-cloud-name');
    const name = input ? input.value.trim() : 'Jugador';
    const finalName = name || 'Jugador';

    this.showToast('Subiendo récord a Supabase... ☁️', 'info');
    const res = await window.supabaseService.submitScore(finalName, gameType, score);

    if (res.error) {
      this.showToast(`Error al subir a la nube: ${res.error}`, 'error');
    } else {
      this.showToast('🎉 ¡Tu récord fue publicado con éxito en Supabase!', 'success');
      this.showStatsModal('cloud');
    }
  }

  recordGameStat(gameType, score) {
    this.stats.gamesPlayed++;
    if (gameType === 'yahtzee') {
      if (score > this.stats.yahtzeeHigh) this.stats.yahtzeeHigh = score;
    } else if (gameType === 'farkle') {
      if (score > this.stats.farkleHigh) this.stats.farkleHigh = score;
    } else if (gameType === 'pig') {
      this.stats.pigWins++;
    }
    localStorage.setItem('dado_stats', JSON.stringify(this.stats));
  }

  resetStats() {
    this.stats = { gamesPlayed: 0, yahtzeeHigh: 0, farkleHigh: 0, pigWins: 0, totalRolls: 0 };
    localStorage.setItem('dado_stats', JSON.stringify(this.stats));
    this.showToast('Estadísticas restablecidas con éxito', 'info');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '🎉';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '💥';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Pure Canvas Confetti Particle FX
  setupConfetti() {
    this.canvas = document.getElementById('confetti-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];

    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
  }

  triggerConfetti() {
    if (!this.canvas) return;
    const colors = ['#f5b041', '#00d2d3', '#ff4757', '#2ed573', '#9b59b6', '#ffffff'];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: window.innerWidth * (0.3 + Math.random() * 0.4),
        y: window.innerHeight * 0.4,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 4,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        alpha: 1
      });
    }

    if (!this.animatingConfetti) {
      this.animatingConfetti = true;
      this.renderConfetti();
    }
  }

  renderConfetti() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.rotation += p.rotSpeed;
      p.alpha -= 0.008;

      if (p.alpha <= 0 || p.y > this.canvas.height) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.renderConfetti());
    } else {
      this.animatingConfetti = false;
    }
  }
}

window.app = new App();

document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
