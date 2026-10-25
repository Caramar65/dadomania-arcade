// 3D Dice Renderer & Animator using pure CSS 3D transforms
class DiceManager {
  constructor() {
    this.currentSkin = localStorage.getItem('dado_skin') || 'skin-casino-red';
  }

  setSkin(skinName) {
    this.currentSkin = skinName;
    localStorage.setItem('dado_skin', skinName);
    const skins = ['skin-casino-red', 'skin-neon-cyber', 'skin-gold-luxury', 'skin-ivory', 'skin-obsidian'];
    document.querySelectorAll('.die-3d').forEach(die => {
      skins.forEach(s => die.classList.remove(s));
      die.classList.add(skinName);
    });
  }

  // Generates HTML string for a 6-sided 3D die with unique prefix
  createDieHTML(prefix, index, initialValue = 0) {
    const base = this.getFaceRotations(initialValue);
    const initialTransform = `transform: rotateX(${base.x}deg) rotateY(${base.y}deg);`;
    const badgeText = (Number(initialValue) === 0) ? 'En Cero (0)' : 'Libre';

    return `
      <div class="die-wrapper" id="${prefix}-die-wrapper-${index}" data-prefix="${prefix}" data-index="${index}">
        <div class="die-3d ${this.currentSkin}" id="${prefix}-die-${index}" data-value="${initialValue}" style="${initialTransform}">
          <!-- Face 1 (Front / Zero state) -->
          <div class="die-face face-1">
            <span class="zero-pip">0</span>
            <div class="pip"></div>
          </div>
          <!-- Face 6 (Back) -->
          <div class="die-face face-6">
            <div class="pip"></div><div class="pip"></div>
            <div class="pip"></div><div class="pip"></div>
            <div class="pip"></div><div class="pip"></div>
          </div>
          <!-- Face 2 (Right) -->
          <div class="die-face face-2">
            <div class="pip"></div><div class="pip"></div>
          </div>
          <!-- Face 5 (Left) -->
          <div class="die-face face-5">
            <div class="pip"></div><div class="pip"></div>
            <div class="pip"></div>
            <div class="pip"></div><div class="pip"></div>
          </div>
          <!-- Face 3 (Top) -->
          <div class="die-face face-3">
            <div class="pip"></div><div class="pip"></div><div class="pip"></div>
          </div>
          <!-- Face 4 (Bottom) -->
          <div class="die-face face-4">
            <div class="pip"></div><div class="pip"></div>
            <div class="pip"></div><div class="pip"></div>
          </div>
        </div>
        <span class="die-badge" id="${prefix}-die-badge-${index}">${badgeText}</span>
      </div>
    `;
  }

  // Return base rotation values for each target face to face the viewer
  getFaceRotations(value) {
    switch (Number(value)) {
      case 0: return { x: 0, y: 0 };
      case 1: return { x: 0, y: 0 };
      case 6: return { x: 0, y: 180 };
      case 2: return { x: 0, y: -90 };
      case 5: return { x: 0, y: 90 };
      case 3: return { x: -90, y: 0 };
      case 4: return { x: 90, y: 0 };
      default: return { x: 0, y: 0 };
    }
  }

  // Animate a single die to target value with tumbling
  rollDieElement(dieEl, targetValue, duration = 650) {
    if (!dieEl) return Promise.resolve();

    return new Promise((resolve) => {
      const base = this.getFaceRotations(targetValue);
      // Add random multiple full rotations for tumble effect
      const spinsX = (Math.floor(Math.random() * 3) + 2) * 360;
      const spinsY = (Math.floor(Math.random() * 3) + 2) * 360;
      const randomTilt = (Math.random() - 0.5) * 20;

      dieEl.style.transition = 'none';
      dieEl.style.transform = `rotateX(${Math.random() * 360}deg) rotateY(${Math.random() * 360}deg)`;

      // Force reflow
      void dieEl.offsetHeight;

      dieEl.style.transition = `transform ${duration}ms cubic-bezier(0.18, 0.89, 0.32, 1.15)`;
      dieEl.style.transform = `rotateX(${base.x + spinsX}deg) rotateY(${base.y + spinsY}deg) rotateZ(${randomTilt}deg)`;
      dieEl.dataset.value = targetValue;

      setTimeout(() => {
        // Reset to canonical rotation without extra spins
        dieEl.style.transition = 'none';
        dieEl.style.transform = `rotateX(${base.x}deg) rotateY(${base.y}deg)`;
        resolve();
      }, duration + 30);
    });
  }
}

window.diceManager = new DiceManager();
