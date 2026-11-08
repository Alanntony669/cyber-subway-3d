// Next-Gen Subway Cyber-Rush 3D Engine
(() => {
    // --- Constants & Config ---
    const LANE_WIDTH = 3.3;
    const LANES = [-LANE_WIDTH, 0, LANE_WIDTH]; // Left, Middle, Right
    const INITIAL_SPEED = 28;
    const MAX_SPEED = 70;
    const SPEED_INCREMENT = 0.5; // per second
    const GRAVITY = -44;
    const SLIDE_DURATION = 0.72; // seconds
    const CHUNK_LENGTH = 70;
    const VISIBLE_CHUNKS = 5;

    // --- State ---
    let isPlaying = false;
    let isPaused = false;
    let score = 0;
    let distanceTraveled = 0;
    let coins = 0;
    let highScore = parseInt(localStorage.getItem('cyber_subway_high') || '0', 10);
    let currentSpeed = INITIAL_SPEED;

    // Rider selection
    let selectedCharacter = 'runner'; // 'runner', 'boarder', 'striker'

    // Lane & Physics
    let currentLane = 1; // Middle
    let targetX = 0;
    let playerY = 0;
    let playerVy = 0;
    let isJumping = false;
    let isSliding = false;
    let slideTimer = 0;
    let jumpForce = 15.5;

    // Active Powerups
    let activePowerup = null; // 'magnet', 'shield', '2x'
    let powerupTimeLeft = 0;
    const POWERUP_DURATION = 9.0;

    // Streaks & Close Calls
    let lastObstaclePassedZ = 0;
    let streakCount = 0;

    // Three.js Core
    let scene, camera, renderer;
    let playerGroup, playerTorso, playerHead, legL_upper, legL_lower, legR_upper, legR_lower;
    let armL_upper, armL_lower, armR_upper, armR_lower, hoverboardMesh, shieldSphere;
    let clock = new THREE.Clock();

    // Particle Systems
    let speedParticles, sparkParticles, dustParticles;
    let sparkGeo, sparkPositions, sparkVelocities;
    const MAX_SPARKS = 120;

    // Procedural Chunks & Objects
    const trackChunks = [];
    const activeObstacles = [];
    const activeCoins = [];
    const activePowerupItems = [];
    let nextChunkZ = 0;

    // Procedural Textures
    let ballastTexture, railTexture, trainTexture, hazardTexture;

    // Camera shake & FOV
    let shakeIntensity = 0;
    const BASE_FOV = 64;

    // DOM Elements
    const scoreValEl = document.getElementById('score-val');
    const highScoreValEl = document.getElementById('high-score-val');
    const coinValEl = document.getElementById('coin-val');
    const speedIndicatorEl = document.getElementById('speed-indicator');
    const comboBadgeEl = document.getElementById('combo-badge');
    const floatingTextContainer = document.getElementById('floating-text-container');
    const startScreen = document.getElementById('start-screen');
    const pauseScreen = document.getElementById('pause-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreEl = document.getElementById('final-score');
    const finalCoinsEl = document.getElementById('final-coins');
    const finalDistEl = document.getElementById('final-dist');
    const newRecordBanner = document.getElementById('new-record-banner');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const pauseRestartBtn = document.getElementById('pause-restart-btn');
    const muteBtn = document.getElementById('mute-btn');
    const soundIconOn = document.getElementById('sound-icon-on');
    const soundIconOff = document.getElementById('sound-icon-off');
    const powerupBadge = document.getElementById('powerup-badge');
    const powerupNameEl = document.getElementById('powerup-name');
    const powerupMeterEl = document.getElementById('powerup-meter');

    // Virtual touch buttons
    const vBtnLeft = document.getElementById('v-btn-left');
    const vBtnRight = document.getElementById('v-btn-right');
    const vBtnJump = document.getElementById('v-btn-jump');
    const vBtnSlide = document.getElementById('v-btn-slide');

    // --- Texture Generators for Realistic Materials ---
    function createProceduralTextures() {
        // 1. Gravel / Ballast Texture
        const canvasBallast = document.createElement('canvas');
        canvasBallast.width = 256;
        canvasBallast.height = 256;
        const ctxB = canvasBallast.getContext('2d');
        ctxB.fillStyle = '#1c1f26';
        ctxB.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 3000; i++) {
            const val = Math.floor(Math.random() * 45 + 25);
            ctxB.fillStyle = `rgb(${val}, ${val + 2}, ${val + 6})`;
            ctxB.fillRect(Math.random() * 256, Math.random() * 256, Math.random() * 3 + 1, Math.random() * 3 + 1);
        }
        ballastTexture = new THREE.CanvasTexture(canvasBallast);
        ballastTexture.wrapS = THREE.RepeatWrapping;
        ballastTexture.wrapT = THREE.RepeatWrapping;
        ballastTexture.repeat.set(2, 10);

        // 2. Shiny Brushed Metal Rail Texture
        const canvasRail = document.createElement('canvas');
        canvasRail.width = 64;
        canvasRail.height = 64;
        const ctxR = canvasRail.getContext('2d');
        const gradR = ctxR.createLinearGradient(0, 0, 64, 0);
        gradR.addColorStop(0, '#556070');
        gradR.addColorStop(0.5, '#c5d3e8');
        gradR.addColorStop(1, '#475161');
        ctxR.fillStyle = gradR;
        ctxR.fillRect(0, 0, 64, 64);
        railTexture = new THREE.CanvasTexture(canvasRail);

        // 3. Hazard Stripes Texture
        const canvasHazard = document.createElement('canvas');
        canvasHazard.width = 128;
        canvasHazard.height = 128;
        const ctxH = canvasHazard.getContext('2d');
        ctxH.fillStyle = '#eab308';
        ctxH.fillRect(0, 0, 128, 128);
        ctxH.fillStyle = '#18181b';
        for (let i = -128; i < 256; i += 32) {
            ctxH.beginPath();
            ctxH.moveTo(i, 0);
            ctxH.lineTo(i + 16, 0);
            ctxH.lineTo(i - 16, 128);
            ctxH.lineTo(i - 32, 128);
            ctxH.fill();
        }
        hazardTexture = new THREE.CanvasTexture(canvasHazard);
        hazardTexture.wrapS = THREE.RepeatWrapping;
        hazardTexture.wrapT = THREE.RepeatWrapping;

        // 4. Train Metallic Panels
        const canvasTrain = document.createElement('canvas');
        canvasTrain.width = 256;
        canvasTrain.height = 256;
        const ctxT = canvasTrain.getContext('2d');
        ctxT.fillStyle = '#1e293b';
        ctxT.fillRect(0, 0, 256, 256);
        ctxT.fillStyle = '#0f172a';
        ctxT.fillRect(0, 120, 256, 16);
        ctxT.fillStyle = '#0284c7';
        ctxT.fillRect(0, 80, 256, 12);
        trainTexture = new THREE.CanvasTexture(canvasTrain);
    }

    // --- Initialization ---
    function init() {
        createProceduralTextures();
        highScoreValEl.textContent = `BEST: ${highScore.toLocaleString()}`;

        // 1. Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x060814);
        scene.fog = new THREE.FogExp2(0x060814, 0.011);

        // 2. Camera
        camera = new THREE.PerspectiveCamera(BASE_FOV, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 4.4, 7.8);

        // 3. Renderer with High-Precision Shadows
        const canvas = document.getElementById('canvas-3d');
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;

        // 4. Realistic Lighting: Sun, Ambient & Sky Bounce
        const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e1b4b, 0.65);
        scene.add(hemiLight);

        const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.15);
        sunLight.position.set(22, 38, 25);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 140;
        sunLight.shadow.camera.left = -22;
        sunLight.shadow.camera.right = 22;
        sunLight.shadow.camera.top = 22;
        sunLight.shadow.camera.bottom = -22;
        sunLight.shadow.bias = -0.0003;
        scene.add(sunLight);

        // Atmospheric cyan fill light from track
        const trackFillLight = new THREE.DirectionalLight(0x0284c7, 0.45);
        trackFillLight.position.set(-18, 15, -40);
        scene.add(trackFillLight);

        // 5. Build Articulated 3D Character
        createRealisticCharacter();

        // 6. Build High-Speed & Spark Particles
        createSparkSystem();
        createSpeedParticles();

        // 7. Spawn Initial Railway Chunks
        for (let i = 0; i < VISIBLE_CHUNKS; i++) {
            spawnTrackChunk(i === 0);
        }

        // 8. Event Listeners & UI Binding
        setupControls();
        setupCharacterSelection();

        window.addEventListener('resize', onWindowResize);
        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', startGame);
        pauseBtn.addEventListener('click', togglePause);
        resumeBtn.addEventListener('click', togglePause);
        pauseRestartBtn.addEventListener('click', () => { togglePause(); startGame(); });
        muteBtn.addEventListener('click', toggleMute);

        // Start render loop
        requestAnimationFrame(animate);
    }

    // --- High-Detail Articulated Character ---
    function createRealisticCharacter() {
        playerGroup = new THREE.Group();

        // Materials
        const jacketColor = selectedCharacter === 'striker' ? 0xec4899 : (selectedCharacter === 'boarder' ? 0x8b5cf6 : 0x0284c7);
        const jacketMat = new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.5 });
        const darkClothMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffd1a4, roughness: 0.6 });
        const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
        const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });

        // Pelvis / Hips Center
        const hipsGeo = new THREE.BoxGeometry(0.7, 0.35, 0.45);
        const hips = new THREE.Mesh(hipsGeo, darkClothMat);
        hips.position.y = 1.25;
        hips.castShadow = true;
        playerGroup.add(hips);

        // Torso
        const torsoGeo = new THREE.BoxGeometry(0.85, 0.9, 0.5);
        playerTorso = new THREE.Mesh(torsoGeo, jacketMat);
        playerTorso.position.y = 0.6;
        playerTorso.castShadow = true;
        hips.add(playerTorso);

        // Head & Visor
        const headGeo = new THREE.BoxGeometry(0.5, 0.52, 0.5);
        playerHead = new THREE.Mesh(headGeo, skinMat);
        playerHead.position.y = 0.72;
        playerHead.castShadow = true;
        playerTorso.add(playerHead);

        // Cap / Hair
        const capGeo = new THREE.BoxGeometry(0.54, 0.22, 0.56);
        const cap = new THREE.Mesh(capGeo, darkClothMat);
        cap.position.set(0, 0.2, -0.04);
        playerHead.add(cap);

        // Visor glass
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.12), visorMat);
        visor.position.set(0, 0.05, -0.26);
        playerHead.add(visor);

        // Backpack / Jet Thruster
        const packGeo = new THREE.BoxGeometry(0.6, 0.7, 0.25);
        const packMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
        const pack = new THREE.Mesh(packGeo, packMat);
        pack.position.set(0, 0.05, 0.35);
        pack.castShadow = true;
        playerTorso.add(pack);

        // Limbs with Functional Joints (Upper & Lower Segments)
        const limbMat = darkClothMat;

        // Left Leg
        legL_upper = new THREE.Group();
        legL_upper.position.set(-0.24, -0.15, 0);
        hips.add(legL_upper);
        const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.55, 0.26), limbMat);
        thighL.position.y = -0.25;
        thighL.castShadow = true;
        legL_upper.add(thighL);

        legL_lower = new THREE.Group();
        legL_lower.position.set(0, -0.52, 0);
        legL_upper.add(legL_lower);
        const shinL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.24), limbMat);
        shinL.position.y = -0.25;
        shinL.castShadow = true;
        legL_lower.add(shinL);

        const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.44), shoeMat);
        shoeL.position.set(0, -0.55, -0.06);
        shoeL.castShadow = true;
        legL_lower.add(shoeL);

        // Right Leg
        legR_upper = new THREE.Group();
        legR_upper.position.set(0.24, -0.15, 0);
        hips.add(legR_upper);
        const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.55, 0.26), limbMat);
        thighR.position.y = -0.25;
        thighR.castShadow = true;
        legR_upper.add(thighR);

        legR_lower = new THREE.Group();
        legR_lower.position.set(0, -0.52, 0);
        legR_upper.add(legR_lower);
        const shinR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.24), limbMat);
        shinR.position.y = -0.25;
        shinR.castShadow = true;
        legR_lower.add(shinR);

        const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.44), shoeMat);
        shoeR.position.set(0, -0.55, -0.06);
        shoeR.castShadow = true;
        legR_lower.add(shoeR);

        // Arms
        armL_upper = new THREE.Group();
        armL_upper.position.set(-0.52, 0.32, 0);
        playerTorso.add(armL_upper);
        const bicepL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.48, 0.22), jacketMat);
        bicepL.position.y = -0.22;
        bicepL.castShadow = true;
        armL_upper.add(bicepL);

        armL_lower = new THREE.Group();
        armL_lower.position.set(0, -0.44, 0);
        armL_upper.add(armL_lower);
        const foreL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.42, 0.2), skinMat);
        foreL.position.y = -0.18;
        foreL.castShadow = true;
        armL_lower.add(foreL);

        // Right Arm
        armR_upper = new THREE.Group();
        armR_upper.position.set(0.52, 0.32, 0);
        playerTorso.add(armR_upper);
        const bicepR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.48, 0.22), jacketMat);
        bicepR.position.y = -0.22;
        bicepR.castShadow = true;
        armR_upper.add(bicepR);

        armR_lower = new THREE.Group();
        armR_lower.position.set(0, -0.44, 0);
        armR_upper.add(armR_lower);
        const foreR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.42, 0.2), skinMat);
        foreR.position.y = -0.18;
        foreR.castShadow = true;
        armR_lower.add(foreR);

        // Cyber Hoverboard (shown when Character is boarder, or during special grinds)
        const boardGeo = new THREE.BoxGeometry(1.05, 0.08, 2.2);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.25 });
        hoverboardMesh = new THREE.Mesh(boardGeo, boardMat);
        hoverboardMesh.position.set(0, 0.05, 0);
        hoverboardMesh.castShadow = true;

        const boardNeon = new THREE.Mesh(
            new THREE.BoxGeometry(0.9, 0.04, 2.0),
            new THREE.MeshBasicMaterial({ color: 0x00f5ff })
        );
        boardNeon.position.y = -0.03;
        hoverboardMesh.add(boardNeon);
        hoverboardMesh.visible = selectedCharacter === 'boarder';
        playerGroup.add(hoverboardMesh);

        // Shield Bubble
        const shieldGeo = new THREE.SphereGeometry(1.85, 24, 24);
        const shieldMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            roughness: 0.1,
            metalness: 0.1,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        shieldSphere = new THREE.Mesh(shieldGeo, shieldMat);
        shieldSphere.position.y = 1.25;
        shieldSphere.visible = false;
        playerGroup.add(shieldSphere);

        scene.add(playerGroup);
    }

    // --- Particle Systems ---
    function createSparkSystem() {
        sparkGeo = new THREE.BufferGeometry();
        sparkPositions = new Float32Array(MAX_SPARKS * 3);
        sparkVelocities = [];

        for (let i = 0; i < MAX_SPARKS; i++) {
            sparkPositions[i * 3] = 0;
            sparkPositions[i * 3 + 1] = -100; // start off-screen
            sparkPositions[i * 3 + 2] = 0;
            sparkVelocities.push({ x: 0, y: 0, z: 0, life: 0 });
        }

        sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
        const sparkMat = new THREE.PointsMaterial({
            color: 0xffaa00,
            size: 0.18,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        sparkParticles = new THREE.Points(sparkGeo, sparkMat);
        scene.add(sparkParticles);
    }

    function emitRailSparks(x, y, z, count = 6) {
        let spawned = 0;
        for (let i = 0; i < MAX_SPARKS && spawned < count; i++) {
            if (sparkVelocities[i].life <= 0) {
                sparkPositions[i * 3] = x + (Math.random() - 0.5) * 0.4;
                sparkPositions[i * 3 + 1] = y + 0.1;
                sparkPositions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.3;

                sparkVelocities[i].x = (Math.random() - 0.5) * 6;
                sparkVelocities[i].y = Math.random() * 4 + 2;
                sparkVelocities[i].z = Math.random() * 10 + 5;
                sparkVelocities[i].life = 0.35 + Math.random() * 0.2;
                spawned++;
            }
        }
    }

    function createSpeedParticles() {
        const count = 220;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = Math.random() * 12 + 0.2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 70;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0x38bdf8,
            size: 0.15,
            transparent: true,
            opacity: 0.45
        });

        speedParticles = new THREE.Points(geo, mat);
        scene.add(speedParticles);
    }

    // --- High-Fidelity Track & Environment ---
    function spawnTrackChunk(isSafe = false) {
        const chunk = new THREE.Group();
        chunk.position.z = nextChunkZ;

        // 1. Ballast Gravel Embankment (Sloped realistic railway bed)
        const roadWidth = LANE_WIDTH * 3 + 4.5;
        const roadGeo = new THREE.BoxGeometry(roadWidth, 0.7, CHUNK_LENGTH);
        const roadMat = new THREE.MeshStandardMaterial({
            map: ballastTexture,
            roughness: 0.95,
            metalness: 0.05
        });
        const road = new THREE.Mesh(roadGeo, roadMat);
        road.position.set(0, -0.35, -CHUNK_LENGTH / 2);
        road.receiveShadow = true;
        chunk.add(road);

        // 2. Realistic Wooden Railroad Ties (Sleepers) every 1.4m
        const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x271e16, roughness: 0.85 });
        const sleeperGeo = new THREE.BoxGeometry(LANE_WIDTH * 3 + 1.2, 0.18, 0.45);
        for (let z = 0; z > -CHUNK_LENGTH; z -= 1.4) {
            const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
            sleeper.position.set(0, 0.05, z);
            sleeper.receiveShadow = true;
            chunk.add(sleeper);
        }

        // 3. Realistic Steel Rails (Pair per lane with shiny brushed metal)
        const railMat = new THREE.MeshStandardMaterial({
            map: railTexture,
            roughness: 0.2,
            metalness: 0.95
        });
        const railGeo = new THREE.BoxGeometry(0.12, 0.22, CHUNK_LENGTH);

        LANES.forEach(lx => {
            [-0.75, 0.75].forEach(ox => {
                const rail = new THREE.Mesh(railGeo, railMat);
                rail.position.set(lx + ox, 0.2, -CHUNK_LENGTH / 2);
                rail.castShadow = true;
                rail.receiveShadow = true;
                chunk.add(rail);
            });
        });

        // 4. Overhead Electrification Gantries & High-Voltage Wires
        for (let z = -15; z > -CHUNK_LENGTH; z -= 30) {
            const gantry = createOverheadCatenary();
            gantry.position.set(0, 0, z);
            chunk.add(gantry);
        }

        // 5. Ambient Metro Concrete Walls & Distant Neon Skyscrapers
        for (let side of [-1, 1]) {
            // Trackside concrete barrier
            const wallGeo = new THREE.BoxGeometry(0.8, 1.4, CHUNK_LENGTH);
            const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
            const wall = new THREE.Mesh(wallGeo, wallMat);
            wall.position.set(side * (roadWidth / 2 + 0.4), 0.7, -CHUNK_LENGTH / 2);
            wall.receiveShadow = true;
            chunk.add(wall);

            // High-voltage warning signs along wall
            for (let wz = -10; wz > -CHUNK_LENGTH; wz -= 25) {
                const sign = new THREE.Mesh(
                    new THREE.BoxGeometry(0.08, 0.6, 1.2),
                    new THREE.MeshBasicMaterial({ color: 0xf59e0b })
                );
                sign.position.set(side * (roadWidth / 2 + 0.02), 0.9, wz);
                chunk.add(sign);
            }

            // Distant Architectural Cyber Metro Skyline
            const bldH = 30 + Math.random() * 45;
            const bldW = 9 + Math.random() * 7;
            const bldGeo = new THREE.BoxGeometry(bldW, bldH, 16 + Math.random() * 10);
            const bldMat = new THREE.MeshStandardMaterial({
                color: side === 1 ? 0x0b1329 : 0x170e28,
                roughness: 0.5,
                metalness: 0.3
            });
            const bld = new THREE.Mesh(bldGeo, bldMat);
            bld.position.set(side * (18 + Math.random() * 10), bldH / 2 - 2, -CHUNK_LENGTH / 2);
            chunk.add(bld);
        }

        scene.add(chunk);
        trackChunks.push(chunk);

        // Spawn interactive obstacles & items if not initial safe zone
        if (!isSafe) {
            populateTrackChunk(nextChunkZ);
        }

        nextChunkZ -= CHUNK_LENGTH;
    }

    function createOverheadCatenary() {
        const gantry = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });
        const postW = LANE_WIDTH * 1.9;

        // Left & right steel trellis posts
        [-postW, postW].forEach(px => {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, 7.5, 0.45), metalMat);
            post.position.set(px, 3.75, 0);
            post.castShadow = true;
            gantry.add(post);
        });

        // Cross truss beam
        const beam = new THREE.Mesh(new THREE.BoxGeometry(postW * 2 + 0.8, 0.5, 0.5), metalMat);
        beam.position.set(0, 7.2, 0);
        beam.castShadow = true;
        gantry.add(beam);

        // Insulator pods & hanging wire holders
        LANES.forEach(lx => {
            const pod = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8),
                new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.2 })
            );
            pod.position.set(lx, 6.4, 0);
            gantry.add(pod);

            // Signal light on middle or side posts
            if (Math.random() < 0.4) {
                const signalLight = new THREE.Mesh(
                    new THREE.SphereGeometry(0.2, 12, 12),
                    new THREE.MeshBasicMaterial({ color: Math.random() < 0.7 ? 0x22c55e : 0xef4444 })
                );
                signalLight.position.set(lx + 0.6, 6.8, 0.3);
                gantry.add(signalLight);
            }
        });

        return gantry;
    }

    // --- Realistic Obstacles & Items ---
    function populateTrackChunk(chunkStartZ) {
        const slots = [chunkStartZ - 18, chunkStartZ - 40, chunkStartZ - 58];

        slots.forEach(zPos => {
            const openLane = Math.floor(Math.random() * 3);
            const roll = Math.random();

            if (roll < 0.8) {
                const typeRoll = Math.random();

                LANES.forEach((lx, lIdx) => {
                    if (lIdx === openLane) {
                        // Safe lane: reward with coins or powerups
                        if (Math.random() < 0.7) {
                            spawnCoinStreak(lx, zPos);
                        } else if (Math.random() < 0.3) {
                            spawnPowerupChest(lx, zPos);
                        }
                    } else {
                        // Blocked lanes: challenge player
                        if (typeRoll < 0.4) {
                            spawnRealisticHurdle(lx, zPos);
                        } else if (typeRoll < 0.68) {
                            spawnRealisticHighLaser(lx, zPos);
                        } else {
                            spawnRealisticSubwayTrain(lx, zPos);
                        }
                    }
                });
            } else {
                // Parabolic coin arc over a hurdle in open lane
                spawnRealisticHurdle(LANES[openLane], zPos);
                spawnParabolicCoins(LANES[openLane], zPos);
            }
        });
    }

    // 1. Realistic Subway Metro Train with Windows, Headlights & Bogies
    function spawnRealisticSubwayTrain(x, z) {
        const train = new THREE.Group();
        const length = 14;
        train.position.set(x, 0, z);

        // Main Car Body with Rounded Top Corners
        const bodyGeo = new THREE.BoxGeometry(2.6, 3.4, length);
        const bodyMat = new THREE.MeshStandardMaterial({
            map: trainTexture,
            metalness: 0.65,
            roughness: 0.35
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.95;
        body.castShadow = true;
        body.receiveShadow = true;
        train.add(body);

        // Aerodynamic Sloped Nose Cap facing incoming player (+Z face)
        const noseGeo = new THREE.BoxGeometry(2.55, 3.2, 1.2);
        const noseMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });
        const nose = new THREE.Mesh(noseGeo, noseMat);
        nose.position.set(0, 1.9, length / 2 + 0.55);
        nose.castShadow = true;
        train.add(nose);

        // Front Windshield
        const winGeo = new THREE.BoxGeometry(2.1, 1.1, 0.15);
        const winMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const frontWin = new THREE.Mesh(winGeo, winMat);
        frontWin.position.set(0, 2.5, length / 2 + 1.16);
        train.add(frontWin);

        // Glowing Dual High-Beam Headlights
        const hlGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.2, 16);
        hlGeo.rotateX(Math.PI / 2);
        const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        [-0.8, 0.8].forEach(hx => {
            const hl = new THREE.Mesh(hlGeo, hlMat);
            hl.position.set(hx, 1.15, length / 2 + 1.16);
            train.add(hl);
        });

        // Passenger Side Windows with Soft Interior Ambient Glow
        const windowGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        for (let wz = -length / 2 + 2; wz < length / 2 - 1; wz += 2.8) {
            [-1.32, 1.32].forEach(wx => {
                const win = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 1.6), windowGlowMat);
                win.position.set(wx, 2.2, wz);
                train.add(win);
            });
        }

        // Realistic Under-carriage Wheels & Bogies
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.3 });
        const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.2, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        [-length / 3, length / 3].forEach(bz => {
            [-1.0, 1.0].forEach(wx => {
                const wheel = new THREE.Mesh(wheelGeo, wheelMat);
                wheel.position.set(wx, 0.38, bz);
                train.add(wheel);
            });
        });

        train.userData = {
            type: 'train',
            minY: 0,
            maxY: 3.6,
            width: 2.6,
            depth: length + 1.2
        };

        scene.add(train);
        activeObstacles.push(train);
    }

    // 2. Realistic Low Hurdle with Flashing Amber Beacon
    function spawnRealisticHurdle(x, z) {
        const hurdle = new THREE.Group();
        hurdle.position.set(x, 0, z);

        // Heavy steel A-frame base
        const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.4 });
        [-1.05, 1.05].forEach(lx => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 0.6), legMat);
            leg.position.set(lx, 0.45, 0);
            leg.castShadow = true;
            hurdle.add(leg);
        });

        // Diagonal Hazard Striped Crossbar
        const barMat = new THREE.MeshStandardMaterial({
            map: hazardTexture,
            roughness: 0.4
        });
        const bar = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.7, 0.22), barMat);
        bar.position.set(0, 0.65, 0);
        bar.castShadow = true;
        hurdle.add(bar);

        // Amber flashing construction beacon on top
        const beacon = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.14, 0.25, 12),
            new THREE.MeshBasicMaterial({ color: 0xf59e0b })
        );
        beacon.position.set(0, 1.15, 0);
        hurdle.add(beacon);

        hurdle.userData = {
            type: 'hurdle',
            minY: 0,
            maxY: 1.1,
            width: 2.3,
            depth: 0.7
        };

        scene.add(hurdle);
        activeObstacles.push(hurdle);
    }

    // 3. Realistic Overhead Laser Beam / Overhead Construction Sign
    function spawnRealisticHighLaser(x, z) {
        const barrier = new THREE.Group();
        barrier.position.set(x, 0, z);

        const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
        // Side vertical suspension beams
        [-1.15, 1.15].forEach(lx => {
            const beam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 0.35), frameMat);
            beam.position.set(lx, 1.8, 0);
            beam.castShadow = true;
            barrier.add(beam);
        });

        // Top heavy cross sign
        const topBlock = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 1.5, 0.4),
            new THREE.MeshStandardMaterial({ map: hazardTexture, roughness: 0.5 })
        );
        topBlock.position.set(0, 2.2, 0);
        topBlock.castShadow = true;
        barrier.add(topBlock);

        // Pulsing Neon Laser Wire Underneath
        const laser = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 2.35, 8),
            new THREE.MeshBasicMaterial({ color: 0xf43f5e })
        );
        laser.rotateZ(Math.PI / 2);
        laser.position.set(0, 1.25, 0);
        barrier.add(laser);

        barrier.userData = {
            type: 'high_barrier',
            minY: 1.05, // Head must duck below 0.95 during slide
            maxY: 3.1,
            width: 2.35,
            depth: 0.7
        };

        scene.add(barrier);
        activeObstacles.push(barrier);
    }

    // 4. Collectibles: 3D High-Gloss Gold Coins
    const coinGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.12, 20);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        metalness: 0.95,
        roughness: 0.15,
        emissive: 0xca8a04,
        emissiveIntensity: 0.35
    });

    function spawnCoin(x, y, z) {
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.position.set(x, y, z);
        coin.castShadow = true;
        coin.userData = { initialY: y };
        scene.add(coin);
        activeCoins.push(coin);
    }

    function spawnCoinStreak(x, zCenter) {
        for (let i = -2; i <= 2; i++) {
            spawnCoin(x, 0.95, zCenter + i * 2.2);
        }
    }

    function spawnParabolicCoins(x, zCenter) {
        for (let i = -3; i <= 3; i++) {
            const prog = (i + 3) / 6;
            const y = 0.95 + Math.sin(prog * Math.PI) * 2.4;
            spawnCoin(x, y, zCenter + i * 2.1);
        }
    }

    // 5. Powerup Orb Chest
    function spawnPowerupChest(x, z) {
        const types = ['magnet', 'shield', '2x'];
        const chosen = types[Math.floor(Math.random() * types.length)];

        const pGroup = new THREE.Group();
        pGroup.position.set(x, 1.2, z);

        let col = chosen === 'magnet' ? 0xf43f5e : (chosen === 'shield' ? 0x38bdf8 : 0x22c55e);

        const orb = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.55, 2),
            new THREE.MeshStandardMaterial({
                color: col,
                emissive: col,
                emissiveIntensity: 0.7,
                roughness: 0.1,
                metalness: 0.8
            })
        );
        pGroup.add(orb);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.8, 0.05, 8, 24),
            new THREE.MeshBasicMaterial({ color: col })
        );
        pGroup.add(ring);
        pGroup.ringMesh = ring;

        pGroup.userData = { type: chosen };
        scene.add(pGroup);
        activePowerupItems.push(pGroup);
    }

    // --- Floating Text / UI Popups ---
    function showFloatingMsg(text, color = '#38bdf8') {
        const div = document.createElement('div');
        div.className = 'float-msg';
        div.textContent = text;
        div.style.color = color;
        div.style.left = '50%';
        div.style.top = '48%';
        floatingTextContainer.appendChild(div);

        setTimeout(() => {
            if (div.parentNode) div.parentNode.removeChild(div);
        }, 900);
    }

    // --- Controls & Character Selection ---
    function setupCharacterSelection() {
        const cards = document.querySelectorAll('.char-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedCharacter = card.getAttribute('data-char');

                // Adjust perks
                if (selectedCharacter === 'striker') {
                    jumpForce = 18.0;
                } else {
                    jumpForce = 15.5;
                }

                if (hoverboardMesh) {
                    hoverboardMesh.visible = (selectedCharacter === 'boarder');
                }
            });
        });
    }

    function setupControls() {
        window.addEventListener('keydown', (e) => {
            if (!isPlaying) return;

            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
                moveLane(-1);
            } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
                moveLane(1);
            } else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w' || e.key === ' ') {
                e.preventDefault();
                jump();
            } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
                e.preventDefault();
                slide();
            } else if (e.key.toLowerCase() === 'p') {
                togglePause();
            }
        });

        // Touch gestures
        let touchX = 0, touchY = 0;
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                touchX = e.touches[0].clientX;
                touchY = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            if (!isPlaying || e.changedTouches.length === 0) return;
            const dx = e.changedTouches[0].clientX - touchX;
            const dy = e.changedTouches[0].clientY - touchY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 30) moveLane(1);
                else if (dx < -30) moveLane(-1);
            } else {
                if (dy < -30) jump();
                else if (dy > 30) slide();
            }
        }, { passive: true });

        // Virtual Touch Buttons
        if (vBtnLeft) vBtnLeft.addEventListener('click', () => moveLane(-1));
        if (vBtnRight) vBtnRight.addEventListener('click', () => moveLane(1));
        if (vBtnJump) vBtnJump.addEventListener('click', jump);
        if (vBtnSlide) vBtnSlide.addEventListener('click', slide);
    }

    function moveLane(dir) {
        const next = currentLane + dir;
        if (next >= 0 && next < LANES.length) {
            currentLane = next;
            targetX = LANES[currentLane];
        }
    }

    function jump() {
        if (!isJumping) {
            isJumping = true;
            isSliding = false;
            playerVy = jumpForce;
            window.soundFX.playJump();
        }
    }

    function slide() {
        if (!isSliding) {
            isSliding = true;
            slideTimer = SLIDE_DURATION;
            if (isJumping) playerVy = -24; // Snap down quickly
            window.soundFX.playSlide();
            emitRailSparks(playerGroup.position.x, 0.1, playerGroup.position.z, 14);
        }
    }

    function togglePause() {
        if (!isPlaying) return;
        isPaused = !isPaused;
        if (isPaused) {
            pauseScreen.classList.remove('hidden');
            window.soundFX.stopMusic();
        } else {
            pauseScreen.classList.add('hidden');
            window.soundFX.startMusic();
            clock.getDelta(); // Clear delta jump
        }
    }

    function toggleMute() {
        const isMuted = window.soundFX.toggleMute();
        soundIconOn.style.display = isMuted ? 'none' : 'block';
        soundIconOff.style.display = isMuted ? 'block' : 'none';
    }

    // --- Game Lifecycle ---
    function startGame() {
        window.soundFX.init();
        window.soundFX.startMusic();

        startScreen.classList.add('hidden');
        pauseScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');

        resetState();
        isPlaying = true;
        isPaused = false;
        clock.start();
    }

    function resetState() {
        score = 0;
        coins = 0;
        distanceTraveled = 0;
        currentSpeed = INITIAL_SPEED;
        currentLane = 1;
        targetX = LANES[currentLane];
        playerY = 0;
        playerVy = 0;
        isJumping = false;
        isSliding = false;
        slideTimer = 0;
        activePowerup = null;
        powerupTimeLeft = 0;
        streakCount = 0;
        shakeIntensity = 0;

        powerupBadge.classList.remove('active');
        shieldSphere.visible = false;
        playerGroup.position.set(0, 0, 0);
        playerGroup.rotation.set(0, 0, 0);

        scoreValEl.textContent = '0';
        coinValEl.textContent = '0';
        speedIndicatorEl.textContent = Math.round(INITIAL_SPEED * 1.6);
        comboBadgeEl.classList.remove('active');

        // Clean arrays
        trackChunks.forEach(c => scene.remove(c));
        trackChunks.length = 0;

        activeObstacles.forEach(o => scene.remove(o));
        activeObstacles.length = 0;

        activeCoins.forEach(c => scene.remove(c));
        activeCoins.length = 0;

        activePowerupItems.forEach(p => scene.remove(p));
        activePowerupItems.length = 0;

        nextChunkZ = 0;

        for (let i = 0; i < VISIBLE_CHUNKS; i++) {
            spawnTrackChunk(i === 0);
        }
    }

    function triggerGameOver() {
        isPlaying = false;
        window.soundFX.playCrash();
        window.soundFX.stopMusic();

        shakeIntensity = 0.9;
        emitRailSparks(playerGroup.position.x, 0.5, playerGroup.position.z, 40);

        const isNewBest = score > highScore;
        if (isNewBest) {
            highScore = score;
            localStorage.setItem('cyber_subway_high', highScore.toString());
            newRecordBanner.classList.remove('hidden');
        } else {
            newRecordBanner.classList.add('hidden');
        }

        finalScoreEl.textContent = score.toLocaleString();
        finalCoinsEl.textContent = coins.toLocaleString();
        finalDistEl.textContent = `${Math.round(distanceTraveled)}m`;
        highScoreValEl.textContent = `BEST: ${highScore.toLocaleString()}`;

        setTimeout(() => {
            gameOverScreen.classList.remove('hidden');
        }, 600);
    }

    // --- Main Update Loop ---
    function animate() {
        requestAnimationFrame(animate);

        const delta = Math.min(clock.getDelta(), 0.1);

        if (isPlaying && !isPaused) {
            updateGame(delta);
        }

        // Camera Shake Damping
        if (shakeIntensity > 0) {
            camera.position.x += (Math.random() - 0.5) * shakeIntensity;
            camera.position.y += (Math.random() - 0.5) * shakeIntensity;
            shakeIntensity = Math.max(0, shakeIntensity - delta * 2.8);
        }

        // Sparks Update
        updateSparks(delta);

        renderer.render(scene, camera);
    }

    function updateSparks(delta) {
        if (!sparkPositions) return;
        let anyAlive = false;

        for (let i = 0; i < MAX_SPARKS; i++) {
            if (sparkVelocities[i].life > 0) {
                sparkVelocities[i].life -= delta;
                sparkVelocities[i].y += GRAVITY * 0.5 * delta;

                sparkPositions[i * 3] += sparkVelocities[i].x * delta;
                sparkPositions[i * 3 + 1] += sparkVelocities[i].y * delta;
                sparkPositions[i * 3 + 2] += sparkVelocities[i].z * delta;

                if (sparkPositions[i * 3 + 1] < 0.05) {
                    sparkPositions[i * 3 + 1] = 0.05;
                    sparkVelocities[i].y *= -0.4; // Bounce
                }
                anyAlive = true;
            } else {
                sparkPositions[i * 3 + 1] = -100;
            }
        }

        if (anyAlive) {
            sparkGeo.attributes.position.needsUpdate = true;
        }
    }

    function updateGame(delta) {
        // 1. Speed Increment & Distance Calculation
        if (currentSpeed < MAX_SPEED) {
            currentSpeed += SPEED_INCREMENT * delta;
        }

        const kmh = Math.round(currentSpeed * 1.6);
        speedIndicatorEl.textContent = kmh;

        const scoreMult = activePowerup === '2x' ? 2 : 1;
        const forwardStep = currentSpeed * delta;
        distanceTraveled += forwardStep;
        score += Math.round(forwardStep * 1.8 * scoreMult);
        scoreValEl.textContent = score.toLocaleString();

        // Dynamic FOV breath with speed
        const targetFOV = BASE_FOV + (currentSpeed - INITIAL_SPEED) * 0.28;
        camera.fov += (targetFOV - camera.fov) * (delta * 4);
        camera.updateProjectionMatrix();

        // 2. Player Forward Z Movement
        playerGroup.position.z -= forwardStep;

        // 3. Smooth Lane Transition (Lerp X) with Banking Tilt
        playerGroup.position.x += (targetX - playerGroup.position.x) * (delta * 14.5);
        const laneDiff = targetX - playerGroup.position.x;
        playerGroup.rotation.z = -laneDiff * 0.15; // Realistic roll into turn

        // 4. Jump Physics
        if (isJumping) {
            playerVy += GRAVITY * delta;
            playerY += playerVy * delta;

            if (playerY <= 0) {
                playerY = 0;
                playerVy = 0;
                isJumping = false;
                emitRailSparks(playerGroup.position.x, 0.1, playerGroup.position.z, 8);
            }
        }

        // 5. Slide Mechanics & Articulation
        if (isSliding) {
            slideTimer -= delta;
            playerGroup.position.y = playerY + 0.05;

            // Slide Pose: Torso reclined, one leg tucked, one extended
            playerTorso.rotation.x = 0.9;
            playerTorso.position.y = 0.35;
            legL_upper.rotation.x = -1.4;
            legR_upper.rotation.x = -0.5;
            legR_lower.rotation.x = 1.3;

            emitRailSparks(playerGroup.position.x, 0.1, playerGroup.position.z, 3);

            if (slideTimer <= 0) {
                isSliding = false;
                playerTorso.rotation.x = 0;
                playerTorso.position.y = 0.6;
            }
        } else {
            playerGroup.position.y = playerY;
            playerTorso.rotation.x = 0;
            playerTorso.position.y = 0.6;
        }

        // 6. Running Animation Gait
        if (!isJumping && !isSliding) {
            const cycle = Date.now() * 0.016 * (currentSpeed / INITIAL_SPEED);

            // Legs swing with knee bending
            legL_upper.rotation.x = Math.sin(cycle) * 0.8;
            legL_lower.rotation.x = Math.max(0, -Math.sin(cycle) * 1.1);

            legR_upper.rotation.x = -Math.sin(cycle) * 0.8;
            legR_lower.rotation.x = Math.max(0, Math.sin(cycle) * 1.1);

            // Counter arms swing with elbow flex
            armL_upper.rotation.x = -Math.sin(cycle) * 0.85;
            armL_lower.rotation.x = -0.4;

            armR_upper.rotation.x = Math.sin(cycle) * 0.85;
            armR_lower.rotation.x = -0.4;

            // Torso slight bob
            playerTorso.position.y = 0.6 + Math.abs(Math.sin(cycle)) * 0.08;
        } else if (isJumping) {
            // Jump Tuck Pose
            legL_upper.rotation.x = -1.1;
            legL_lower.rotation.x = 1.4;
            legR_upper.rotation.x = -0.8;
            legR_lower.rotation.x = 1.2;
            armL_upper.rotation.x = -1.2;
            armR_upper.rotation.x = -1.2;
        }

        // 7. Dynamic Camera Following with Easing
        const targetCamX = playerGroup.position.x * 0.4;
        const targetCamY = 4.2 + (playerY * 0.38);
        const targetCamZ = playerGroup.position.z + 7.6;

        camera.position.x += (targetCamX - camera.position.x) * (delta * 12);
        camera.position.y += (targetCamY - camera.position.y) * (delta * 12);
        camera.position.z = targetCamZ;
        camera.lookAt(playerGroup.position.x * 0.2, playerGroup.position.y * 0.25 + 1.6, playerGroup.position.z - 15);

        // 8. Speed Particle Streaks
        speedParticles.position.z = playerGroup.position.z - 12;

        // 9. Powerup Management
        if (activePowerup) {
            powerupTimeLeft -= delta;
            const pct = Math.max(0, (powerupTimeLeft / POWERUP_DURATION) * 100);
            powerupMeterEl.style.width = `${pct}%`;

            if (powerupTimeLeft <= 0) {
                activePowerup = null;
                powerupBadge.classList.remove('active');
                shieldSphere.visible = false;
            }
        }

        // 10. Coins & Magnetic Attraction
        const magnetRange = selectedCharacter === 'boarder' ? 17 : 13;

        for (let i = activeCoins.length - 1; i >= 0; i--) {
            const coin = activeCoins[i];
            coin.rotation.z += delta * 3.8;
            coin.position.y = coin.userData.initialY + Math.sin(Date.now() * 0.005 + coin.position.z) * 0.1;

            if (activePowerup === 'magnet') {
                const dist = coin.position.distanceTo(playerGroup.position);
                if (dist < magnetRange) {
                    coin.position.x += (playerGroup.position.x - coin.position.x) * (delta * 12);
                    coin.position.y += (playerGroup.position.y + 0.9 - coin.position.y) * (delta * 12);
                    coin.position.z += (playerGroup.position.z - coin.position.z) * (delta * 12);
                }
            }

            // Collection Check
            const dx = Math.abs(coin.position.x - playerGroup.position.x);
            const dz = Math.abs(coin.position.z - playerGroup.position.z);
            const dy = Math.abs(coin.position.y - (playerGroup.position.y + 0.9));

            if (dx < 1.15 && dz < 1.45 && dy < 1.8) {
                scene.remove(coin);
                activeCoins.splice(i, 1);
                coins += (activePowerup === '2x' ? 2 : 1);
                coinValEl.textContent = coins.toLocaleString();
                score += 50 * (activePowerup === '2x' ? 2 : 1);
                window.soundFX.playCoin();

                streakCount++;
                if (streakCount % 10 === 0) {
                    showFloatingMsg(`${streakCount}x COIN STREAK!`, '#facc15');
                    comboBadgeEl.textContent = `${streakCount}X STREAK!`;
                    comboBadgeEl.classList.add('active');
                    setTimeout(() => comboBadgeEl.classList.remove('active'), 1500);
                }
                continue;
            }

            if (coin.position.z > playerGroup.position.z + 14) {
                scene.remove(coin);
                activeCoins.splice(i, 1);
            }
        }

        // 11. Powerup Chest Collision
        for (let i = activePowerupItems.length - 1; i >= 0; i--) {
            const item = activePowerupItems[i];
            item.rotation.y += delta * 2.8;
            if (item.ringMesh) item.ringMesh.rotation.x += delta * 3.5;

            const dx = Math.abs(item.position.x - playerGroup.position.x);
            const dz = Math.abs(item.position.z - playerGroup.position.z);
            const dy = Math.abs(item.position.y - (playerGroup.position.y + 0.9));

            if (dx < 1.3 && dz < 1.5 && dy < 1.8) {
                const pType = item.userData.type;
                activePowerup = pType;
                powerupTimeLeft = POWERUP_DURATION;

                powerupNameEl.textContent = pType === '2x' ? '2X MULTIPLIER' : pType.toUpperCase();
                powerupBadge.classList.add('active');
                shieldSphere.visible = (pType === 'shield');

                showFloatingMsg(`${pType.toUpperCase()} ACTIVATED!`, '#38bdf8');
                window.soundFX.playPowerup();

                scene.remove(item);
                activePowerupItems.splice(i, 1);
                continue;
            }

            if (item.position.z > playerGroup.position.z + 14) {
                scene.remove(item);
                activePowerupItems.splice(i, 1);
            }
        }

        // 12. Obstacle Collision & Close Call Detection
        const pLeft = playerGroup.position.x - 0.45;
        const pRight = playerGroup.position.x + 0.45;
        const pZNear = playerGroup.position.z + 0.45;
        const pZFar = playerGroup.position.z - 0.45;
        const pBottom = playerGroup.position.y;
        const pTop = playerGroup.position.y + (isSliding ? 0.72 : 2.15);

        for (let i = activeObstacles.length - 1; i >= 0; i--) {
            const obs = activeObstacles[i];
            const u = obs.userData;

            const obsLeft = obs.position.x - u.width / 2;
            const obsRight = obs.position.x + u.width / 2;
            const obsZNear = obs.position.z + u.depth / 2;
            const obsZFar = obs.position.z - u.depth / 2;

            // Close-call near miss check (dodging right next to train/hurdle)
            if (!obs.userData.closeCallTriggered && pZFar < obsZNear && pZNear > obsZFar) {
                const lateralDist = Math.abs(playerGroup.position.x - obs.position.x);
                if (lateralDist > u.width / 2 + 0.1 && lateralDist < u.width / 2 + 0.9) {
                    obs.userData.closeCallTriggered = true;
                    score += 250;
                    showFloatingMsg('CLOSE CALL! +250', '#f43f5e');
                    window.soundFX.playCloseCall();
                }
            }

            // AABB Collision Overlap
            const hitX = pRight > obsLeft && pLeft < obsRight;
            const hitZ = pZNear > obsZFar && pZFar < obsZNear;
            const hitY = pTop > u.minY && pBottom < u.maxY;

            if (hitX && hitZ && hitY) {
                if (activePowerup === 'shield') {
                    // Shield absorbs hit
                    activePowerup = null;
                    powerupTimeLeft = 0;
                    powerupBadge.classList.remove('active');
                    shieldSphere.visible = false;
                    shakeIntensity = 0.6;
                    showFloatingMsg('SHIELD BROKEN!', '#fb923c');
                    window.soundFX.playCrash();
                    emitRailSparks(playerGroup.position.x, 1.2, playerGroup.position.z, 25);

                    scene.remove(obs);
                    activeObstacles.splice(i, 1);
                    continue;
                } else {
                    triggerGameOver();
                    return;
                }
            }

            // Cull past obstacles
            if (obs.position.z > playerGroup.position.z + 18) {
                scene.remove(obs);
                activeObstacles.splice(i, 1);
            }
        }

        // 13. Dynamic Chunk Recycling
        if (playerGroup.position.z - 210 < nextChunkZ) {
            spawnTrackChunk(false);
        }

        if (trackChunks.length > 0 && trackChunks[0].position.z > playerGroup.position.z + CHUNK_LENGTH + 20) {
            const oldChunk = trackChunks.shift();
            scene.remove(oldChunk);
        }
    }

    function onWindowResize() {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('DOMContentLoaded', init);
})();
