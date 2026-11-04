// PWA Installation & Service Worker Manager
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.bindInstallEvents();
    this.checkStandalone();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => {
            console.log('DadoManía PWA Service Worker activo:', reg.scope);
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('Nueva versión de DadoManía descargada en segundo plano.');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('Error registrando Service Worker:', err);
          });
      });
    }
  }

  bindInstallEvents() {
    // Intercept native PWA install prompt (Android / Chrome / Edge)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallUI();
    });

    // Detect successful installation
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.hideInstallUI();
      if (window.app && window.app.showToast) {
        window.app.showToast('🎉 ¡DadoManía instalada con éxito en tu celular!', 'success');
        window.app.triggerConfetti();
      }
    });

    // Always show install buttons on mobile devices if not already running standalone
    if (!this.isStandalone) {
      setTimeout(() => this.showInstallUI(), 1000);
    }
  }

  checkStandalone() {
    if (this.isStandalone) {
      this.hideInstallUI();
    }
  }

  showInstallUI() {
    if (this.isStandalone) return;
    const navBtn = document.getElementById('install-app-btn');
    if (navBtn) navBtn.style.display = 'inline-flex';

    // Show floating banner if user hasn't dismissed it recently
    const dismissedTime = localStorage.getItem('pwa_banner_dismissed');
    const now = Date.now();
    if (!dismissedTime || (now - Number(dismissedTime) > 86400000)) {
      const banner = document.getElementById('pwa-install-banner');
      if (banner && window.innerWidth <= 850) {
        banner.style.display = 'flex';
      }
    }
  }

  hideInstallUI() {
    const navBtn = document.getElementById('install-app-btn');
    if (navBtn) navBtn.style.display = 'none';
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.style.display = 'none';
  }

  dismissBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.style.display = 'none';
    localStorage.setItem('pwa_banner_dismissed', Date.now().toString());
  }

  promptInstall() {
    // 1. If Android / Chrome native prompt is ready
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult && choiceResult.outcome === 'accepted') {
          console.log('Usuario aceptó instalar DadoManía');
        }
        this.deferredPrompt = null;
      });
      return;
    }

    // 2. If on iOS (Safari on iPhone / iPad)
    if (this.isIOS) {
      this.showIOSInstallModal();
      return;
    }

    // 3. Fallback instructions for Android Chrome / PC
    this.showGenericInstallModal();
  }

  showIOSInstallModal() {
    if (!window.app || !window.app.showModal) return;
    window.app.showModal('📲 Instalar en tu iPhone / iPad', `
      <div style="text-align:center; padding:10px;">
        <div style="font-size:3.2rem; margin-bottom:10px;">📱</div>
        <h3 style="color:var(--gold); margin-bottom:14px;">Cómo instalar DadoManía en iOS:</h3>
        <div style="text-align:left; background:rgba(0,0,0,0.35); padding:16px; border-radius:12px; margin-bottom:16px; font-size:0.92rem; line-height:1.7;">
          <p><strong>1.</strong> Toca el botón <strong>Compartir</strong> <span style="font-size:1.25rem;">📤</span> en la barra inferior de Safari.</p>
          <p style="margin-top:8px;"><strong>2.</strong> Desliza hacia abajo en las opciones y selecciona <strong>"Agregar al inicio"</strong> <span style="font-size:1.25rem;">➕</span> (o "Add to Home Screen").</p>
          <p style="margin-top:8px;"><strong>3.</strong> Pulsa <strong>"Agregar"</strong> en la esquina superior derecha.</p>
        </div>
        <div style="background:rgba(46,213,115,0.12); border:1px solid rgba(46,213,115,0.3); border-radius:10px; padding:12px; font-size:0.85rem; color:var(--accent-green); margin-bottom:16px;">
          ✨ ¡Listo! Se creará el icono de DadoManía en tu pantalla de inicio y se abrirá a pantalla completa como una App nativa.
        </div>
        <button class="btn-primary" style="width:100%;" onclick="window.app.closeModal()">¡Entendido!</button>
      </div>
    `);
  }

  showGenericInstallModal() {
    if (!window.app || !window.app.showModal) return;
    window.app.showModal('📲 Instalar DadoManía en tu Celular', `
      <div style="text-align:center; padding:10px;">
        <div style="font-size:3.2rem; margin-bottom:10px;">📱</div>
        <h3 style="color:var(--gold); margin-bottom:12px;">Instala DadoManía con 1 Clic</h3>
        <p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:16px;">
          Disfruta de la app a pantalla completa, con carga ultra rápida y sin barras de navegador:
        </p>
        <div style="text-align:left; background:rgba(0,0,0,0.35); padding:16px; border-radius:12px; margin-bottom:16px; font-size:0.88rem; line-height:1.65;">
          <p>• <strong>En Celular Android (Chrome / Edge / Samsung):</strong> Pulsa el botón de los 3 puntos <strong>⋮</strong> arriba a la derecha en tu navegador y selecciona <em>"Instalar aplicación"</em> o <em>"Agregar a la pantalla principal"</em>.</p>
          <p style="margin-top:10px;">• <strong>En iPhone (Safari):</strong> Toca el botón <strong>Compartir 📤</strong> abajo y selecciona <em>"Agregar a pantalla de inicio ➕"</em>.</p>
          <p style="margin-top:10px;">• <strong>En Computadora:</strong> Haz clic en el icono de instalación <strong>⊕</strong> que aparece en la barra de direcciones de Chrome / Edge.</p>
        </div>
        <button class="btn-primary" style="width:100%;" onclick="window.app.closeModal()">Entendido</button>
      </div>
    `);
  }
}

window.pwaManager = new PWAManager();
