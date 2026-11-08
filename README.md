# 🚇 Cyber Subway 3D (Subway Cyber-Rush)

A high-speed, realistic 3D endless runner game inspired by *Subway Surfers*, built directly in the browser using **Three.js** and the **Web Audio API**.

![Cyber Subway 3D](https://img.shields.io/badge/Three.js-r128-38bdf8?style=for-the-badge&logo=three.js)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-f43f5e?style=for-the-badge&logo=html5)
![CSS3 Glassmorphism](https://img.shields.io/badge/CSS3-Glassmorphism-22c55e?style=for-the-badge&logo=css3)

---

## 🎮 Features

- **Realistic 3D Railway Environment**:
  - Procedurally generated ballast gravel bed, wooden ties (sleepers), and brushed metallic rails.
  - Overhead catenary gantries with electrical insulators and functional traffic signals.
  - Highly detailed subway metro trains with illuminated passenger windows and high-beam headlights.
- **Articulated Humanoid Character**:
  - Multi-segment humanoid runner with realistic running gait, knee drive, and counter-swinging arms.
  - Skid/slide animation with trailing rail friction sparks.
  - Jump tuck pose with ground landing dust and spark poofs.
- **Interactive Modern UX/UI**:
  - Glassmorphism HUD with real-time digital speedometer (KM/H).
  - Dynamic **"Close Call!"** detection with bonus points when narrowly dodging oncoming trains.
  - Rising harmonic audio on consecutive coin streaks.
  - Character selection system:
    - **Street Runner**: Agile & balanced.
    - **Cyber Boarder**: Glowing hoverboard with +15% coin magnet range.
    - **Neon Striker**: High-visibility agility suit with +20% jump airtime.
  - Touch-friendly on-screen virtual controls for mobile and tablet players.
- **Synthesized Audio Engine**:
  - Real-time procedural sound effects (jump whooshes, slide sweeps, coin chimes, train close calls, crashes) and synthwave background music generated via Web Audio API. Zero external audio downloads needed.

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` or `←` / `→` | Swipe Left / Right or On-screen Left/Right buttons |
| **Jump** | `W` / `↑` / `Space` | Swipe Up or On-screen Jump button |
| **Slide** | `S` / `↓` | Swipe Down or On-screen Slide button |
| **Pause / Resume** | `P` | Top Pause Button |

---

## 🚀 How to Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/Alanntony669/cyber-subway-3d.git
   cd cyber-subway-3d
   ```

2. Start any local HTTP server:
   ```bash
   # Using Python 3
   python -m http.server 3000

   # Or using Node / npx
   npx serve .
   ```

3. Open your browser at:
   ```
   http://localhost:3000
   ```

---

## 🛠️ Tech Stack

- **Three.js** (WebGL 3D Rendering, Shadows, ACES Filmic Tone Mapping)
- **Web Audio API** (Procedural Synthesizer & SFX)
- **Vanilla JavaScript (ES6+)**
- **Modern CSS3** (Backdrop Blur, Glassmorphism, Animations)
