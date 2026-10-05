import { Scene3D } from './js/scene3d.js';

/**
 * iKWATH Main Application Controller
 * Handles SPA View Navigation (Login ↔ Dashboard ↔ Scanner ↔ Digital Twin ↔ Pod Scanner ↔ AI Recommendation),
 * AI Waveform Canvas, Hardware Telemetry, Smart Pod Verification, and 3D Controls.
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D WebGL Engine
  const scene3d = new Scene3D('webgl-canvas');

  // 2. SPA View Routing Manager
  const viewLogin = document.getElementById('view-login');
  const viewDashboard = document.getElementById('view-dashboard');
  const viewScanner = document.getElementById('view-scanner');
  const viewTwin = document.getElementById('view-twin');
  const viewPodScanner = document.getElementById('view-pod-scanner');
  const viewAiRecommend = document.getElementById('view-ai-recommend');
  const viewPreparation = document.getElementById('view-preparation');
  const viewDispensing = document.getElementById('view-dispensing');
  const viewHistory = document.getElementById('view-history');

  function showView(viewName) {
    [viewLogin, viewDashboard, viewScanner, viewTwin, viewPodScanner, viewAiRecommend, viewPreparation, viewDispensing, viewHistory].forEach((v) => v && v.classList.remove('active'));

    if (viewName === 'dashboard') {
      if (viewDashboard) viewDashboard.classList.add('active');
      scene3d.setView('dashboard');
      showToast('Welcome to iKWATH Intelligent Wellness Ecosystem 🌿');
    } else if (viewName === 'scanner') {
      if (viewScanner) viewScanner.classList.add('active');
      scene3d.setView('scanner');
      resetScannerUI();
      showToast('Scanner Ready: Align machine QR code');
    } else if (viewName === 'twin') {
      if (viewTwin) viewTwin.classList.add('active');
      scene3d.setView('twin');
      showToast('Digital Twin Loaded: iKWATH PRO #IKW-24A8-7392');
    } else if (viewName === 'pod-scanner') {
      if (viewPodScanner) viewPodScanner.classList.add('active');
      scene3d.setView('pod-scanner');
      resetPodScannerUI();
      showToast('Pod Scanner Ready: Align Smart Pod QR code');
    } else if (viewName === 'ai-recommend') {
      if (viewAiRecommend) viewAiRecommend.classList.add('active');
      scene3d.setView('ai-recommend');
      showToast('AI Wellness Engine: Recipe Recommendation Ready 🧠');
    } else if (viewName === 'preparation') {
      if (viewPreparation) viewPreparation.classList.add('active');
      scene3d.setView('preparation');
      scene3d.setMode('brewing');
      startPreparationSimulation();
      showToast('⚡ Automated Kwatha Infusion Started!');
    } else if (viewName === 'dispensing') {
      if (viewDispensing) viewDispensing.classList.add('active');
      scene3d.setView('dispensing');
      resetDispensingUI();
      showToast('💧 Kwatha Ready to Dispense');
    } else if (viewName === 'history') {
      if (viewHistory) viewHistory.classList.add('active');
      scene3d.setView('history');
      showToast('iKWATH — Preparation History Log');
    } else {
      if (viewLogin) viewLogin.classList.add('active');
      scene3d.setView('login');
      showToast('Switched to Login Screen');
    }
  }

  // Logout Button
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) btnLogout.addEventListener('click', () => { showView('login'); playTone(400, 'sine', 0.2); });

  // Navigation Back Buttons
  const btnScannerBack = document.getElementById('btn-scanner-back');
  if (btnScannerBack) btnScannerBack.addEventListener('click', () => { showView('dashboard'); playTone(420, 'sine', 0.2); });

  const btnTwinBack = document.getElementById('btn-twin-back');
  if (btnTwinBack) btnTwinBack.addEventListener('click', () => { showView('scanner'); playTone(420, 'sine', 0.2); });

  const btnPodScannerBack = document.getElementById('btn-pod-scanner-back');
  if (btnPodScannerBack) btnPodScannerBack.addEventListener('click', () => { showView('twin'); playTone(420, 'sine', 0.2); });

  const btnAiRecBack = document.getElementById('btn-ai-rec-back');
  if (btnAiRecBack) btnAiRecBack.addEventListener('click', () => { showView('pod-scanner'); playTone(420, 'sine', 0.2); });

  const btnPrepBack = document.getElementById('btn-prep-back');
  if (btnPrepBack) btnPrepBack.addEventListener('click', () => { stopPreparationSimulation(); showView('ai-recommend'); playTone(420, 'sine', 0.2); });

  // 3. Audio Sound Synthesizer Setup
  let soundEnabled = false;
  let audioCtx = null;

  function playTone(freq = 440, type = 'sine', duration = 0.2) {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  const soundToggle = document.getElementById('sound-toggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundToggle.classList.toggle('active', soundEnabled);
      soundToggle.querySelector('span').textContent = soundEnabled ? 'Audio On' : 'Audio Zen';
      showToast(soundEnabled ? 'Zen Audio Feedback Enabled' : 'Audio Muted');
      if (soundEnabled) playTone(600, 'sine', 0.3);
    });
  }

  // 4. Machine Mode Switcher Pills
  const modeButtons = document.querySelectorAll('.mode-btn');
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      scene3d.setMode(mode);
      playTone(520, 'sine', 0.25);
      showToast(`Machine Mode: ${mode.toUpperCase()}`);
    });
  });

  // 5. Smart Herbal Pod Switcher
  const podPills = document.querySelectorAll('.pod-pill');
  const hudPodVal = document.getElementById('hud-pod-val');
  const dashPodStatus = document.getElementById('dash-pod-status');

  const podConfigs = {
    tulsi: { name: 'Tulsi Giloy Immunity', color: '#10b981' },
    ashwa: { name: 'Ashwagandha Calm', color: '#d4af37' },
    triphala: { name: 'Triphala Detox', color: '#3eb489' },
    brahmi: { name: 'Brahmi Nootropic', color: '#38bdf8' }
  };

  podPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      podPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      const podKey = pill.dataset.pod;
      const config = podConfigs[podKey];
      if (config) {
        scene3d.setPodTheme(config.color, config.name);
        if (hudPodVal) {
          hudPodVal.textContent = config.name;
          hudPodVal.style.color = config.color;
        }
        if (dashPodStatus) {
          dashPodStatus.textContent = config.name;
          dashPodStatus.style.color = config.color;
        }
        playTone(640, 'triangle', 0.3);
        showToast(`Loaded Pod: ${config.name}`);
      }
    });
  });

  // 6. Password Show/Hide Toggle
  const togglePasswordBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('user-password');
  const toggleText = document.getElementById('toggle-text');

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      toggleText.textContent = isPassword ? 'Hide' : 'Show';
      playTone(480, 'sine', 0.1);
    });
  }

  // 7. Login Submission Flow
  const loginForm = document.getElementById('login-form');
  const btnSignin = document.getElementById('btn-signin');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      btnSignin.disabled = true;
      btnSignin.querySelector('.btn-text').textContent = 'VERIFYING...';
      playTone(580, 'sine', 0.4);

      setTimeout(() => {
        btnSignin.disabled = false;
        btnSignin.querySelector('.btn-text').textContent = 'SIGN IN';
        playTone(880, 'sine', 0.5);
        showView('dashboard');
      }, 1000);
    });
  }

  const btnGoogle = document.getElementById('btn-google');
  if (btnGoogle) {
    btnGoogle.addEventListener('click', () => {
      playTone(450, 'sine', 0.2);
      showToast('Authenticated via Google SSO!');
      setTimeout(() => showView('dashboard'), 800);
    });
  }

  const btnGuest = document.getElementById('btn-guest');
  if (btnGuest) btnGuest.addEventListener('click', () => { playTone(520, 'sine', 0.2); showView('dashboard'); });

  // 8. AI Voice Waveform Canvas Animation
  const waveformCanvas = document.getElementById('ai-waveform-canvas');
  let isVoiceActive = false;
  if (waveformCanvas) {
    const ctx = waveformCanvas.getContext('2d');
    function drawWaveform() {
      ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = isVoiceActive ? '#d4af37' : '#10b981';

      ctx.beginPath();
      const time = Date.now() * 0.008;
      const amp = isVoiceActive ? 12 : 4;
      for (let x = 0; x < waveformCanvas.width; x += 4) {
        const y = 18 + Math.sin(x * 0.1 + time) * amp * Math.cos(x * 0.05);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      requestAnimationFrame(drawWaveform);
    }
    drawWaveform();
  }

  const btnVoiceAi = document.getElementById('btn-voice-ai');
  if (btnVoiceAi) {
    btnVoiceAi.addEventListener('click', () => {
      isVoiceActive = !isVoiceActive;
      btnVoiceAi.classList.toggle('active', isVoiceActive);
      playTone(isVoiceActive ? 750 : 350, 'sine', 0.25);
      showToast(isVoiceActive ? 'Listening to voice prompt... 🎙️' : 'Voice input stopped');
    });
  }

  const btnAskAi = document.getElementById('btn-ask-ai');
  const aiPromptInput = document.getElementById('ai-prompt-input');
  if (btnAskAi && aiPromptInput) {
    btnAskAi.addEventListener('click', () => {
      const query = aiPromptInput.value.trim() || 'General Wellness Boost';
      playTone(680, 'sine', 0.3);
      showToast(`Prakriti AI analyzing query: "${query}"...`);
      showView('ai-recommend');
    });
  }

  document.querySelectorAll('.chip-btn').forEach((chip) => {
    chip.addEventListener('click', () => {
      const query = chip.dataset.query;
      if (aiPromptInput) aiPromptInput.value = query;
      playTone(540, 'sine', 0.2);
      showToast(`AI Suggestion Selected: ${chip.textContent.trim()}`);
      showView('ai-recommend');
    });
  });

  // 9. SMART MACHINE SCANNER LOGIC
  const scannerFrame = document.getElementById('scanner-frame');
  const scannerStatusMsg = document.getElementById('scanner-status-msg');
  const scanSuccessCard = document.getElementById('scan-success-card');
  const btnSimScan = document.getElementById('btn-sim-scan');
  const btnViewMachine = document.getElementById('btn-view-machine');
  const btnScanAgain = document.getElementById('btn-scan-again');

  function resetScannerUI() {
    if (scannerFrame) scannerFrame.classList.remove('verified');
    if (scanSuccessCard) scanSuccessCard.classList.remove('active');
    if (scannerStatusMsg) scannerStatusMsg.textContent = 'Searching for iKWATH device...';
  }

  function triggerScanVerification(deviceId = 'IKW-24A8-7392') {
    playTone(920, 'sine', 0.35);
    scene3d.triggerScanSuccessAnimation();

    if (scannerFrame) scannerFrame.classList.add('verified');
    if (scannerStatusMsg) scannerStatusMsg.textContent = `Device Identified: ${deviceId}`;

    setTimeout(() => {
      if (scanSuccessCard) scanSuccessCard.classList.add('active');
      showToast(`✓ iKWATH PRO Machine #${deviceId} Verified!`);
    }, 600);
  }

  if (btnSimScan) btnSimScan.addEventListener('click', () => triggerScanVerification());
  if (btnScanAgain) btnScanAgain.addEventListener('click', () => resetScannerUI());

  if (btnViewMachine) btnViewMachine.addEventListener('click', () => { showView('twin'); playTone(720, 'sine', 0.3); });

  const btnScanHero = document.getElementById('btn-scan-ikwath-hero');
  const btnFloatingScan = document.getElementById('btn-floating-scan');
  if (btnScanHero) btnScanHero.addEventListener('click', () => showView('scanner'));
  if (btnFloatingScan) btnFloatingScan.addEventListener('click', () => showView('scanner'));

  // Manual Modal
  const btnManualId = document.getElementById('btn-manual-id');
  const modalManualId = document.getElementById('modal-manual-id');
  const closeManualModal = document.getElementById('close-manual-modal');
  const btnSubmitManualId = document.getElementById('btn-submit-manual-id');
  const btnUploadQr = document.getElementById('btn-upload-qr');

  if (btnManualId && modalManualId) {
    btnManualId.addEventListener('click', () => { modalManualId.classList.add('active'); playTone(480, 'sine', 0.2); });
    if (closeManualModal) closeManualModal.addEventListener('click', () => modalManualId.classList.remove('active'));
  }

  if (btnUploadQr) {
    btnUploadQr.addEventListener('click', () => {
      playTone(520, 'sine', 0.25);
      showToast('Simulating QR image upload... Found code IKW-24A8-7392');
      triggerScanVerification('IKW-24A8-7392');
    });
  }

  if (btnSubmitManualId && modalManualId) {
    btnSubmitManualId.addEventListener('click', () => {
      const inputVal = document.getElementById('manual-device-input').value.trim() || 'IKW-24A8-7392';
      modalManualId.classList.remove('active');
      triggerScanVerification(inputVal);
    });
  }

  // 10. MACHINE DIGITAL TWIN INTERACTIVITY
  const twinStatusBadge = document.getElementById('twin-status-badge');
  const twinTempVal = document.getElementById('twin-temp-val');
  const twinTempSub = document.getElementById('twin-temp-sub');
  const twinWaterVal = document.getElementById('twin-water-val');
  const twinWaterSub = document.getElementById('twin-water-sub');
  const twinProcessVal = document.getElementById('twin-process-val');
  const twinProcessSub = document.getElementById('twin-process-sub');

  const meterTempFill = document.getElementById('meter-temp-fill');
  const meterWaterFill = document.getElementById('meter-water-fill');
  const meterProcessFill = document.getElementById('meter-process-fill');

  const statePills = document.querySelectorAll('.state-pill');
  statePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      statePills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      const state = pill.dataset.state;
      scene3d.setTwinStatusState(state);

      if (state === 'ready') {
        if (twinStatusBadge) { twinStatusBadge.className = 'twin-status-pill-badge green'; twinStatusBadge.textContent = '● ONLINE'; }
        if (twinTempVal) twinTempVal.textContent = '72°C';
        if (twinTempSub) twinTempSub.textContent = 'Optimal';
        if (twinWaterVal) twinWaterVal.textContent = '84%';
        if (twinProcessVal) twinProcessVal.textContent = 'Ready';
        if (twinProcessSub) twinProcessSub.textContent = 'Idle';

        if (meterTempFill) { meterTempFill.style.width = '72%'; meterTempFill.className = 'meter-bar-fill green'; }
        if (meterWaterFill) { meterWaterFill.style.width = '84%'; meterWaterFill.className = 'meter-bar-fill green'; }
        if (meterProcessFill) { meterProcessFill.style.width = '25%'; meterProcessFill.className = 'meter-bar-fill green'; }
        playTone(520, 'sine', 0.2);
        showToast('Digital Twin State: 🟢 Machine Ready');

      } else if (state === 'preparing') {
        if (twinStatusBadge) { twinStatusBadge.className = 'twin-status-pill-badge amber'; twinStatusBadge.textContent = '● INFUSING'; }
        if (twinTempVal) twinTempVal.textContent = '88°C';
        if (twinTempSub) twinTempSub.textContent = 'Heating';
        if (twinWaterVal) twinWaterVal.textContent = '78%';
        if (twinProcessVal) twinProcessVal.textContent = 'Brewing';
        if (twinProcessSub) twinProcessSub.textContent = 'Active 6m';

        if (meterTempFill) { meterTempFill.style.width = '88%'; meterTempFill.className = 'meter-bar-fill gold'; }
        if (meterWaterFill) { meterWaterFill.style.width = '78%'; meterWaterFill.className = 'meter-bar-fill gold'; }
        if (meterProcessFill) { meterProcessFill.style.width = '75%'; meterProcessFill.className = 'meter-bar-fill gold'; }
        playTone(680, 'triangle', 0.3);
        showToast('Digital Twin State: 🟡 Kwatha Preparation in Progress');

      } else if (state === 'attention') {
        if (twinStatusBadge) { twinStatusBadge.className = 'twin-status-pill-badge red'; twinStatusBadge.textContent = '● ATTENTION'; }
        if (twinTempVal) twinTempVal.textContent = '95°C';
        if (twinTempSub) twinTempSub.textContent = 'High Temp';
        if (twinWaterVal) twinWaterVal.textContent = '12%';
        if (twinWaterSub) twinWaterSub.textContent = 'Low Water';
        if (twinProcessVal) twinProcessVal.textContent = 'Paused';
        if (twinProcessSub) twinProcessSub.textContent = 'Refill Req';

        if (meterTempFill) { meterTempFill.style.width = '95%'; meterTempFill.className = 'meter-bar-fill red'; }
        if (meterWaterFill) { meterWaterFill.style.width = '12%'; meterWaterFill.className = 'meter-bar-fill red'; }
        if (meterProcessFill) { meterProcessFill.style.width = '10%'; meterProcessFill.className = 'meter-bar-fill red'; }
        playTone(320, 'square', 0.3);
        showToast('Digital Twin State: 🔴 Machine Requires Attention');

      } else if (state === 'offline') {
        if (twinStatusBadge) { twinStatusBadge.className = 'twin-status-pill-badge slate'; twinStatusBadge.textContent = '⚫ OFFLINE'; }
        if (twinTempVal) twinTempVal.textContent = '--°C';
        if (twinWaterVal) twinWaterVal.textContent = '--%';
        if (twinProcessVal) twinProcessVal.textContent = 'Offline';

        if (meterTempFill) { meterTempFill.style.width = '0%'; }
        if (meterWaterFill) { meterWaterFill.style.width = '0%'; }
        if (meterProcessFill) { meterProcessFill.style.width = '0%'; }
        playTone(280, 'sine', 0.2);
        showToast('Digital Twin State: ⚫ Machine Offline');
      }
    });
  });

  const btnTwinScanPod = document.getElementById('btn-twin-scan-pod');
  if (btnTwinScanPod) btnTwinScanPod.addEventListener('click', () => { showView('pod-scanner'); playTone(620, 'sine', 0.25); });

  const btnTwinDetails = document.getElementById('btn-twin-details');
  const modalSpecs = document.getElementById('modal-specs');
  if (btnTwinDetails && modalSpecs) btnTwinDetails.addEventListener('click', () => { modalSpecs.classList.add('active'); playTone(480, 'sine', 0.2); });

  const btnTwinConnect = document.getElementById('btn-twin-connect');
  if (btnTwinConnect) btnTwinConnect.addEventListener('click', () => { playTone(740, 'sine', 0.35); showToast('Initiating encrypted owner pairing with iKWATH PRO #IKW-24A8-7392...'); });

  // 11. SMART POD SCANNER INTERACTIVITY
  const podScannerFrame = document.getElementById('pod-scanner-frame');
  const podStatusMsg = document.getElementById('pod-status-msg');
  const podSuccessCard = document.getElementById('pod-success-card');
  const btnSimPodScan = document.getElementById('btn-sim-pod-scan');
  const btnContinuePrep = document.getElementById('btn-continue-prep');
  const btnScanAnotherPod = document.getElementById('btn-scan-another-pod');
  const linkPodAskAi = document.getElementById('link-pod-ask-ai');

  function resetPodScannerUI() {
    if (podScannerFrame) podScannerFrame.classList.remove('verified');
    if (podSuccessCard) podSuccessCard.classList.remove('active');
    if (podStatusMsg) podStatusMsg.textContent = '● Scanning Smart Pod...';
  }

  function triggerPodScanVerification(podId = 'POD-IM-240829') {
    playTone(980, 'sine', 0.4);
    scene3d.setPodTheme('#10b981', 'Tulsi Giloy Immunity');
    scene3d.triggerScanSuccessAnimation();

    if (podScannerFrame) podScannerFrame.classList.add('verified');
    if (podStatusMsg) podStatusMsg.textContent = `Smart Pod Verified: ${podId}`;

    setTimeout(() => {
      if (podSuccessCard) podSuccessCard.classList.add('active');
      showToast(`✓ Authentic Smart Pod ${podId} Verified!`);
    }, 600);
  }

  if (btnSimPodScan) btnSimPodScan.addEventListener('click', () => triggerPodScanVerification());
  if (btnScanAnotherPod) btnScanAnotherPod.addEventListener('click', () => resetPodScannerUI());

  if (btnContinuePrep) {
    btnContinuePrep.addEventListener('click', () => {
      showView('ai-recommend');
      playTone(780, 'sine', 0.35);
    });
  }

  if (linkPodAskAi) linkPodAskAi.addEventListener('click', () => { showView('ai-recommend'); playTone(600, 'sine', 0.2); });

  const btnManualPodId = document.getElementById('btn-manual-pod-id');
  if (btnManualPodId) btnManualPodId.addEventListener('click', () => triggerPodScanVerification('POD-IM-240829'));

  const btnUploadPodQr = document.getElementById('btn-upload-pod-qr');
  if (btnUploadPodQr) btnUploadPodQr.addEventListener('click', () => triggerPodScanVerification('POD-IM-240829'));

  // 12. AI RECIPE RECOMMENDATION INTERACTIVITY
  const choicePills = document.querySelectorAll('.choice-pill');
  const recHeadlineTitle = document.getElementById('rec-headline-title');
  const recSubtitleDesc = document.getElementById('rec-subtitle-desc');
  const recFormulationVal = document.getElementById('rec-formulation-val');
  const recPurposeVal = document.getElementById('rec-purpose-val');
  const recIngredientsVal = document.getElementById('rec-ingredients-val');
  const recTimeVal = document.getElementById('rec-time-val');
  const recExplanationText = document.getElementById('rec-explanation-text');
  const confirmRecipeTitle = document.getElementById('confirm-recipe-title');

  const goalDataMap = {
    immunity: {
      title: 'IMMUNITY SUPPORT KWATHA',
      subtitle: 'Standardized traditional decoction for daily immunity support.',
      formulation: 'Immunity Support Kwatha',
      purpose: 'General wellness support',
      ingredients: 'Tulsi • Ginger • Black Pepper',
      time: '~8 Minutes',
      explanation: 'This formulation matches your selected wellness goal (Immunity Support) and is available in your verified iKWATH pod.',
      color: '#10b981'
    },
    digestion: {
      title: 'SHUNTHI AGNI DECOCTION',
      subtitle: 'Ayurvedic herbal brew for metabolic digestion support.',
      formulation: 'Shunthi Agni Brew',
      purpose: 'Digestive comfort & Agni support',
      ingredients: 'Ginger • Cumin • Fennel',
      time: '~10 Minutes',
      explanation: 'Optimizes metabolic digestion (Agni) using bio-available Shunthi and Cumin extracts.',
      color: '#d4af37'
    },
    relaxation: {
      title: 'ASHWAGANDHA NIDRA KWATH',
      subtitle: 'Calming botanical blend for stress relief and relaxation.',
      formulation: 'Ashwagandha Nidra Brew',
      purpose: 'Relaxation & stress balance',
      ingredients: 'Ashwagandha • Tulsi • Cardamom',
      time: '~12 Minutes',
      explanation: 'Helps balance nervous system energy (Vata pacifying) for deep evening relaxation.',
      color: '#38bdf8'
    },
    respiratory: {
      title: 'PRANAYAMA SHIELD KWATHA',
      subtitle: 'Soothing traditional decoction for respiratory clarity.',
      formulation: 'Pranayama Shield Brew',
      purpose: 'Respiratory wellness support',
      ingredients: 'Vasaka • Mulethi • Pipali',
      time: '~9 Minutes',
      explanation: 'Supports clear bronchial breathing (Kapha balancing) with standardized Vasaka and Mulethi extracts.',
      color: '#3eb489'
    },
    daily: {
      title: 'TRIDOSHA BALANCE HARMONY',
      subtitle: 'Balanced daily decoction for all prakriti constitution types.',
      formulation: 'Tridosha Harmony Kwatha',
      purpose: 'Daily Ayurvedic balance',
      ingredients: 'Triphala • Giloy • Cardamom',
      time: '~8 Minutes',
      explanation: 'Harmonizes Vata, Pitta, and Kapha doshas for consistent everyday vitality.',
      color: '#f5cf66'
    }
  };

  choicePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      choicePills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      const goalKey = pill.dataset.goal;
      const data = goalDataMap[goalKey];

      if (data) {
        if (recHeadlineTitle) recHeadlineTitle.textContent = data.title;
        if (recSubtitleDesc) recSubtitleDesc.textContent = data.subtitle;
        if (recFormulationVal) recFormulationVal.textContent = data.formulation;
        if (recPurposeVal) recPurposeVal.textContent = data.purpose;
        if (recIngredientsVal) recIngredientsVal.textContent = data.ingredients;
        if (recTimeVal) recTimeVal.textContent = data.time;
        if (recExplanationText) recExplanationText.textContent = data.explanation;
        if (confirmRecipeTitle) confirmRecipeTitle.textContent = data.formulation;

        scene3d.setPodTheme(data.color, data.formulation);
        playTone(650, 'sine', 0.2);
        showToast(`Selected Goal: ${pill.textContent.trim()}`);
      }
    });
  });

  // Modal & Confirmation Flow
  const btnStartPrep = document.getElementById('btn-start-prep');
  const modalConfirmPrep = document.getElementById('modal-confirm-prep');
  const btnConfirmStartPrep = document.getElementById('btn-confirm-start-prep');
  const btnCancelConfirmPrep = document.getElementById('btn-cancel-confirm-prep');

  if (btnStartPrep && modalConfirmPrep) {
    btnStartPrep.addEventListener('click', () => {
      modalConfirmPrep.classList.add('active');
      playTone(750, 'sine', 0.3);
    });
  }

  if (btnCancelConfirmPrep && modalConfirmPrep) {
    btnCancelConfirmPrep.addEventListener('click', () => {
      modalConfirmPrep.classList.remove('active');
      playTone(400, 'sine', 0.15);
    });
  }

  if (btnConfirmStartPrep && modalConfirmPrep) {
    btnConfirmStartPrep.addEventListener('click', () => {
      modalConfirmPrep.classList.remove('active');
      playTone(920, 'sine', 0.5);
      showView('preparation');
    });
  }

  const btnChooseAnother = document.getElementById('btn-choose-another');
  if (btnChooseAnother) {
    btnChooseAnother.addEventListener('click', () => {
      showView('dashboard');
      playTone(480, 'sine', 0.2);
    });
  }

  const btnAskAiQuick = document.getElementById('btn-ask-ai-quick');
  if (btnAskAiQuick) {
    btnAskAiQuick.addEventListener('click', () => {
      playTone(680, 'sine', 0.25);
      showToast('Ask iKWATH: "Why did you recommend this formulation?"');
    });
  }

  // 13. AUTOMATED KWATHA PREPARATION SIMULATION ENGINE
  let prepInterval = null;
  let prepProgress = 0;
  let prepIsPaused = false;
  let prepTotalSeconds = 480; // 8 minutes
  let prepElapsedSeconds = 0;
  let prepStartTime = null;

  const stageConfig = [
    { name: 'Pod Verified', threshold: 0, label: 'VERIFIED' },
    { name: 'Water Added', threshold: 8, label: 'FILLING' },
    { name: 'Heating', threshold: 20, label: 'HEATING' },
    { name: 'Extraction', threshold: 38, label: 'EXTRACTION' },
    { name: 'Reduction', threshold: 72, label: 'REDUCTION' },
    { name: 'Ready', threshold: 95, label: 'READY' }
  ];

  const aiMessages = [
    'Preparation is progressing normally.',
    'Optimal temperature reached. Botanical extraction active.',
    'Herbal compounds infusing into the water matrix.',
    'Liquid concentration progressing on schedule.',
    'Synergy levels are within expected range.',
    'Turbidity sensors detecting ideal herbal density.',
    'Approaching final reduction phase.',
    'All quality checkpoints passed successfully.'
  ];

  // DOM Elements
  const ringProgress = document.getElementById('ring-progress');
  const ringGlow = document.getElementById('ring-glow');
  const ringPercent = document.getElementById('ring-percent');
  const ringStageLabel = document.getElementById('ring-stage-label');
  const prepTimeRemaining = document.getElementById('prep-time-remaining');
  const prepTimeStarted = document.getElementById('prep-time-started');
  const prepTimeEst = document.getElementById('prep-time-est');
  const sensorTemp = document.getElementById('sensor-temp');
  const sensorWater = document.getElementById('sensor-water');
  const sensorPressure = document.getElementById('sensor-pressure');
  const sensorFlow = document.getElementById('sensor-flow');
  const sensorTempBar = document.getElementById('sensor-temp-bar');
  const sensorWaterBar = document.getElementById('sensor-water-bar');
  const sensorPressureBar = document.getElementById('sensor-pressure-bar');
  const sensorFlowBar = document.getElementById('sensor-flow-bar');
  const sensorMachineStatus = document.getElementById('sensor-machine-status');
  const aiBubbleMsg = document.getElementById('ai-bubble-msg');
  const prepControlsActive = document.getElementById('prep-controls-active');
  const prepCompletionSection = document.getElementById('prep-completion-section');
  const prepStagesTimeline = document.getElementById('prep-stages-timeline');
  const prepHeaderTitle = document.getElementById('prep-header-title');
  const prepHeaderSub = document.getElementById('prep-header-sub');

  const circumference = 2 * Math.PI * 115; // ~722.6

  function setRingProgress(pct) {
    const offset = circumference - (pct / 100) * circumference;
    if (ringProgress) ringProgress.setAttribute('stroke-dashoffset', offset);
    if (ringGlow) ringGlow.setAttribute('stroke-dashoffset', offset);
    if (ringPercent) ringPercent.textContent = Math.round(pct);
  }

  function formatTime(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function formatClockTime(date) {
    let h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  function getCurrentStageIndex(pct) {
    let idx = 0;
    for (let i = stageConfig.length - 1; i >= 0; i--) {
      if (pct >= stageConfig[i].threshold) { idx = i; break; }
    }
    return idx;
  }

  function updateTimeline(stageIdx) {
    if (!prepStagesTimeline) return;
    const stages = prepStagesTimeline.querySelectorAll('.prep-stage');
    stages.forEach((s, i) => {
      s.classList.remove('done', 'active');
      const indicator = s.querySelector('.stage-indicator');
      if (i < stageIdx) {
        s.classList.add('done');
        indicator.innerHTML = '<span class="stage-check">✓</span>';
      } else if (i === stageIdx) {
        s.classList.add('active');
        indicator.innerHTML = '<span class="stage-pulse-dot"></span>';
      } else {
        indicator.innerHTML = '<span class="stage-circle"></span>';
      }
    });
  }

  function updateSensors(pct) {
    // Temperature: ramps up 25 → 85°C then stays
    const temp = pct < 20 ? (25 + (pct / 20) * 60).toFixed(0) : (85 + Math.sin(pct * 0.1) * 3).toFixed(0);
    if (sensorTemp) sensorTemp.textContent = `${temp}°C`;
    if (sensorTempBar) sensorTempBar.style.width = `${Math.min(100, Number(temp))}%`;

    // Water level: decreases as preparation progresses
    const water = Math.max(20, 100 - pct * 0.7 + Math.sin(pct * 0.15) * 3).toFixed(0);
    if (sensorWater) sensorWater.textContent = `${water}%`;
    if (sensorWaterBar) sensorWaterBar.style.width = `${water}%`;

    // Pressure
    if (sensorPressure) sensorPressure.textContent = pct < 70 ? 'Normal' : 'Optimal';
    if (sensorPressureBar) sensorPressureBar.style.width = `${45 + pct * 0.4}%`;

    // Flow
    if (sensorFlow) {
      sensorFlow.textContent = pct >= 95 ? 'Settling' : pct >= 20 ? 'Active' : 'Starting';
    }
    if (sensorFlowBar) sensorFlowBar.style.width = `${pct < 95 ? 70 + Math.sin(pct * 0.2) * 15 : 20}%`;

    // Machine status
    if (sensorMachineStatus) sensorMachineStatus.textContent = pct >= 100 ? 'Complete ✓' : 'Optimal ✓';
  }

  function startPreparationSimulation() {
    stopPreparationSimulation();

    prepProgress = 0;
    prepElapsedSeconds = 0;
    prepIsPaused = false;
    prepStartTime = new Date();

    // Set start/est times
    if (prepTimeStarted) prepTimeStarted.textContent = formatClockTime(prepStartTime);
    const estEnd = new Date(prepStartTime.getTime() + prepTotalSeconds * 1000);
    if (prepTimeEst) prepTimeEst.textContent = formatClockTime(estEnd);

    // Reset UI
    if (prepControlsActive) prepControlsActive.style.display = '';
    if (prepCompletionSection) prepCompletionSection.style.display = 'none';
    if (prepHeaderTitle) prepHeaderTitle.textContent = 'Preparing Kwatha';
    if (prepHeaderSub) prepHeaderSub.textContent = 'Automated infusion in progress';

    const btnPausePrep = document.getElementById('btn-pause-prep');
    if (btnPausePrep) {
      btnPausePrep.querySelector('.btn-text').textContent = 'Pause Preparation';
    }

    setRingProgress(0);
    updateTimeline(0);

    // Simulate at ~30Hz tick for smooth visuals, but advance time realistically
    // We use a 2x speed multiplier so the 8-minute cycle completes in 4 real minutes for demo
    const speedMultiplier = 2;

    prepInterval = setInterval(() => {
      if (prepIsPaused) return;

      prepElapsedSeconds += 1 * speedMultiplier;
      prepProgress = Math.min(100, (prepElapsedSeconds / prepTotalSeconds) * 100);

      setRingProgress(prepProgress);

      const remainSec = Math.max(0, prepTotalSeconds - prepElapsedSeconds);
      if (prepTimeRemaining) prepTimeRemaining.textContent = formatTime(Math.round(remainSec));

      const stageIdx = getCurrentStageIndex(prepProgress);
      if (ringStageLabel) ringStageLabel.textContent = stageConfig[stageIdx].label;
      updateTimeline(stageIdx);
      updateSensors(prepProgress);

      // Rotate AI messages
      if (aiBubbleMsg && prepElapsedSeconds % 30 < 1) {
        const msgIdx = Math.floor((prepElapsedSeconds / 30) % aiMessages.length);
        aiBubbleMsg.textContent = aiMessages[msgIdx];
      }

      // Completion
      if (prepProgress >= 100) {
        triggerPreparationComplete();
      }
    }, 1000);
  }

  function stopPreparationSimulation() {
    if (prepInterval) {
      clearInterval(prepInterval);
      prepInterval = null;
    }
    scene3d.setMode('standby');
  }

  function triggerPreparationComplete() {
    stopPreparationSimulation();
    prepProgress = 100;
    setRingProgress(100);

    if (ringStageLabel) ringStageLabel.textContent = 'READY';
    updateTimeline(5);
    updateSensors(100);

    if (prepHeaderTitle) prepHeaderTitle.textContent = '✓ Kwatha Ready';
    if (prepHeaderSub) prepHeaderSub.textContent = 'Preparation complete';
    if (prepTimeRemaining) prepTimeRemaining.textContent = '00:00';
    if (aiBubbleMsg) aiBubbleMsg.textContent = 'Preparation complete. Ready for dispensing.';

    // Hide active controls, show completion
    if (prepControlsActive) prepControlsActive.style.display = 'none';
    if (prepCompletionSection) prepCompletionSection.style.display = '';

    scene3d.setMode('dispensing');
    scene3d.triggerScanSuccessAnimation();
    playTone(880, 'sine', 0.6);
    showToast('✓ KWATHA READY — Your preparation is complete!');
  }

  // Pause / Resume
  const btnPausePrep = document.getElementById('btn-pause-prep');
  if (btnPausePrep) {
    btnPausePrep.addEventListener('click', () => {
      prepIsPaused = !prepIsPaused;
      const btnText = btnPausePrep.querySelector('.btn-text');
      if (prepIsPaused) {
        btnText.textContent = 'Resume Preparation';
        scene3d.setMode('standby');
        playTone(380, 'sine', 0.2);
        showToast('⏸ Preparation Paused');
      } else {
        btnText.textContent = 'Pause Preparation';
        scene3d.setMode('brewing');
        playTone(580, 'sine', 0.2);
        showToast('▶ Preparation Resumed');
      }
    });
  }

  // Cancel with confirmation
  const btnCancelPrep = document.getElementById('btn-cancel-prep');
  const modalCancelPrep = document.getElementById('modal-cancel-prep');
  const btnConfirmCancelPrep = document.getElementById('btn-confirm-cancel-prep');
  const btnDismissCancelModal = document.getElementById('btn-dismiss-cancel-modal');

  if (btnCancelPrep && modalCancelPrep) {
    btnCancelPrep.addEventListener('click', () => {
      modalCancelPrep.classList.add('active');
      playTone(350, 'sine', 0.2);
    });
  }

  if (btnDismissCancelModal && modalCancelPrep) {
    btnDismissCancelModal.addEventListener('click', () => {
      modalCancelPrep.classList.remove('active');
      playTone(480, 'sine', 0.15);
    });
  }

  if (btnConfirmCancelPrep && modalCancelPrep) {
    btnConfirmCancelPrep.addEventListener('click', () => {
      modalCancelPrep.classList.remove('active');
      stopPreparationSimulation();
      showView('dashboard');
      playTone(320, 'square', 0.3);
      showToast('✕ Preparation Cancelled');
    });
  }

  // Dispense Now (from Preparation View)
  const btnDispenseNow = document.getElementById('btn-dispense-now');
  if (btnDispenseNow) {
    btnDispenseNow.addEventListener('click', () => {
      showView('dispensing');
      playTone(720, 'sine', 0.4);
    });
  }

  // Return to Home from completion
  const btnPrepGoHome = document.getElementById('btn-prep-go-home');
  if (btnPrepGoHome) {
    btnPrepGoHome.addEventListener('click', () => {
      scene3d.setMode('standby');
      showView('dashboard');
      playTone(480, 'sine', 0.2);
    });
  }

  // AI Detail button
  const btnAiPrepDetails = document.getElementById('btn-ai-prep-details');
  if (btnAiPrepDetails) {
    btnAiPrepDetails.addEventListener('click', () => {
      playTone(600, 'sine', 0.2);
      showToast('AI Analysis: Temperature stable at target. Botanical compound extraction rate: 94.2%. Expected completion on schedule.');
    });
  }

  // 14. KWATHA DISPENSING VIEW INTERACTIVITY & SAFETY MONITORING
  const btnDispenseBack = document.getElementById('btn-dispense-back');
  if (btnDispenseBack) {
    btnDispenseBack.addEventListener('click', () => {
      showView('preparation');
      playTone(420, 'sine', 0.2);
    });
  }

  const btnDispenseHelp = document.getElementById('btn-dispense-help');
  if (btnDispenseHelp) {
    btnDispenseHelp.addEventListener('click', () => {
      playTone(520, 'sine', 0.2);
      showToast('Place your cup below the dispenser and ensure it remains in position until dispensing completes.');
    });
  }

  // Dispensing Safety & Cup Detection State Variables
  let glassDetected = true;
  let isDispensingActive = false;
  let isDispensingPaused = false;
  let dispenseProgress = 0;
  let dispensingInterval = null;

  const glassStatusTitle = document.getElementById('glass-status-title');
  const glassStatusText = document.getElementById('glass-status-text');
  const glassStatusContainer = document.getElementById('glass-status');
  const toggleCupBtn = document.getElementById('btn-toggle-cup');
  const toggleCupLabel = document.getElementById('toggle-cup-label');
  const safetyStatusText = document.getElementById('safety-status');
  const dispenseFlowVal = document.getElementById('dispense-flow-val');
  const glassStatusPill = document.getElementById('glass-status-pill');
  const dispensingLiveTitle = document.getElementById('dispensing-live-title');

  // Toggle Glass Detection Simulator
  if (toggleCupBtn) {
    toggleCupBtn.addEventListener('click', () => {
      glassDetected = !glassDetected;
      scene3d.setCupDetected3D(glassDetected);

      if (glassDetected) {
        if (glassStatusTitle) glassStatusTitle.textContent = '✓ Glass Detected';
        if (glassStatusText) glassStatusText.textContent = 'Cup positioned correctly';
        if (toggleCupLabel) toggleCupLabel.textContent = 'Simulate Cup Removal';
        if (glassStatusContainer) glassStatusContainer.classList.remove('warning');
        if (safetyStatusText) {
          safetyStatusText.textContent = 'All systems normal ✓';
          safetyStatusText.className = 'status-indicator success';
        }
        if (glassStatusPill) glassStatusPill.textContent = 'Detected ✓';

        showToast('✓ Cup detected! Position verified.');
        playTone(620, 'sine', 0.25);

        // Resume dispensing if it was paused due to cup removal
        if (isDispensingActive && isDispensingPaused) {
          isDispensingPaused = false;
          const liquidStream = document.getElementById('liquid-stream');
          if (liquidStream) liquidStream.classList.add('active');
          scene3d.setStreamActive(true);

          if (dispensingLiveTitle) dispensingLiveTitle.textContent = 'DISPENSING...';
          if (dispenseFlowVal) {
            dispenseFlowVal.textContent = 'Active';
            dispenseFlowVal.className = 'pill-value green';
          }
          showToast('▶ Cup re-positioned. Dispensing resumed...');
          startDispenseTimer();
        }
      } else {
        if (glassStatusTitle) glassStatusTitle.textContent = '⚠ Cup Not Detected';
        if (glassStatusText) glassStatusText.textContent = 'Please reposition the cup to continue';
        if (toggleCupLabel) toggleCupLabel.textContent = 'Reposition Cup';
        if (glassStatusContainer) glassStatusContainer.classList.add('warning');
        if (safetyStatusText) {
          safetyStatusText.textContent = '⚠ Cup missing! Dispensing paused';
          safetyStatusText.className = 'status-indicator warning';
        }
        if (glassStatusPill) glassStatusPill.textContent = 'Missing ⚠';

        showToast('⚠ Cup not detected! Reposition cup below dispenser.', 'warning');
        playTone(320, 'square', 0.4);

        // Pause dispensing immediately if cup is removed during active dispensing
        if (isDispensingActive && !isDispensingPaused) {
          isDispensingPaused = true;
          if (dispensingInterval) clearInterval(dispensingInterval);

          const liquidStream = document.getElementById('liquid-stream');
          if (liquidStream) liquidStream.classList.remove('active');
          scene3d.setStreamActive(false);

          if (dispensingLiveTitle) dispensingLiveTitle.textContent = '⚠ DISPENSING PAUSED';
          if (dispenseFlowVal) {
            dispenseFlowVal.textContent = 'Paused (No Cup)';
            dispenseFlowVal.className = 'pill-value warm';
          }
        }
      }
    });
  }

  // Reset Dispensing View UI
  function resetDispensingUI() {
    isDispensingActive = false;
    isDispensingPaused = false;
    dispenseProgress = 0;
    if (dispensingInterval) clearInterval(dispensingInterval);

    const stateReady = document.getElementById('dispense-state-ready');
    const stateActive = document.getElementById('dispense-state-active');
    const stateComplete = document.getElementById('dispense-state-complete');

    if (stateReady) stateReady.classList.add('active');
    if (stateActive) stateActive.classList.remove('active');
    if (stateComplete) stateComplete.classList.remove('active');

    const dispensedAmount = document.getElementById('dispensed-amount');
    const dispensePercent = document.getElementById('dispense-percent');
    const progressArc = document.getElementById('dispense-progress-arc');
    const dispensedLiquid = document.getElementById('dispensed-liquid');
    const liquidStream = document.getElementById('liquid-stream');

    if (dispensedAmount) dispensedAmount.textContent = '0';
    if (dispensePercent) dispensePercent.textContent = '0%';
    if (progressArc) progressArc.style.strokeDashoffset = '326.7';
    if (dispensedLiquid) dispensedLiquid.style.height = '0%';
    if (liquidStream) liquidStream.classList.remove('active');

    scene3d.setStreamActive(false);
    scene3d.setDispenseProgress(0);

    const completionTime = document.getElementById('completion-time');
    if (completionTime) {
      const now = new Date();
      completionTime.textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  }

  // Start Dispense Button
  const btnStartDispense = document.getElementById('btn-start-dispense');
  if (btnStartDispense) {
    btnStartDispense.addEventListener('click', () => {
      if (!glassDetected) {
        showToast('⚠ Cannot dispense: Glass not detected. Place cup below dispenser.', 'warning');
        playTone(320, 'square', 0.4);
        return;
      }

      startDispensingAnimation();
      playTone(820, 'sine', 0.5);
      showToast('💧 Liquid Dispensing Started...');
    });
  }

  function startDispensingAnimation() {
    isDispensingActive = true;
    isDispensingPaused = false;
    dispenseProgress = 0;

    const stateReady = document.getElementById('dispense-state-ready');
    const stateActive = document.getElementById('dispense-state-active');

    if (stateReady) stateReady.classList.remove('active');
    if (stateActive) stateActive.classList.add('active');

    const liquidStream = document.getElementById('liquid-stream');
    if (liquidStream) liquidStream.classList.add('active');

    scene3d.setMode('dispensing');
    scene3d.setStreamActive(true);

    startDispenseTimer();
  }

  function startDispenseTimer() {
    if (dispensingInterval) clearInterval(dispensingInterval);

    const totalDuration = 7000;
    const updateInterval = 50;
    const incrementPerStep = 100 / (totalDuration / updateInterval);

    dispensingInterval = setInterval(() => {
      if (isDispensingPaused) return;

      dispenseProgress += incrementPerStep;

      if (dispenseProgress >= 100) {
        dispenseProgress = 100;
        clearInterval(dispensingInterval);
        finishDispensing();
      }

      updateDispenseProgressUI(dispenseProgress);
    }, updateInterval);
  }

  function updateDispenseProgressUI(percent) {
    const amount = Math.round(percent);
    const dispensedAmount = document.getElementById('dispensed-amount');
    const dispensePercent = document.getElementById('dispense-percent');
    const progressArc = document.getElementById('dispense-progress-arc');
    const dispensedLiquid = document.getElementById('dispensed-liquid');

    if (dispensedAmount) dispensedAmount.textContent = amount;
    if (dispensePercent) dispensePercent.textContent = `${amount}%`;

    const offset = 326.7 - (326.7 * percent / 100);
    if (progressArc) progressArc.style.strokeDashoffset = offset;

    if (dispensedLiquid) dispensedLiquid.style.height = `${percent}%`;

    scene3d.setDispenseProgress(percent);
  }

  function finishDispensing() {
    isDispensingActive = false;
    const stateActive = document.getElementById('dispense-state-active');
    const stateComplete = document.getElementById('dispense-state-complete');
    const liquidStream = document.getElementById('liquid-stream');

    if (liquidStream) liquidStream.classList.remove('active');
    scene3d.setStreamActive(false);

    setTimeout(() => {
      if (stateActive) stateActive.classList.remove('active');
      if (stateComplete) stateComplete.classList.add('active');

      scene3d.setMode('standby');
      scene3d.triggerScanSuccessAnimation();

      playTone(880, 'sine', 0.6);
      showToast('✓ KWATHA READY — Your preparation has been successfully dispensed!');
    }, 400);
  }

  // Done Button -> Transitions to iKWATH Preparation History Screen
  const btnDispenseDone = document.getElementById('btn-dispense-done');
  if (btnDispenseDone) {
    btnDispenseDone.addEventListener('click', () => {
      // Record new preparation dynamically in History List
      recordPreparationToHistory();
      showView('history');
      playTone(720, 'sine', 0.35);
      showToast('✓ Preparation saved to iKWATH history log');
    });
  }

  function recordPreparationToHistory() {
    const historyList = document.getElementById('history-log-list');
    const historyTime = document.getElementById('history-new-time');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (historyTime) historyTime.textContent = timeStr;

    if (historyList) {
      const newCard = document.createElement('div');
      newCard.className = 'history-log-card glass-card highlighted';
      newCard.innerHTML = `
        <div class="log-left">
          <div class="log-icon green">🌿</div>
          <div class="log-info">
            <strong class="log-title">Immunity Support Kwatha</strong>
            <span class="log-meta">Today • ${timeStr} • 100 ml</span>
            <span class="log-pod-code">Smart Pod: POD-IM-240829 | iKWATH PRO #IKW-24A8-7392</span>
          </div>
        </div>
        <div class="log-right">
          <span class="log-status-badge green">Dispensed ✓</span>
          <span class="log-temp">Warm (85.4°C Extracted)</span>
        </div>
      `;
      historyList.prepend(newCard);
    }
  }

  // Preparation Details Modal Triggers
  const btnViewPrepDetails = document.getElementById('btn-view-prep-details');
  const modalPrepDetails = document.getElementById('modal-prep-details');
  const closePrepDetailsModal = document.getElementById('close-prep-details-modal');
  const btnClosePrepDetails = document.getElementById('btn-close-prep-details');

  if (btnViewPrepDetails && modalPrepDetails) {
    btnViewPrepDetails.addEventListener('click', () => {
      modalPrepDetails.classList.add('active');
      playTone(600, 'sine', 0.2);
    });
  }

  if (closePrepDetailsModal && modalPrepDetails) {
    closePrepDetailsModal.addEventListener('click', () => {
      modalPrepDetails.classList.remove('active');
      playTone(480, 'sine', 0.15);
    });
  }

  if (btnClosePrepDetails && modalPrepDetails) {
    btnClosePrepDetails.addEventListener('click', () => {
      modalPrepDetails.classList.remove('active');
      playTone(480, 'sine', 0.15);
    });
  }

  // Optional Star Feedback
  const starRating = document.getElementById('star-rating');
  const btnSubmitFeedback = document.getElementById('btn-submit-feedback');

  if (starRating) {
    const starBtns = starRating.querySelectorAll('.star-btn');
    starBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        playTone(700 + (index * 50), 'sine', 0.15);
        starBtns.forEach((s, i) => {
          if (i <= index) s.classList.add('active');
          else s.classList.remove('active');
        });

        if (btnSubmitFeedback) btnSubmitFeedback.style.display = 'inline-block';
      });
    });
  }

  if (btnSubmitFeedback) {
    btnSubmitFeedback.addEventListener('click', () => {
      playTone(880, 'sine', 0.4);
      showToast('Thank you! Your feedback has been recorded. 🌟');
      btnSubmitFeedback.disabled = true;
      btnSubmitFeedback.querySelector('span').textContent = 'Feedback Received ✓';
    });
  }

  // History Back Button
  const btnHistoryBack = document.getElementById('btn-history-back');
  if (btnHistoryBack) {
    btnHistoryBack.addEventListener('click', () => {
      showView('dashboard');
      playTone(420, 'sine', 0.2);
    });
  }

  // History Export Button
  const btnHistoryExport = document.getElementById('btn-history-export');
  if (btnHistoryExport) {
    btnHistoryExport.addEventListener('click', () => {
      playTone(650, 'sine', 0.2);
      showToast('📄 iKWATH Log exported: ikwath_preparation_history.pdf');
    });
  }

  // History Filter Chips
  const filterChips = document.querySelectorAll('.filter-chip');
  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      playTone(500, 'sine', 0.15);
      showToast(`Filter applied: ${chip.textContent}`);
    });
  });

  // 15. FINAL SCREEN (VIEW 9) INTERACTIVITY & BOTTOM SHEET
  const btnExploreRec = document.getElementById('btn-explore-rec');
  if (btnExploreRec) {
    btnExploreRec.addEventListener('click', () => {
      showView('ai-recommend');
      playTone(550, 'sine', 0.2);
    });
  }

  const btnViewMachineSummary = document.getElementById('btn-view-machine-summary');
  if (btnViewMachineSummary) {
    btnViewMachineSummary.addEventListener('click', () => {
      showView('twin');
      playTone(550, 'sine', 0.2);
    });
  }

  const modalBottomSheetPrep = document.getElementById('modal-bottom-sheet-prep');
  const closeSheetModal = document.getElementById('close-sheet-modal');
  const btnCloseSheet = document.getElementById('btn-close-sheet');

  // Delegated click event for preparation history items (Bottom Sheet opener)
  document.addEventListener('click', (e) => {
    const prepItem = e.target.closest('.clickable-prep-item');
    if (prepItem && modalBottomSheetPrep) {
      const titleEl = prepItem.querySelector('.log-title');
      const metaEl = prepItem.querySelector('.log-meta');
      
      const sheetTitle = document.getElementById('sheet-recipe-title');
      const sheetDate = document.getElementById('sheet-date');
      const sheetTime = document.getElementById('sheet-time');
      const sheetQty = document.getElementById('sheet-qty');
      const sheetPod = document.getElementById('sheet-pod');

      if (titleEl && sheetTitle) sheetTitle.textContent = titleEl.textContent;

      if (metaEl) {
        const parts = metaEl.textContent.split('•').map((s) => s.trim());
        if (parts[0] && sheetDate) sheetDate.textContent = parts[0] === 'Today' ? '02 Sep 2026' : parts[0] === 'Yesterday' ? '01 Sep 2026' : parts[0];
        if (parts[1] && sheetTime) sheetTime.textContent = parts[1];
        if (parts[2] && sheetQty) sheetQty.textContent = parts[2];
      }

      if (sheetPod) {
        const prepType = prepItem.dataset.prep;
        if (prepType === 'immunity') sheetPod.textContent = 'POD-IM-240829';
        else if (prepType === 'digestive') sheetPod.textContent = 'POD-AG-240827';
        else if (prepType === 'relaxation') sheetPod.textContent = 'POD-ND-240826';
      }

      modalBottomSheetPrep.classList.add('active');
      playTone(640, 'sine', 0.2);
    }
  });

  if (closeSheetModal && modalBottomSheetPrep) {
    closeSheetModal.addEventListener('click', () => {
      modalBottomSheetPrep.classList.remove('active');
      playTone(480, 'sine', 0.15);
    });
  }

  if (btnCloseSheet && modalBottomSheetPrep) {
    btnCloseSheet.addEventListener('click', () => {
      modalBottomSheetPrep.classList.remove('active');
      playTone(480, 'sine', 0.15);
    });
  }

  // Floating Scan button on history screen
  const btnFloatingScanHistory = document.getElementById('btn-floating-scan-history');
  if (btnFloatingScanHistory) {
    btnFloatingScanHistory.addEventListener('click', () => {
      showView('scanner');
      playTone(550, 'sine', 0.2);
    });
  }

  // 16. Bottom Floating Navigation Tabs
  const navItems = document.querySelectorAll('.bottom-floating-nav .nav-item');
  navItems.forEach((tab) => {
    tab.addEventListener('click', () => {
      navItems.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      playTone(450, 'sine', 0.15);

      if (tabName === 'history') {
        showView('history');
      } else if (tabName === 'home') {
        showView('dashboard');
      } else {
        showToast(`Navigated to: ${tabName ? tabName.toUpperCase() : 'SCAN'}`);
      }
    });
  });

  // Helper: Toast Notifications
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">✦</span>
      <span class="toast-msg">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
});
