import * as THREE from 'three';

/**
 * iKWATH 3D Scene Controller
 * Creates a high-detail 3D procedural smart machine with floating Ayurvedic herbs,
 * volumetric Kwatha liquid, lighting, and mouse parallax. Supports multi-view camera transitions.
 */
export class Scene3D {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.mode = 'standby'; // 'standby' | 'brewing' | 'dispensing'
    this.currentView = 'login'; // 'login' | 'dashboard' | 'scanner' | 'twin' | 'pod-scanner' | 'ai-recommend'
    this.activeColor = new THREE.Color(0x10b981);
    this.targetColor = new THREE.Color(0x10b981);

    // Camera Target Positions for View Routing
    this.targetCameraPos = new THREE.Vector3(-0.6, 1.2, 5.8);
    this.targetLookAt = new THREE.Vector3(-0.5, 0.4, 0);

    // Mouse tracking for smooth parallax
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.rotationOffset = { x: 0, y: 0 };

    this.init();
    this.createMachine();
    this.createFloatingBotanicals();
    this.createPollenParticles();
    this.setupEvents();
    this.animate();
  }

  init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.copy(this.targetCameraPos);
    this.camera.lookAt(this.targetLookAt);

    this.ambientLight = new THREE.AmbientLight(0x121a16, 1.2);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xfff8ea, 2.2);
    this.keyLight.position.set(4, 6, 5);
    this.keyLight.castShadow = true;
    this.scene.add(this.keyLight);

    this.emeraldLight = new THREE.PointLight(0x10b981, 3.5, 6);
    this.emeraldLight.position.set(-0.5, 0.6, 0);
    this.scene.add(this.emeraldLight);

    this.goldRimLight = new THREE.PointLight(0xd4af37, 2.8, 5);
    this.goldRimLight.position.set(-2.5, 2, -1);
    this.scene.add(this.goldRimLight);

    this.clock = new THREE.Clock();
  }

  setView(viewName) {
    this.currentView = viewName;
    if (viewName === 'dashboard') {
      this.targetCameraPos.set(0.6, 1.1, 5.2);
      this.targetLookAt.set(0.4, 0.3, 0);
    } else if (viewName === 'scanner') {
      this.targetCameraPos.set(0.0, 0.4, 4.8);
      this.targetLookAt.set(0.0, 0.2, 0);
    } else if (viewName === 'twin') {
      this.targetCameraPos.set(0.0, 0.6, 4.5);
      this.targetLookAt.set(0.0, 0.3, 0);
    } else if (viewName === 'pod-scanner') {
      this.targetCameraPos.set(0.0, 1.2, 4.0);
      this.targetLookAt.set(0.0, 1.35, 0);
      this.goldRimLight.intensity = 5.0;
    } else if (viewName === 'ai-recommend') {
      this.targetCameraPos.set(0.4, 0.8, 4.6);
      this.targetLookAt.set(0.2, 0.4, 0);
      this.goldRimLight.intensity = 4.2;
    } else if (viewName === 'preparation') {
      this.targetCameraPos.set(0.0, 0.55, 4.2);
      this.targetLookAt.set(0.0, 0.35, 0);
      this.goldRimLight.intensity = 4.8;
      this.emeraldLight.intensity = 5.0;
    } else if (viewName === 'dispensing') {
      this.targetCameraPos.set(0.0, 0.15, 3.9);
      this.targetLookAt.set(0.0, -0.1, 0);
      this.goldRimLight.intensity = 5.5;
      this.emeraldLight.intensity = 5.2;
    } else if (viewName === 'history') {
      this.targetCameraPos.set(-0.4, 0.9, 5.0);
      this.targetLookAt.set(-0.2, 0.3, 0);
      this.goldRimLight.intensity = 3.5;
    } else {
      this.targetCameraPos.set(-0.6, 1.2, 5.8);
      this.targetLookAt.set(-0.5, 0.4, 0);
    }
  }

  setTwinStatusState(state) {
    if (state === 'ready') {
      this.targetColor.set(0x10b981);
      this.emeraldLight.intensity = 3.5;
      this.mode = 'standby';
    } else if (state === 'preparing') {
      this.targetColor.set(0xd4af37);
      this.emeraldLight.intensity = 5.5;
      this.mode = 'brewing';
    } else if (state === 'attention') {
      this.targetColor.set(0xef4444);
      this.emeraldLight.intensity = 6.0;
      this.mode = 'standby';
    } else if (state === 'offline') {
      this.targetColor.set(0x475569);
      this.emeraldLight.intensity = 0.8;
      this.mode = 'standby';
    }
  }

  triggerScanSuccessAnimation() {
    this.targetColor.set(0xd4af37);
    this.emeraldLight.intensity = 8.0;
    this.goldRimLight.intensity = 6.0;

    setTimeout(() => {
      this.targetColor.set(0x10b981);
      this.emeraldLight.intensity = 3.5;
      this.goldRimLight.intensity = 2.8;
    }, 2000);
  }

  createMachine() {
    this.machineGroup = new THREE.Group();
    this.machineGroup.position.set(-0.6, -0.3, 0);
    this.scene.add(this.machineGroup);

    const darkChromeMat = new THREE.MeshStandardMaterial({
      color: 0x121815,
      roughness: 0.2,
      metalness: 0.9
    });

    const brushedGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.88
    });

    const glassChamberMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      ior: 1.5,
      transmission: 0.92,
      thickness: 0.5
    });

    // Base Pedestal
    const baseGeo = new THREE.CylinderGeometry(1.2, 1.35, 0.2, 48);
    const baseMesh = new THREE.Mesh(baseGeo, darkChromeMat);
    baseMesh.position.y = -0.7;
    baseMesh.receiveShadow = true;
    this.machineGroup.add(baseMesh);

    // Gold Trim Ring
    const goldRingGeo = new THREE.TorusGeometry(1.22, 0.025, 16, 64);
    const goldRingMesh = new THREE.Mesh(goldRingGeo, brushedGoldMat);
    goldRingMesh.rotation.x = Math.PI / 2;
    goldRingMesh.position.y = -0.6;
    this.machineGroup.add(goldRingMesh);

    // Base LED Ring
    const ledGeo = new THREE.TorusGeometry(1.3, 0.015, 16, 64);
    this.ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ledMesh = new THREE.Mesh(ledGeo, this.ledMat);
    ledMesh.rotation.x = Math.PI / 2;
    ledMesh.position.y = -0.78;
    this.machineGroup.add(ledMesh);

    // Rear Spine
    const spineGeo = new THREE.CylinderGeometry(0.7, 0.8, 2.4, 32, 1, false, 0, Math.PI * 1.3);
    const spineMesh = new THREE.Mesh(spineGeo, darkChromeMat);
    spineMesh.position.set(0, 0.5, -0.3);
    spineMesh.rotation.y = Math.PI * 0.35;
    this.machineGroup.add(spineMesh);

    // Transparent Chamber
    const chamberGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.4, 48);
    const chamberMesh = new THREE.Mesh(chamberGeo, glassChamberMat);
    chamberMesh.position.set(0, 0.5, 0);
    this.machineGroup.add(chamberMesh);

    // Liquid Mesh
    const liquidGeo = new THREE.CylinderGeometry(0.58, 0.56, 1.0, 36);
    this.liquidMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.82,
      emissive: 0x073d2a,
      emissiveIntensity: 0.6
    });
    this.liquidMesh = new THREE.Mesh(liquidGeo, this.liquidMat);
    this.liquidMesh.position.set(0, 0.3, 0);
    this.machineGroup.add(this.liquidMesh);

    // Bubbles Particle System
    const bubbleCount = 45;
    const bubbleGeo = new THREE.BufferGeometry();
    const bubblePos = new Float32Array(bubbleCount * 3);
    const bubbleSpeeds = new Float32Array(bubbleCount);

    for (let i = 0; i < bubbleCount; i++) {
      const r = Math.random() * 0.45;
      const theta = Math.random() * Math.PI * 2;
      bubblePos[i * 3] = Math.cos(theta) * r;
      bubblePos[i * 3 + 1] = Math.random() * 0.9 - 0.2;
      bubblePos[i * 3 + 2] = Math.sin(theta) * r;
      bubbleSpeeds[i] = 0.005 + Math.random() * 0.012;
    }
    bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePos, 3));

    const bubbleMat = new THREE.PointsMaterial({
      color: 0x8fffe2,
      size: 0.035,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    this.bubbles = new THREE.Points(bubbleGeo, bubbleMat);
    this.bubbles.position.set(0, 0.3, 0);
    this.bubbleSpeeds = bubbleSpeeds;
    this.machineGroup.add(this.bubbles);

    // Top Cap & Pod Bay
    const topCapGeo = new THREE.CylinderGeometry(0.85, 0.75, 0.35, 36);
    const topCapMesh = new THREE.Mesh(topCapGeo, darkChromeMat);
    topCapMesh.position.set(0, 1.35, 0);
    this.machineGroup.add(topCapMesh);

    const podRingGeo = new THREE.TorusGeometry(0.5, 0.03, 16, 48);
    this.podRingMat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
    const podRingMesh = new THREE.Mesh(podRingGeo, this.podRingMat);
    podRingMesh.rotation.x = Math.PI / 2;
    podRingMesh.position.set(0, 1.53, 0);
    this.machineGroup.add(podRingMesh);

    const podGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.25, 32);
    this.podMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.3,
      emissive: 0x10b981,
      emissiveIntensity: 0.3
    });
    const podMesh = new THREE.Mesh(podGeo, this.podMat);
    podMesh.position.set(0, 1.48, 0);
    this.machineGroup.add(podMesh);

    // OLED Digital HUD Display Panel
    this.hudCanvas = document.createElement('canvas');
    this.hudCanvas.width = 512;
    this.hudCanvas.height = 256;
    this.hudCtx = this.hudCanvas.getContext('2d');
    
    this.hudTexture = new THREE.CanvasTexture(this.hudCanvas);
    const hudGeo = new THREE.PlaneGeometry(0.7, 0.35);
    const hudMat = new THREE.MeshBasicMaterial({
      map: this.hudTexture,
      transparent: true,
      opacity: 0.95
    });
    const hudMesh = new THREE.Mesh(hudGeo, hudMat);
    hudMesh.position.set(0, -0.15, 0.66);
    this.machineGroup.add(hudMesh);

    // 3D Dispensing Nozzle
    const nozzleGeo = new THREE.CylinderGeometry(0.08, 0.05, 0.25, 24);
    const nozzleMesh = new THREE.Mesh(nozzleGeo, darkChromeMat);
    nozzleMesh.position.set(0, -0.28, 0.45);
    this.machineGroup.add(nozzleMesh);

    const nozzleTipGeo = new THREE.TorusGeometry(0.055, 0.012, 12, 24);
    const nozzleTipMesh = new THREE.Mesh(nozzleTipGeo, brushedGoldMat);
    nozzleTipMesh.rotation.x = Math.PI / 2;
    nozzleTipMesh.position.set(0, -0.4, 0.45);
    this.machineGroup.add(nozzleTipMesh);

    // 3D Liquid Stream (flows from nozzle downwards)
    const streamGeo = new THREE.CylinderGeometry(0.025, 0.02, 0.4, 16);
    this.streamMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0,
      emissive: 0x10b981,
      emissiveIntensity: 0.85,
      roughness: 0.1
    });
    this.streamMesh = new THREE.Mesh(streamGeo, this.streamMat);
    this.streamMesh.position.set(0, -0.6, 0.45);
    this.streamMesh.visible = false;
    this.machineGroup.add(this.streamMesh);

    // 3D Collection Glass Cup
    this.cupGroup = new THREE.Group();
    this.cupGroup.position.set(0, -0.72, 0.45);

    const cupGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      roughness: 0.08,
      ior: 1.45,
      transmission: 0.9,
      thickness: 0.2
    });

    const cupGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.35, 32, 1, true);
    const cupMesh = new THREE.Mesh(cupGeo, cupGlassMat);
    this.cupGroup.add(cupMesh);

    const cupBaseGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.03, 32);
    const cupBaseMesh = new THREE.Mesh(cupBaseGeo, cupGlassMat);
    cupBaseMesh.position.y = -0.16;
    this.cupGroup.add(cupBaseMesh);

    const cupRimGeo = new THREE.TorusGeometry(0.22, 0.012, 12, 32);
    const cupRimMesh = new THREE.Mesh(cupRimGeo, brushedGoldMat);
    cupRimMesh.rotation.x = Math.PI / 2;
    cupRimMesh.position.y = 0.175;
    this.cupGroup.add(cupRimMesh);

    // Liquid filling inside 3D cup
    const cupLiquidGeo = new THREE.CylinderGeometry(0.20, 0.17, 0.30, 24);
    this.cupLiquidMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.15,
      transparent: true,
      opacity: 0.88,
      emissive: 0x0a4d34,
      emissiveIntensity: 0.5
    });
    this.cupLiquidMesh = new THREE.Mesh(cupLiquidGeo, this.cupLiquidMat);
    this.cupLiquidMesh.position.set(0, -0.02, 0);
    this.cupLiquidMesh.scale.set(1, 0.01, 1);
    this.cupGroup.add(this.cupLiquidMesh);

    this.machineGroup.add(this.cupGroup);

    this.updateHudTexture(85.4, 96.8, 'TULSI GILOY');
  }

  updateHudTexture(temp, synergy, podName) {
    const ctx = this.hudCtx;
    ctx.clearRect(0, 0, 512, 256);

    ctx.fillStyle = 'rgba(8, 14, 11, 0.92)';
    ctx.roundRect(10, 10, 492, 236, 20);
    ctx.fill();

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.lineWidth = 4;
    ctx.roundRect(10, 10, 492, 236, 20);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('iKWATH AI SYSTEM', 30, 50);

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`POD: ${podName}`, 30, 85);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText(`${temp.toFixed(1)}°C`, 30, 155);

    ctx.fillStyle = '#9ae6b4';
    ctx.font = '22px sans-serif';
    ctx.fillText(`SYNERGY: ${synergy.toFixed(1)}%`, 260, 155);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const time = Date.now() * 0.005;
    for (let x = 30; x < 480; x += 10) {
      const y = 200 + Math.sin(x * 0.05 + time) * 12;
      if (x === 30) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    this.hudTexture.needsUpdate = true;
  }

  createFloatingBotanicals() {
    this.botanicalGroup = new THREE.Group();
    this.scene.add(this.botanicalGroup);

    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(0.25, 0.35, 0.0, 0.8);
    leafShape.quadraticCurveTo(-0.25, 0.35, 0, 0);

    const leafGeo = new THREE.ShapeGeometry(leafShape);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.3,
      side: THREE.DoubleSide
    });

    this.leaves = [];
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(
        -2.2 + Math.random() * 2.8,
        -0.2 + Math.random() * 2.0,
        -1.0 + Math.random() * 2.2
      );
      leaf.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      leaf.scale.setScalar(0.7 + Math.random() * 0.5);
      
      leaf.userData = {
        speedY: (Math.random() - 0.5) * 0.003,
        rotSpeed: (Math.random() - 0.5) * 0.015,
        initialY: leaf.position.y
      };

      this.botanicalGroup.add(leaf);
      this.leaves.push(leaf);
    }
  }

  createPollenParticles() {
    const particleCount = 280;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x3eb489,
      size: 0.025,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });

    this.pollen = new THREE.Points(geo, mat);
    this.scene.add(this.pollen);
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;

      if (this.isDragging) {
        const deltaX = e.clientX - this.dragStart.x;
        const deltaY = e.clientY - this.dragStart.y;
        this.rotationOffset.y += deltaX * 0.005;
        this.rotationOffset.x += deltaY * 0.005;
        this.dragStart = { x: e.clientX, y: e.clientY };
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStart = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  setPodTheme(hexColor, name) {
    this.targetColor.set(hexColor);
    this.hudPodName = name;
  }

  setMode(mode) {
    this.mode = mode;
  }

  setStreamActive(isActive) {
    if (this.streamMesh) {
      this.streamMesh.visible = isActive;
      this.streamMat.opacity = isActive ? 0.85 : 0;
    }
  }

  setDispenseProgress(percent) {
    const scaleY = Math.max(0.01, Math.min(1.0, percent / 100));
    if (this.cupLiquidMesh) {
      this.cupLiquidMesh.scale.set(1, scaleY, 1);
    }
    if (this.liquidMesh) {
      this.liquidMesh.scale.y = Math.max(0.15, 1.0 - (scaleY * 0.7));
    }
  }

  setCupDetected3D(isDetected) {
    if (this.cupGroup) {
      this.cupGroup.position.x = isDetected ? 0 : 0.8;
      this.cupGroup.rotation.z = isDetected ? 0 : 0.2;
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const elapsed = this.clock.getElapsedTime();

    this.camera.position.lerp(this.targetCameraPos, 0.04);

    this.activeColor.lerp(this.targetColor, 0.05);
    this.liquidMat.color.copy(this.activeColor);
    this.liquidMat.emissive.copy(this.activeColor).multiplyScalar(0.4);
    if (this.cupLiquidMat) {
      this.cupLiquidMat.color.copy(this.activeColor);
      this.cupLiquidMat.emissive.copy(this.activeColor).multiplyScalar(0.5);
    }
    if (this.streamMat) {
      this.streamMat.color.copy(this.activeColor);
      this.streamMat.emissive.copy(this.activeColor).multiplyScalar(0.85);
    }
    this.ledMat.color.copy(this.activeColor);
    this.emeraldLight.color.copy(this.activeColor);

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    this.machineGroup.rotation.y = (this.currentView === 'twin' ? elapsed * 0.15 : 0) + this.mouse.x * 0.25 + this.rotationOffset.y;
    this.machineGroup.rotation.x = this.mouse.y * 0.15 + this.rotationOffset.x;

    if (this.mode === 'brewing') {
      this.liquidMesh.scale.y = 1.0 + Math.sin(elapsed * 4) * 0.05;
      this.liquidMesh.rotation.y += 0.04;
      this.emeraldLight.intensity = 4.5 + Math.sin(elapsed * 8) * 1.5;
    } else if (this.mode === 'dispensing') {
      if (this.streamMesh && this.streamMesh.visible) {
        this.streamMesh.scale.x = 0.9 + Math.sin(elapsed * 20) * 0.15;
        this.streamMesh.scale.z = 0.9 + Math.cos(elapsed * 20) * 0.15;
      }
      this.emeraldLight.intensity = 4.8 + Math.sin(elapsed * 10) * 1.0;
    } else {
      this.liquidMesh.scale.y = 0.95 + Math.sin(elapsed * 1.5) * 0.02;
      this.liquidMesh.rotation.y += 0.005;
      this.emeraldLight.intensity = 3.0;
    }

    const positions = this.bubbles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3 + 1] += this.bubbleSpeeds[i] * (this.mode === 'brewing' ? 2.5 : 1);
      if (positions[i * 3 + 1] > 0.8) positions[i * 3 + 1] = -0.2;
    }
    this.bubbles.geometry.attributes.position.needsUpdate = true;

    this.leaves.forEach((leaf) => {
      leaf.position.y = leaf.userData.initialY + Math.sin(elapsed + leaf.position.x) * 0.15;
      leaf.rotation.x += leaf.userData.rotSpeed;
      leaf.rotation.y += leaf.userData.rotSpeed * 0.8;
    });

    if (this.pollen) this.pollen.rotation.y = elapsed * 0.02;

    const tempVal = 85.4 + Math.sin(elapsed * 0.5) * 0.8;
    const synVal = 96.8 + Math.cos(elapsed * 0.4) * 0.4;
    this.updateHudTexture(tempVal, synVal, this.hudPodName || 'TULSI GILOY');

    this.renderer.render(this.scene, this.camera);
  }
}
