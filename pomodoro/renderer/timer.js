// --- DOM elements ---
const phaseLabel = document.getElementById('phaseLabel');
const timerText = document.getElementById('timerText');
const progressRing = document.getElementById('progressRing');
const btnStart = document.getElementById('btnStart');
const btnReset = document.getElementById('btnReset');
const btnSkip = document.getElementById('btnSkip');
const countNumber = document.getElementById('countNumber');
const toggleOnTop = document.getElementById('toggleOnTop');

// --- Constants ---
const PHASES = ['work', 'shortBreak', 'longBreak'];
const PHASE_LABELS = { work: '专注', shortBreak: '短休', longBreak: '长休' };
const DURATIONS = { work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
const LONG_BREAK_INTERVAL = 4;

const CIRCUMFERENCE = 2 * Math.PI * 90; // r=90

// --- State ---
let phaseIndex = 0;           // 0=work, 1=shortBreak, 2=longBreak
let sessions = 0;             // completed work sessions
let remaining = DURATIONS.work;
let totalDuration = DURATIONS.work;
let isRunning = false;
let timerId = null;
let workCountSinceLongBreak = 0; // work sessions since last long break

// --- Init ---
function init() {
  const saved = localStorage.getItem('pomodoro-sessions');
  if (saved !== null) {
    sessions = parseInt(saved, 10) || 0;
    countNumber.textContent = sessions;
  }

  const savedOnTop = localStorage.getItem('pomodoro-ontop');
  if (savedOnTop === 'true') {
    toggleOnTop.checked = true;
    window.electronAPI?.alwaysOnTop.set(true);
  }

  updateDisplay();
  updateProgressRing();
}

// --- Display ---
function updateDisplay() {
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  timerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const phase = PHASES[phaseIndex];
  phaseLabel.textContent = PHASE_LABELS[phase];
  phaseLabel.className = 'phase-label ' + (phase === 'work' ? 'work' : 'break');
  document.title = `${timerText.textContent} - ${PHASE_LABELS[phase]}`;
}

function updateProgressRing() {
  const offset = CIRCUMFERENCE * (1 - remaining / totalDuration);
  progressRing.style.strokeDasharray = CIRCUMFERENCE;
  progressRing.style.strokeDashoffset = offset;

  const phase = PHASES[phaseIndex];
  progressRing.className = 'ring-progress ' + (phase === 'work' ? 'work' : 'break');
}

// --- Timer ---
function startTimer() {
  if (timerId) return;
  isRunning = true;
  btnStart.textContent = '暂停';
  btnStart.classList.add('running');

  timerId = setInterval(() => {
    remaining--;
    updateDisplay();
    updateProgressRing();

    if (remaining <= 0) {
      onTimerEnd();
    }
  }, 1000);
}

function pauseTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  isRunning = false;
  btnStart.textContent = '开始';
  btnStart.classList.remove('running');
}

function resetTimer() {
  pauseTimer();
  const phase = PHASES[phaseIndex];
  remaining = DURATIONS[phase];
  totalDuration = DURATIONS[phase];
  updateDisplay();
  updateProgressRing();
}

function skipPhase() {
  pauseTimer();
  switchToNextPhase();
}

function switchToNextPhase() {
  const currentPhase = PHASES[phaseIndex];

  // If we just finished a work session
  if (currentPhase === 'work') {
    sessions++;
    countNumber.textContent = sessions;
    localStorage.setItem('pomodoro-sessions', sessions);
    workCountSinceLongBreak++;

    if (workCountSinceLongBreak >= LONG_BREAK_INTERVAL) {
      phaseIndex = 2; // long break
      workCountSinceLongBreak = 0;
    } else {
      phaseIndex = 1; // short break
    }
  } else {
    // Finished a break, go back to work
    phaseIndex = 0;
  }

  const phase = PHASES[phaseIndex];
  remaining = DURATIONS[phase];
  totalDuration = DURATIONS[phase];
  updateDisplay();
  updateProgressRing();
}

// --- Timer end ---
function onTimerEnd() {
  pauseTimer();
  playBeep();

  const phase = PHASES[phaseIndex];
  const label = PHASE_LABELS[phase];
  const nextPhase = phaseIndex === 0
    ? (workCountSinceLongBreak + 1 >= LONG_BREAK_INTERVAL ? '长休' : '短休')
    : '专注';

  window.electronAPI?.notification.show(
    `番茄钟 - ${label} 结束`,
    `接下来: ${nextPhase}`
  );

  switchToNextPhase();
}

// --- Sound ---
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [880, 660, 880, 1100];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.3);
    });
  } catch (_) { /* audio not available */ }
}

// --- Event listeners ---
btnStart.addEventListener('click', () => {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

btnReset.addEventListener('click', resetTimer);

btnSkip.addEventListener('click', () => {
  if (isRunning) {
    pauseTimer();
  }
  switchToNextPhase();
});

toggleOnTop.addEventListener('change', () => {
  const flag = toggleOnTop.checked;
  localStorage.setItem('pomodoro-ontop', flag);
  window.electronAPI?.alwaysOnTop.set(flag);
});

// --- Start ---
init();
