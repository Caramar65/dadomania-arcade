// Main Application Controller & Arcade Coordinator
class App {
  constructor() {
    this.currentGame = 'pig';
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

    // Start with default game (Duelo Pig, el más accesible)
    this.switchGame('pig');
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
    this.showRulesModal(this.currentGame || 'pig');
  }

  toggleGuide(gameKey) {
    const box = document.getElementById(`guide-${gameKey}`);
    const toggleBtn = document.getElementById(`guide-toggle-${gameKey}`);
    if (!box) return;
    const isCollapsed = box.classList.toggle('collapsed');
    if (toggleBtn) {
      toggleBtn.innerHTML = isCollapsed ? '<span>Ver Instrucciones</span> ▾' : '<span>Ocultar</span> ▴';
    }
    if (!isCollapsed) {
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  toggleCurrentGameGuide() {
    this.toggleGuide(this.currentGame || 'pig');
  }

  showRulesModal(activeGame = 'pig') {
    const title = '📜 Manual Oficial & Guía de Juegos';
    
    // Navigation Tabs inside modal (ordenados de más fácil a más avanzado)
    let body = `
      <div class="rules-modal-nav">
        <button class="rules-nav-btn ${activeGame === 'pig' ? 'active' : ''}" onclick="window.app.showRulesModal('pig')">
          🐷 Duelo de Dados (Pig)
        </button>
        <button class="rules-nav-btn ${activeGame === 'farkle' ? 'active' : ''}" onclick="window.app.showRulesModal('farkle')">
          🔥 Farkle (10.000)
        </button>
        <button class="rules-nav-btn ${activeGame === 'yahtzee' ? 'active' : ''}" onclick="window.app.showRulesModal('yahtzee')">
          🎲 Generala / Yahtzee
        </button>
        <button class="rules-nav-btn ${activeGame === 'craps' ? 'active' : ''}" onclick="window.app.showRulesModal('craps')">
          🎰 Craps (Casino)
        </button>
      </div>
      <div class="rules-body">
    `;

    if (activeGame === 'yahtzee') {
      body += `
        <div style="background:rgba(0,210,211,0.08); border:1px solid rgba(0,210,211,0.25); border-radius:12px; padding:14px; margin-bottom:16px;">
          <h3 style="color:var(--accent-cyan); margin-bottom:4px;">🎲 Generala (Yahtzee) • El Clásico de Combinaciones</h3>
          <p style="font-size:0.88rem; margin:0;">El objetivo es lograr la puntuación más alta posible rellenando las <strong>13 categorías</strong> de la hoja de puntuación con 5 dados en un máximo de 13 rondas.</p>
        </div>

        <h4>🔄 El Bucle del Turno (Paso a Paso):</h4>
        <div class="guide-steps-grid">
          <div class="guide-step-card">
            <span class="step-badge">Paso 1</span>
            <h5>🎲 Primera Tirada</h5>
            <p>Presiona el botón <strong>Lanzar Dados</strong> para rodar los 5 dados sobre el tapete.</p>
          </div>
          <div class="guide-step-card">
            <span class="step-badge">Paso 2</span>
            <h5>📌 Apartar Dados</h5>
            <p>Haz clic en los dados que te gusten para guardarlos (se pondrán en verde). Los dados libres volverán a girar.</p>
          </div>
          <div class="guide-step-card">
            <span class="step-badge">Paso 3</span>
            <h5>🔄 Hasta 3 Tiradas</h5>
            <p>Puedes volver a tirar los dados libres hasta 2 veces más buscando completar tu jugada deseada.</p>
          </div>
          <div class="guide-step-card">
            <span class="step-badge">Paso 4</span>
            <h5>✍️ Anotar en Tabla</h5>
            <p><strong>Obligatorio:</strong> Haz clic en una casilla vacía de la Hoja de Puntuación para fijar tus puntos y pasar turno.</p>
          </div>
        </div>

        <h4>⭐ Sección Superior (Ases al Seises) y el Bono de +35:</h4>
        <p>En las primeras 6 filas (Ases, Doses, Treses, Cuatros, Cincos, Seises), anotas <strong>la suma de los dados que coincidan con ese número</strong>. Por ejemplo, tres seises (6-6-6) suman 18 puntos en la casilla de Seises.</p>
        
        <div class="guide-callout callout-success">
          <strong>🏆 Bono de la Sección Superior (+35 puntos):</strong><br>
          Si la suma total de las 6 casillas superiores alcanza o supera los <strong>63 puntos</strong>, ¡recibes automáticamente un <strong>Bono extra de +35 puntos</strong>!<br>
          <em>💡 Regla mnemotécnica: Para llegar a 63, necesitas sacar un promedio de tres dados de cada número (3×1 + 3×2 + 3×3 + 3×4 + 3×5 + 3×6 = 63).</em>
        </div>

        <h4>🎯 Sección Inferior (Combinaciones Especiales):</h4>
        <table class="rules-table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Requisito</th>
              <th>Puntos que Otorga</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Trío</strong></td>
              <td>Mínimo 3 dados del mismo valor</td>
              <td>Suma de los 5 dados</td>
            </tr>
            <tr>
              <td><strong>Póker</strong></td>
              <td>Mínimo 4 dados del mismo valor</td>
              <td>Suma de los 5 dados</td>
            </tr>
            <tr>
              <td><strong>Full House</strong></td>
              <td>3 dados de un número + 2 de otro número (ej: 4-4-4-2-2)</td>
              <td><strong>25 puntos fijos</strong></td>
            </tr>
            <tr>
              <td><strong>Escalera Menor</strong></td>
              <td>4 dados consecutivos (1-2-3-4, 2-3-4-5, o 3-4-5-6)</td>
              <td><strong>30 puntos fijos</strong></td>
            </tr>
            <tr>
              <td><strong>Escalera Mayor</strong></td>
              <td>5 dados consecutivos (1-2-3-4-5 o 2-3-4-5-6)</td>
              <td><strong>40 puntos fijos</strong></td>
            </tr>
            <tr>
              <td><strong>¡Generala!</strong></td>
              <td>Los 5 dados con el mismo número (ej: 5-5-5-5-5)</td>
              <td><strong>50 puntos fijos</strong></td>
            </tr>
            <tr>
              <td><strong>Chance</strong></td>
              <td>Cualquier combinación (el comodín de emergencia)</td>
              <td>Suma de los 5 dados</td>
            </tr>
          </tbody>
        </table>

        <h4>❓ Preguntas Frecuentes y Consejos:</h4>
        <div class="rules-faq-item">
          <h5>¿Qué pasa si en mi 3ª tirada no tengo ninguna combinación válida?</h5>
          <p>Debes elegir obligatoriamente una casilla libre en la tabla. Si seleccionas una casilla cuyos requisitos no cumples (por ejemplo, eliges "Generala" sin tener 5 dados iguales), <strong>se anotará con 0 puntos</strong> para tacharla. Tacharla te permite continuar la partida.</p>
        </div>
        <div class="rules-faq-item">
          <h5>¿Cuándo debo usar la casilla de "Chance"?</h5>
          <p>Guarda el "Chance" para una tirada de dados altos (como varios 5 y 6) que no encajen en ninguna otra combinación, logrando 22-26 puntos fáciles.</p>
        </div>
      `;
    } else if (activeGame === 'farkle') {
      body += `
        <div style="background:rgba(245,176,65,0.08); border:1px solid rgba(245,176,65,0.25); border-radius:12px; padding:14px; margin-bottom:16px;">
          <h3 style="color:var(--gold); margin-bottom:4px;">🔥 Farkle (10.000) • Riesgo, Estrategia y Adrenalina</h3>
          <p style="font-size:0.88rem; margin:0;">Lanzas 6 dados en busca de combinaciones puntuables. Tú decides en cada tiro si aseguras tus puntos en el banco o sigues tirando los dados restantes... ¡arriesgándote a perderlo todo si sacas un Farkle!</p>
        </div>

        <h4>🔄 El Bucle del Turno (Paso a Paso):</h4>
        <div class="guide-steps-grid">
          <div class="guide-step-card">
            <span class="step-badge">Paso 1</span>
            <h5>🎲 Lanzar Dados</h5>
            <p>Tiras los dados disponibles (comienzas con los 6 dados completos).</p>
          </div>
          <div class="guide-step-card">
            <span class="step-badge">Paso 2</span>
            <h5>📌 Elegir Dados Válidos</h5>
            <p>Haz clic en los dados que sumen puntos (se pondrán dorados). ¡Debes apartar al menos un dado puntuable en cada tiro!</p>
          </div>
          <div class="guide-step-card">
            <span class="step-badge">Paso 3</span>
            <h5>⚖️ Decisión Clave</h5>
            <p>¿Te plantas? Pulsa <strong>💰 Guardar en Banco</strong>. ¿Quieres más? Pulsa <strong>🎲 Tirar Libres</strong> con los dados que sobraron.</p>
          </div>
          <div class="guide-step-card">
            <span class="step-badge">Paso 4</span>
            <h5>💥 Peligro Farkle</h5>
            <p>Si tiras dados libres y <strong>ninguno puntúa</strong>, cometes un ¡Farkle! y pierdes todos los puntos acumulados en esa ronda.</p>
          </div>
        </div>

        <div class="guide-callout callout-danger" style="margin-top:14px;">
          <strong>⚠️ REGLA DE ORO QUE CONFUNDE A PRINCIPIANTES:</strong><br>
          • <strong>Solo el 1 y el 5 suman puntos por sí solos</strong> (un 1 vale 100 pts y un 5 vale 50 pts).<br>
          • <strong>Los dados 2, 3, 4 y 6 NO puntúan solos</strong>. Un dado 2 solitario vale 0 puntos. Para que un 2, 3, 4 o 6 puntúe, necesitas tener <strong>al menos 3 iguales (un trío)</strong>, una escalera o parejas.
        </div>

        <h4>📊 Tabla Completa de Puntuaciones de Farkle:</h4>
        <table class="rules-table">
          <thead>
            <tr>
              <th>Combinación</th>
              <th>Puntos</th>
              <th>Ejemplo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Cada Dado 1 solitario</strong></td>
              <td><strong>100 pts</strong></td>
              <td>Un dado con cara 1</td>
            </tr>
            <tr>
              <td><strong>Cada Dado 5 solitario</strong></td>
              <td><strong>50 pts</strong></td>
              <td>Un dado con cara 5</td>
            </tr>
            <tr>
              <td><strong>Trío de 1s (Tres Ases)</strong></td>
              <td><strong>1.000 pts</strong></td>
              <td>1 - 1 - 1</td>
            </tr>
            <tr>
              <td><strong>Trío de 6s</strong></td>
              <td><strong>600 pts</strong></td>
              <td>6 - 6 - 6</td>
            </tr>
            <tr>
              <td><strong>Trío de 5s</strong></td>
              <td><strong>500 pts</strong></td>
              <td>5 - 5 - 5</td>
            </tr>
            <tr>
              <td><strong>Trío de 4s</strong></td>
              <td><strong>400 pts</strong></td>
              <td>4 - 4 - 4</td>
            </tr>
            <tr>
              <td><strong>Trío de 3s</strong></td>
              <td><strong>300 pts</strong></td>
              <td>3 - 3 - 3</td>
            </tr>
            <tr>
              <td><strong>Trío de 2s</strong></td>
              <td><strong>200 pts</strong></td>
              <td>2 - 2 - 2</td>
            </tr>
            <tr>
              <td><strong>Cuarteto (4 iguales)</strong></td>
              <td><strong>1.000 pts</strong> (o 2.000 si son Ases)</td>
              <td>4 - 4 - 4 - 4</td>
            </tr>
            <tr>
              <td><strong>Quinteto (5 iguales)</strong></td>
              <td><strong>2.000 pts</strong> (o 3.000 si son Ases)</td>
              <td>6 - 6 - 6 - 6 - 6</td>
            </tr>
            <tr>
              <td><strong>Sexteto (6 iguales)</strong></td>
              <td><strong>3.000 pts</strong> (o 4.000 si son Ases)</td>
              <td>2 - 2 - 2 - 2 - 2 - 2</td>
            </tr>
            <tr>
              <td><strong>Escalera Completa (1 al 6)</strong></td>
              <td><strong>1.500 pts</strong></td>
              <td>1 - 2 - 3 - 4 - 5 - 6</td>
            </tr>
            <tr>
              <td><strong>Tres Parejas</strong></td>
              <td><strong>1.500 pts</strong></td>
              <td>2-2, 4-4, 5-5</td>
            </tr>
          </tbody>
        </table>

        <div class="guide-callout callout-success">
          <strong>🔥 ¡DADOS CALIENTES (HOT DICE)!:</strong><br>
          Si en tu turno consigues apartar <strong>los 6 dados con puntos</strong> (por ejemplo, sacaste una escalera o apartaste dos tríos), ¡no se termina tu turno! Consigues "Dados Calientes", lo que significa que <strong>vuelves a tener los 6 dados disponibles</strong> para seguir tirando y sumando más puntos sobre el acumulado actual.
        </div>

        <h4>❓ Preguntas Frecuentes de Farkle:</h4>
        <div class="rules-faq-item">
          <h5>¿Por qué no puedo apartar un dado 4 que salió en mi tirada?</h5>
          <p>Porque sacaste solo un 4 (o dos 4s). En Farkle, los números 2, 3, 4 y 6 no otorgan ningún punto individualmente. Solo se pueden apartar si tienes 3 o más de ellos en la misma tirada.</p>
        </div>
        <div class="rules-faq-item">
          <h5>¿Cuándo debería pulsar "Guardar en Banco"?</h5>
          <p>Una estrategia prudente es asegurar en banco cuando acumules 500 puntos o más y te queden 2 o menos dados libres. Con 2 dados libres, la probabilidad de sacar un Farkle (ningún 1 ni 5) es de casi el 45%.</p>
        </div>
      `;
    } else if (activeGame === 'craps') {
      body += `
        <div style="background:rgba(46,213,115,0.08); border:1px solid rgba(46,213,115,0.25); border-radius:12px; padding:14px; margin-bottom:16px;">
          <h3 style="color:var(--accent-green); margin-bottom:4px;">🎰 Craps (Pase Inglés) • Casino Sin Secretos</h3>
          <p style="font-size:0.88rem; margin:0;">Craps parece misterioso por sus términos de casino, pero en realidad funciona con <strong>solo dos fases sencillas</strong>: la Salida y el Punto. Aquí te lo explicamos sin rodeos.</p>
        </div>

        <h4>🔄 Las Dos Fases del Juego:</h4>
        <div class="guide-steps-grid">
          <div class="guide-step-card">
            <span class="step-badge" style="color:var(--gold);">Fase 1 (Puck OFF)</span>
            <h5>🟡 Tirada de Salida</h5>
            <p>Se inicia con el disco en <strong>SALIDA (OFF)</strong>. La apuesta principal de la mesa es la <strong>Línea de Pase (Pass Line)</strong>.</p>
          </div>
          <div class="guide-step-card">
            <span class="step-badge" style="color:var(--accent-green);">Fase 2 (Puck ON)</span>
            <h5>🟢 Fase del Punto</h5>
            <p>Si en salida sale 4, 5, 6, 8, 9 o 10, ese número se convierte en <strong>EL PUNTO</strong> y el disco se ilumina en dorado.</p>
          </div>
          <div class="guide-step-card">
            <span class="step-badge" style="color:var(--accent-cyan);">Objetivo</span>
            <h5>🎯 Repetir el Punto</h5>
            <p>Para ganar con Línea de Pase en Fase 2, debes <strong>sacar el Punto otra vez ANTES de que salga un 7</strong>.</p>
          </div>
          <div class="guide-step-card">
            <span class="step-badge" style="color:var(--accent-red);">Peligro</span>
            <h5>💥 Seven Out (7)</h5>
            <p>Si sale un 7 mientras el Punto está activo, ¡Línea de Pase pierde y la mesa vuelve a la Fase de Salida!</p>
          </div>
        </div>

        <h4>🎯 ¿Qué pasa con la Línea de Pase en cada fase?</h4>
        <table class="rules-table">
          <thead>
            <tr>
              <th>Fase Actual</th>
              <th>Suma de los 2 Dados</th>
              <th>Resultado para Línea de Pase</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Fase 1: Salida (OFF)</strong></td>
              <td><strong>7 u 11</strong> (Natural)</td>
              <td><span style="color:var(--accent-green); font-weight:700;">¡GANAS de inmediato!</span> (Paga 1 a 1)</td>
            </tr>
            <tr>
              <td><strong>Fase 1: Salida (OFF)</strong></td>
              <td><strong>2, 3 o 12</strong> (Craps)</td>
              <td><span style="color:var(--accent-red); font-weight:700;">PIERDES de inmediato.</span></td>
            </tr>
            <tr>
              <td><strong>Fase 1: Salida (OFF)</strong></td>
              <td><strong>4, 5, 6, 8, 9 o 10</strong></td>
              <td>Ese número se convierte en <strong>EL PUNTO</strong> (pasa a Fase 2). Tu apuesta permanece en mesa.</td>
            </tr>
            <tr>
              <td><strong>Fase 2: Punto (ON)</strong></td>
              <td><strong>El número del Punto</strong></td>
              <td><span style="color:var(--accent-green); font-weight:700;">¡GANAS!</span> Acertaste el punto antes del 7.</td>
            </tr>
            <tr>
              <td><strong>Fase 2: Punto (ON)</strong></td>
              <td><strong>7</strong> (Seven Out)</td>
              <td><span style="color:var(--accent-red); font-weight:700;">PIERDES.</span> Salió el 7 antes que el punto.</td>
            </tr>
            <tr>
              <td><strong>Fase 2: Punto (ON)</strong></td>
              <td>Cualquier otro número</td>
              <td>No pasa nada con Pase. ¡Vuelves a tirar!</td>
            </tr>
          </tbody>
        </table>

        <h4>⚡ Apuestas Rápidas de Una Sola Tirada (One-Roll):</h4>
        <p>Estas apuestas se resuelven en la <strong>tirada inmediata siguiente</strong>, sin importar si hay Punto activo o no:</p>
        <table class="rules-table">
          <thead>
            <tr>
              <th>Apuesta</th>
              <th>Gana con...</th>
              <th>Pago</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Field (El Campo)</strong></td>
              <td>Suma 2, 3, 4, 9, 10, 11 o 12</td>
              <td>1 a 1 <strong style="color:var(--gold);">(¡2 y 12 pagan el doble 2 a 1!)</strong></td>
            </tr>
            <tr>
              <td><strong>Cualquier 7</strong></td>
              <td>Suma exactamente 7</td>
              <td><strong>4 a 1</strong></td>
            </tr>
            <tr>
              <td><strong>Craps (2, 3 o 12)</strong></td>
              <td>Sale 2, 3 o 12</td>
              <td><strong>7 a 1</strong></td>
            </tr>
            <tr>
              <td><strong>Yo-Eleven (11)</strong></td>
              <td>Suma exactamente 11</td>
              <td><strong>15 a 1</strong></td>
            </tr>
            <tr>
              <td><strong>Don't Pass</strong></td>
              <td>Apuesta inversa al tirador (gana con 2 y 3 en salida, o con 7 antes del punto)</td>
              <td>1 a 1 (12 empata/push)</td>
            </tr>
          </tbody>
        </table>

        <h4>🖱️ Cómo Apostar en la Mesa Virtual:</h4>
        <ul>
          <li><strong>Elegir Ficha:</strong> Haz clic en cualquiera de las fichas de casino ($5, $25, $50, $100, $500) en la barra inferior.</li>
          <li><strong>Poner Apuesta:</strong> Haz <strong>Clic Izquierdo</strong> en cualquier casilla del tapete para colocar la ficha seleccionada.</li>
          <li><strong>Retirar Apuesta:</strong> Haz <strong>Clic Derecho</strong> sobre la casilla para retirar fichas hacia tu saldo.</li>
          <li><strong>Limpiar Mesa:</strong> Usa el botón rojo <em>🧹 Limpiar Apuestas</em> para retirar todas las apuestas activas permitidas.</li>
          <li><strong>¿Te quedaste sin saldo?</strong> Pulsa el botón <em>💵 Pedir $500</em> de cortesía del casino.</li>
        </ul>
      `;
    } else if (activeGame === 'pig') {
      body += `
        <div style="background:rgba(255,71,87,0.08); border:1px solid rgba(255,71,87,0.25); border-radius:12px; padding:14px; margin-bottom:16px;">
          <h3 style="color:var(--accent-red); margin-bottom:4px;">🐷 Duelo de Dados (Pig / El Cerdo)</h3>
          <p style="font-size:0.88rem; margin:0;">El duelo cara a cara más rápido y divertido. Se juega con 1 solo dado por turnos para ver quién llega primero a la meta fijada (50 o 100 puntos).</p>
        </div>

        <h4>🔄 Reglas del Duelo:</h4>
        <div class="guide-steps-grid">
          <div class="guide-step-card">
            <span class="step-badge">Regla 1</span>
            <h5>🎲 Lanza Cuanto Quieras</h5>
            <p>En tu turno, lanza el dado tantas veces como te atrevas. Cada número del 2 al 6 se acumula en tu reserva de la ronda.</p>
          </div>
          <div class="guide-step-card">
            <span class="step-badge">Regla 2</span>
            <h5>📥 Guardar y Pasar</h5>
            <p>Cuando decidas plantarte, pulsa <strong>Guardar y Pasar</strong>. Esos puntos se suman de forma permanente a tu marcador global.</p>
          </div>
          <div class="guide-step-card">
            <span class="step-badge" style="color:var(--accent-red);">Peligro</span>
            <h5>💥 ¡El Temido 1!</h5>
            <p>Si sacas un <strong>1</strong>, pierdes de golpe todos los puntos acumulados en esa ronda y tu turno termina de inmediato.</p>
          </div>
          <div class="guide-step-card">
            <span class="step-badge" style="color:var(--gold);">Victoria</span>
            <h5>🏆 Meta de Puntos</h5>
            <p>El primer jugador (o la IA) en alcanzar la meta (50 o 100 puntos) gana el duelo de inmediato.</p>
          </div>
        </div>

        <div class="guide-callout callout-info">
          <strong>💡 Consejo Estratégico:</strong><br>
          La regla matemática óptima en Pig dice que debes acumular entre <strong>15 y 20 puntos por ronda</strong> antes de guardarlos. Si arriesgas más allá de 20 puntos, la probabilidad acumulada de sacar un 1 supera el 50%.
        </div>
      `;
    }

    body += `</div>`;
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
            <div class="num">${s.pigWins}</div>
            <div class="label">Victorias Duelo (Pig)</div>
          </div>
          <div class="stat-tile">
            <div class="num">${s.farkleHigh}</div>
            <div class="label">Récord Farkle</div>
          </div>
          <div class="stat-tile">
            <div class="num">${s.yahtzeeHigh}</div>
            <div class="label">Récord Generala</div>
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
