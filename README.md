# 🎲 DadoManía • Arcade & Casino de Juegos de Dados Interactivo

¡Bienvenido a **DadoManía**! Una suite interactiva completa de juegos de dados en 3D desarrollada con tecnologías web modernas (HTML5, CSS 3D Transforms, Web Audio API y JavaScript Vanilla puro).

---

## 🚀 Cómo Jugar

No requiere instalar nada ni usar Node.js:
1. Haz **doble clic en el archivo [index.html](file:///c:/Users/Crispeta/Downloads/Proyectoss%20de%20antigravity/index.html)** para abrirlo directamente en tu navegador favorito (Chrome, Edge, Firefox, Opera, etc.).
2. ¡Empieza a lanzar y a jugar de inmediato!

---

## 🎮 Modos de Juego y Guía de Instrucciones Detallada

### 1. 🎲 Generala / Yahtzee
- **Objetivo:** Lograr la mayor puntuación rellenando las 13 combinaciones de la hoja de puntuación con 5 dados en 13 rondas.
- **Bucle de cada Turno (4 Pasos):**
  1. **Tirar Dados:** Presiona *Lanzar Dados* para rodar los 5 dados. Tienes hasta 3 tiradas por turno.
  2. **Apartar Dados:** Haz clic en los dados que quieras conservar para bloquearlos (se ponen en verde con "Guardado").
  3. **Relanzar Libres:** Vuelve a tirar los dados libres hasta 2 veces más buscando armar tu combinación deseada.
  4. **Anotar en la Tabla (Obligatorio):** Haz clic en una fila de la Hoja de Puntuación para registrar tus puntos y pasar el turno. Si al final de tus tiradas no cumples con la combinación requerida, puedes hacer clic en cualquier casilla vacía para **tacharla con 0 puntos** y seguir jugando.
- **Sección Superior (Ases al Seises):** Suma los dados con ese número.
  - 🏆 **Bono Superior (+35 puntos):** Si la suma de las 6 casillas superiores alcanza **63 puntos o más** (ej. tres de cada número: 3×1 + 3×2 + 3×3 + 3×4 + 3×5 + 3×6 = 63), ¡ganas un bono automático de +35 puntos extra!
- **Sección Inferior (Combinaciones Especiales):**
  - **Trío (Mín. 3 iguales):** Suma de los 5 dados.
  - **Póker (Mín. 4 iguales):** Suma de los 5 dados.
  - **Full House (3 de un valor + 2 de otro):** 25 puntos fijos.
  - **Escalera Menor (4 consecutivos, ej: 1-2-3-4):** 30 puntos fijos.
  - **Escalera Mayor (5 consecutivos, ej: 1-2-3-4-5):** 40 puntos fijos.
  - **¡Generala! (5 dados iguales):** 50 puntos fijos.
  - **Chance:** Suma libre de los 5 dados (comodín).

---

### 2. 🔥 Farkle (10.000)
- **Objetivo:** Llegar primero a la meta fijada (5.000 o 10.000 puntos) en este emocionante juego de riesgo y recompensa.
- **Bucle de cada Turno:**
  1. **Lanzar:** Comienzas tirando los 6 dados disponibles.
  2. **Apartar Puntos (Obligatorio):** Haz clic en los dados que sumen puntos (se pondrán dorados). ¡O usa el botón **✨ Apartar Puntos Automático** si dudas!
  3. **Decisión Clave:**
     - 💰 **Guardar en Banco:** Aseguras todos los puntos acumulados en la ronda de forma permanente y pasa el turno (opción segura).
     - 🎲 **Tirar Dados Libres:** Vuelves a tirar los dados que NO apartaste para seguir acumulando más puntos... ¡pero con riesgo de Farkle!
  4. **💥 ¡Farkle!:** Si tiras dados libres y **ninguno puntúa**, cometes un ¡Farkle! y pierdes todos los puntos acumulados en esa ronda.
  5. **🔥 ¡Dados Calientes (Hot Dice)!:** Si logras apartar los 6 dados con puntos, ¡no termina tu turno! Vuelves a disponer de los 6 dados para seguir tirando con los puntos que ya llevas acumulados.
- **⚠️ REGLA DE ORO DE PUNTUACIONES:**
  - **Solo el 1 (100 pts) y el 5 (50 pts) suman solos.**
  - **Los dados 2, 3, 4 y 6 NO puntúan de forma individual.** Requieren al menos un trío (3 o más iguales), una escalera o 3 parejas para puntuar.
- **Tabla de Puntuaciones:**
  - Cada `1` = 100 pts • Cada `5` = 50 pts.
  - Tríos (3 iguales): `1s` = 1.000 pts • `2s` = 200 • `3s` = 300 • `4s` = 400 • `5s` = 500 • `6s` = 600 pts.
  - Cuartetos: 1.000 pts (2.000 si son Ases) • Quintetos: 2.000 pts (3.000 si son Ases) • Sextetos: 3.000 pts (4.000 si son Ases).
  - Escalera Completa (1 al 6): 1.500 pts.
  - Tres Parejas: 1.500 pts.

---

### 3. 🎰 Craps (Pase Inglés de Casino)
- **Objetivo:** Desafía a la banca en la mesa de casino entendiendo sus 2 fases básicas:
- **Las Dos Fases del Juego:**
  - 🟡 **Fase 1: Tirada de Salida (Puck en "SALIDA (OFF)"):**
    - La apuesta reina es **Línea de Pase (Pass Line)**.
    - Saca los 2 dados:
      - Si sale **7 u 11 (Natural)**: ¡Ganas de inmediato (paga 1 a 1)!
      - Si sale **2, 3 o 12 (Craps)**: ¡Pierdes de inmediato!
      - Si sale **4, 5, 6, 8, 9 o 10**: Ese número se convierte en **EL PUNTO** y la mesa pasa a la Fase 2.
  - 🟢 **Fase 2: Fase del Punto (Puck en "PUNTO: X"):**
    - El objetivo del tirador cambia: **Volver a sacar el Punto (X) ANTES de que salga un 7**.
    - Si sale el **Punto (X)**: ¡Ganas tu apuesta de Línea de Pase! La mesa se reinicia a Salida.
    - Si sale un **7 ("Seven Out")**: ¡Pierdes la apuesta de Línea de Pase! La mesa se reinicia a Salida.
    - Si sale cualquier otro número: No pasa nada con Línea de Pase, ¡sigues tirando!
- **⚡ Apuestas Rápidas de Una Sola Tirada (One-Roll):**
  - **Field (El Campo):** Ganas si la suma es 2, 3, 4, 9, 10, 11 o 12. ¡El 2 y el 12 pagan el doble (2 a 1)!
  - **Cualquier 7:** Paga 4 a 1 si la suma exacta es 7.
  - **Craps (2, 3 o 12):** Paga 7 a 1 si la suma es 2, 3 o 12.
  - **Yo-Eleven (11):** Paga 15 a 1 si la suma exacta es 11.
  - **Don't Pass:** Lo opuesto al tirador (gana con 2 y 3 en salida, o con 7 antes del punto; 12 empata).
- **🖱️ Controles de Apuestas:**
  - Selecciona la ficha abajo ($5, $25, $50, $100, $500).
  - **Clic Izquierdo** en cualquier casilla para colocar la ficha elegida.
  - **Clic Derecho** para retirar fichas de la casilla.
  - Botón **🧹 Limpiar Apuestas** para retirar todas las apuestas activas permitidas.
  - Botón **💵 Pedir $500** de cortesía si se agota tu banca.

---

### 4. 🐷 Duelo de Dados (Pig / El Cerdo)
- **Objetivo:** Duelo relámpago cara a cara para alcanzar 50 o 100 puntos antes que tu rival.
- **Mecánica:** En tu turno, lanza el dado tantas veces como te atrevas sumando los números (2 al 6).
- **Asegurar o Arriesgar:** Pulsa *Guardar y Pasar Turno* para asegurar los puntos en tu marcador total.
- **💥 El Peligro del 1:** Si sale un **1**, ¡cometes falta, pierdes todos los puntos acumulados en esa ronda y pasa el turno al rival!

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
- **🏆 Récords y Estadísticas:** Guarda automáticamente tus puntuaciones máximas, victorias y banca en `localStorage` y en la nube con **Supabase Leaderboard**.
- **🎊 Sistema de Partículas:** Lluvia de confeti en Canvas en victorias y celebraciones.
- **📜 Reglamento Integrado:** Modal interactivo con reglas detalladas y ejemplos para cada juego.

---

## ☁️ Integración con Supabase (Récords Mundiales)

Para habilitar la tabla de récords mundiales en tiempo real:

1. Ve a tu proyecto de Supabase en [supabase.com](https://supabase.com/dashboard/project/nejbmejcmztdklgwfelu).
2. Entra en el **SQL Editor** y ejecuta:
```sql
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Leaderboard" ON public.leaderboard FOR SELECT USING (true);
CREATE POLICY "Public Insert Leaderboard" ON public.leaderboard FOR INSERT WITH CHECK (true);
```
3. En el juego, abre **Récords 🏆 > 🌐 Récords Mundiales** e introduce tu clave pública `anon` (la que empieza con `eyJ...` que obtienes en *Project Settings > API*).

---

## ⚡ Despliegue en Vercel

1. Entra a [vercel.com/new](https://vercel.com/new).
2. Selecciona e importa el repositorio `Caramar65/dadomania-arcade`.
3. Haz clic en **Deploy**. ¡Tu juego estará en línea con dominio HTTPS y actualizaciones automáticas en cada push!
