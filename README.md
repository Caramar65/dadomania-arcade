# 🎲 DadoManía • Arcade & Casino de Juegos de Dados Interactivo

¡Bienvenido a **DadoManía**! Una suite interactiva completa de juegos de dados en 3D desarrollada con tecnologías web modernas (HTML5, CSS 3D Transforms, Web Audio API y JavaScript Vanilla puro).

---

## 🚀 Cómo Jugar

No requiere instalar nada ni usar Node.js:
1. Haz **doble clic en el archivo [index.html](file:///c:/Users/Crispeta/Downloads/Proyectoss%20de%20antigravity/index.html)** para abrirlo directamente en tu navegador favorito (Chrome, Edge, Firefox, Opera, etc.).
2. ¡Empieza a lanzar y a jugar de inmediato!

---

## 🎮 Modos de Juego Incluidos

### 1. 🎲 Generala / Yahtzee
- **Objetivo:** Lograr la mayor puntuación rellenando las 13 combinaciones de la tabla con 5 dados.
- **Mecánica:** 3 tiradas por turno. Puedes hacer clic en los dados para fijarlos/guardarlos entre tiradas.
- **Combinaciones:** Ases al Seises (con bono de +35 si sumas ≥63), Trío, Póker, Full House, Escalera Menor, Escalera Mayor, Generala (50 pts) y Chance.
- **Modos:** Solitario, Contra Rival IA o 2 Jugadores (Pasa y Juega).

### 2. 🔥 Farkle (10.000)
- **Objetivo:** Llegar primero a 5.000 o 10.000 puntos en este clásico juego de riesgo vs. recompensa.
- **Mecánica:** Lanzas 6 dados. Aparta las combinaciones que suman puntos (1s, 5s, tríos, escaleras, parejas) y decide si guardas tus puntos en el banco o sigues tirando los dados restantes.
- **¡Farkle!:** Si lanzas y ningún dado suma puntos, pierdes todo lo acumulado en la ronda.
- **Hot Dice (Dados Calientes):** Si apartas los 6 dados puntuables, ¡vuelves a disponer de los 6 dados para seguir sumando!

### 3. 🎰 Craps (Pase Inglés de Casino)
- **Objetivo:** Desafía a la banca apostando fichas en el tapete de fieltro de casino.
- **Apuestas disponibles:**
  - **Línea de Pase (Pass Line):** 7 u 11 en salida gana; 2, 3 o 12 pierde. Si sale 4, 5, 6, 8, 9 o 10 se establece el **Punto**, y ganas si vuelve a salir antes del 7.
  - **Don't Pass:** Lo opuesto al tirador.
  - **Field (El Campo):** Apuesta de una tirada (2, 3, 4, 9, 10, 11, 12).
  - **Cualquier 7, Craps (2, 3, 12) y Yo-Eleven (11).**
- **Controles de Apuesta:** Haz clic con el botón izquierdo para apostar fichas ($5, $25, $50, $100, $500) y clic derecho para retirar fichas del tapete.

### 4. 🐷 Duelo de Dados (Pig / El Cerdo)
- **Objetivo:** Duelo relámpago cara a cara para alcanzar 100 puntos antes que tu rival.
- **Mecánica:** Tira el dado tantas veces como te atrevas sumando los números (2 al 6). En cualquier momento puedes plantarte para asegurar los puntos en tu marcador.
- **El Peligro del 1:** Si sale un 1, ¡cometes falta y pierdes todos los puntos acumulados en esa ronda!

---

## ✨ Características Técnicas y Visuales

- **🎲 Dados 3D Hiperrealistas:** Modelados completamente en CSS 3D con perspectiva real, giros dinámicos aleatorios y rebotes sobre el tapete.
- **🎨 Selector de Estilos / Skins:**
  - 🔴 Rojo Casino Translúcido
  - ⚡ Neón Cyberpunk
  - 👑 Oro Metálico de Lujo
  - ⚪ Marfil Clásico
  - ⚫ Obsidiana Negra
- **🔊 Motor de Audio Procedural (Web Audio API):**
  - Sonidos sintetizados en tiempo real para el choque de dados, deslizamiento en tapete, tintineo de fichas, fanfarrias de victoria y alarmas cómicas de fallo.
  - 100% autónomo (no depende de archivos de audio externos que puedan fallar al cargar).
- **🤖 Inteligencia Artificial:** Rivals programados con algoritmos heurísticos para evaluar riesgos y seleccionar combinaciones óptimas.
- **🏆 Récords y Estadísticas:** Guarda automáticamente tus puntuaciones máximas, victorias y banca en `localStorage`.
- **🎊 Sistema de Partículas:** Lluvia de confeti en Canvas en victorias y celebraciones.
- **📜 Reglamento Integrado:** Modal interactivo con reglas detalladas y ejemplos para cada juego.
