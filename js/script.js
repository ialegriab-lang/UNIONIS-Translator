/*// 1. Get references to screens and buttons using the exact IDs from HTML
const bienvenidoScreen = document.getElementById('Bienvenido');
const traductorScreen = document.getElementById('Traductor');

const enterBtn = document.getElementById('enter-btn');
const backBtn = document.getElementById('back-btn');

// 2. Event listener to switch to the Content Screen (Traductor)
enterBtn.addEventListener('click', () => {
  bienvenidoScreen.classList.add('hide');       // Hides Bienvenido
  traductorScreen.classList.remove('hide');     // Shows Traductor
});

// 3. Event listener to switch back to the Home Screen (Bienvenido)
backBtn.addEventListener('click', () => {
  traductorScreen.classList.add('hide');        // Hides Traductor
  bienvenidoScreen.classList.remove('hide');    // Shows Bienvenido
});
*/






// Pantallas y botones 

const bienvenidoScreen = document.getElementById('Bienvenido');
const traductorScreen = document.getElementById('Traductor');

const enterBtn = document.getElementById('enter-btn');
const backBtn = document.getElementById('back-btn');

let changingScreen = false;


// Cambio de pantallas


function cambiarPantalla(pantallaActual, pantallaNueva) {

  if (changingScreen) {
    return;
  }

  changingScreen = true;

  pantallaActual.classList.add('is-leaving');

  setTimeout(function() {

    pantallaActual.classList.add('hide');
    pantallaActual.classList.remove('is-leaving');

    pantallaNueva.classList.remove('hide');
    pantallaNueva.classList.add('is-entering');

    requestAnimationFrame(function() {

      requestAnimationFrame(function() {

        pantallaNueva.classList.remove('is-entering');

        const contenido = pantallaNueva.querySelector('.center-block, .app-shell');

        if (contenido) {
          contenido.style.animation = 'none';
          void contenido.offsetWidth;
          contenido.style.animation = 'appear 1.2s ease both';
        }

        // Actualizar el tamaño de las ondas al mostrar el traductor
        if (pantallaNueva === traductorScreen) {
          resizeCanvas();

          if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
          }
        }

      });

    });

    setTimeout(function() {
      changingScreen = false;
    }, 850);

  }, 800);

}

// Boton de ejecutar

enterBtn.addEventListener('click', function() {

  cambiarPantalla(bienvenidoScreen, traductorScreen);

  document.getElementById('statusDot').classList.add('active');
  document.getElementById('systemStatus').textContent = 'SISTEMA ACTIVO';
  document.getElementById('connectionLabel').textContent = 'ONLINE';

  initialiseAudio();

});

// Volver a pantalla inicial

backBtn.addEventListener('click', function() {

  stopAudio(true);

  cambiarPantalla(traductorScreen, bienvenidoScreen);

});

// Captura de señales marinas y traducciónes 

const signals = [

  {
    id: "001",
    name: "LLAMADO DE CONTACTO",
    kind: "VOCALIZACIÓN",
    description: "Pulso breve · registro cercano",
    frequency: "0.8–1.6 kHz",
    origin: "MARINO, MONARCA DE CAMDEN",
    state: "ESTABLE",

    translation: "Bienvenidos sean a nuestro mundo y ciudad Camden.",

  },

  {
    id: "002",
    name: "PULSO DE ORIENTACIÓN",
    kind: "ECO / RITMO",
    description: "Secuencia repetitiva · media",
    frequency: "0.4–1.1 kHz",
    origin: "MARINO RIVHEN",
    state: "ESTABLE",

    translation: "Sigue el pulso de la corriente. El mar recuerda el camino incluso cuando la luz desaparece, quiza de esa manerá tu y yo nos volveremos a encontrar.",

  },

  {
    id: "003",
    name: "SEÑAL DE VÍNCULO (MELODÍA DE RIVHEN)",
    kind: "CANTO",
    description: "Frecuencia larga · registro grave",
    frequency: "0.2–0.9 kHz",
    origin: "MARINO, RIVHEN",
    state: "ESTABLE",

    translation: "No le temas a la profundidad, mi voz te arrullara, duerme tranquilo en mis brazos que nada nos dañará.",

  },

  {
    id: "004",
    name: "MENSAJE DE MAREA",
    kind: "VOCALIZACIÓN",
    description: "Tono ascendente · registro abierto",
    frequency: "0.6–1.4 kHz",
    origin: "MARINO, RIVHEN",
    state: "ESTABLE",

    translation: "He escuchado su llegada en el movimiento de las mareas. Pero el palpito de tu corazón late de manera diferente a esa primera vez que la escuche.",

  },

  {
    id: "404",
    name: "PATRÓN NO RECONOCIDO",
    kind: "INTERFERENCIA",
    description: "Ruido irregular · sin registro",
    frequency: "INDETERMINADA",
    origin: "DESCONOCIDO (POSIBLE OLVIDADO)",
    state: "ERROR",

    translation: null,

  }

];

// HTML

const $ = (id) => document.getElementById(id);

const signalList = $("signalList");
const waveCanvas = $("waveCanvas");
const waveCtx = waveCanvas.getContext("2d");

const translationText = $("translationText");
const translationScreen = $("translationScreen");

// Variables del audio y animación

let selectedSignal = signals[0];

let audioContext = null;
let analyser = null;
let masterGain = null;
let audioSource = null;

let isPlaying = false;
let audioOffset = 0;
let playbackStartedAt = 0;

let animationFrame = 0;
let typeTimer = null;
let analysisTimer = null;
let analysisToken = 0;

let waveData = null;

const audioBuffers = new Map();

const soundFiles = {
  "001": "./sound/Sound4.mp3",
  "002": "./sound/Audio2.mp3",
  "003": "./sound/Sound3.mp3",
  "004": "./sound/Sound1.mp3",
  "404": "./sound/Sound5.mp3"
};

// Botones de las señales

function renderSignals() {

  signalList.innerHTML = "";

  signals
    .filter(signal => signal.id !== "404")
    .forEach(signal => {

      const button = document.createElement("button");

      button.type = "button";

      button.className =
        "signal-card" +
        (selectedSignal.id === signal.id ? " selected" : "");

      button.setAttribute(
        "aria-pressed",
        selectedSignal.id === signal.id ? "true" : "false"
      );

      button.innerHTML = `
        <span class="signal-top">
          <span class="signal-id">SEÑAL ${signal.id}</span>
          <span class="signal-kind">${signal.kind}</span>
        </span>

        <span class="signal-name">${signal.name}</span>

        <span class="signal-desc">${signal.description}</span>
      `;

      button.addEventListener("click", () => {
        selectSignal(signal.id);
      });

      signalList.appendChild(button);

    });

}

// ================================================
// SELECCIONAR UNA SEÑAL
// ================================================

function selectSignal(id) {

  const found = signals.find(signal => signal.id === id);

  if (!found) return;

  stopAudio(true);

  selectedSignal = found;

  analysisToken++;

  clearTimeout(analysisTimer);
  clearInterval(typeTimer);

  translationScreen.classList.remove("error");

  $("translationStatus").textContent = "SISTEMA LISTO";

  $("translationKicker").textContent = "ESPERANDO SOLICITUD...";

  translationText.className = "translation-text idle";

  translationText.textContent =
    "Señal cargada. Presiona “Solicitar traducción” para analizar su patrón.";

  $("retryBtn").style.display = "none";

  $("frequencyLabel").textContent =
    "FREQ. " + found.frequency;

  $("waveCaption").textContent =
    "ARCHIVO ACÚSTICO / SEÑAL " + found.id;

  $("metaSignal").textContent =
    "SEÑAL " + found.id;

  $("metaOrigin").textContent =
    found.origin;

  $("metaState").textContent =
    found.state;

  renderSignals();

}

// ================================================
// GENERAR UNA SEÑAL ALEATORIA
// ================================================

function generateRandomSignal() {

  const known = signals.filter(signal => signal.translation);

  let next = known[Math.floor(Math.random() * known.length)];

  if (known.length > 1 && next.id === selectedSignal.id) {

    next = known[(known.indexOf(next) + 1) % known.length];

  }

  selectSignal(next.id);

}

// ================================================
// CONFIGURAR AUDIO
// ================================================

function initialiseAudio() {

  if (audioContext) return;

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {

    $("playbackState").textContent = "AUDIO NO DISPONIBLE";

    return;
  }

  audioContext = new AudioContextClass();

  analyser = audioContext.createAnalyser();

  analyser.fftSize = 2048;

  analyser.smoothingTimeConstant = 0.82;

  masterGain = audioContext.createGain();

  masterGain.gain.value = 0.22;

  analyser.connect(masterGain);

  masterGain.connect(audioContext.destination);

}

// Cargar sonidos

async function loadSignalBuffer(signal) {

  if (audioBuffers.has(signal.id)) {
    return audioBuffers.get(signal.id);
  }

  const soundFile = soundFiles[signal.id];

  if (!soundFile) {
    throw new Error("No sound file configured for signal " + signal.id);
  }

  const response = await fetch(soundFile);

  if (!response.ok) {
    throw new Error(
      "Could not load " + soundFile + " (" + response.status + ")"
    );
  }

  const audioData = await response.arrayBuffer();
  const buffer = await audioContext.decodeAudioData(audioData);

  audioBuffers.set(signal.id, buffer);

  return buffer;

}

// Reproducir audios

async function playSignal() {

  initialiseAudio();

  if (!audioContext) return;

  await audioContext.resume();

  if (isPlaying) return;

  let buffer;

  try {
    buffer = await loadSignalBuffer(selectedSignal);
  } catch (error) {
    console.error("Unable to load signal audio:", error);
    $("playbackState").textContent = "AUDIO NO DISPONIBLE";
    return;
  }

  audioSource = audioContext.createBufferSource();

  audioSource.buffer = buffer;

  audioSource.loop = true;

  audioSource.connect(analyser);

  audioSource.start(0, audioOffset % buffer.duration);

  playbackStartedAt = audioContext.currentTime;

  isPlaying = true;

  updatePlaybackUI();

}

// Pausar audios

function pauseSignal() {

  if (!isPlaying || !audioSource) return;

  const duration = audioSource.buffer.duration;

  audioOffset =
    (audioOffset + audioContext.currentTime - playbackStartedAt) %
    duration;

  try {
    audioSource.stop();
  } catch (error) {}

  audioSource.disconnect();

  audioSource = null;

  isPlaying = false;

  updatePlaybackUI();

}

// detener los audios

function stopAudio(resetOffset) {

  if (audioSource) {

    try {
      audioSource.stop();
    } catch (error) {}

    audioSource.disconnect();

    audioSource = null;

  }

  isPlaying = false;

  if (resetOffset) {
    audioOffset = 0;
  }

  updatePlaybackUI();

}

// Actualizar botones cuando cambien de estado

function updatePlaybackUI() {

  $("playBtn").disabled = isPlaying;

  $("pauseBtn").disabled = !isPlaying;

  $("playbackState").textContent =
    isPlaying ? "● REPRODUCIENDO" : "● EN PAUSA";

  $("playbackState").classList.toggle("playing", isPlaying);

  $("waveCaption").textContent =
    isPlaying
      ? "SEÑAL " + selectedSignal.id + " / REPRODUCCIÓN EN CURSO"
      : "ARCHIVO ACÚSTICO / SEÑAL " + selectedSignal.id;

  $("metaState").textContent =
    isPlaying ? "REPRODUCIENDO" : selectedSignal.state;

}

// Efectos de texto de traduccion

function typeTranslation(text, token) {

  clearInterval(typeTimer);

  translationText.textContent = "";

  let index = 0;

  translationText.className = "translation-text";

  const cursor = document.createElement("span");

  cursor.className = "cursor";

  translationText.appendChild(cursor);

  typeTimer = setInterval(() => {

    if (token !== analysisToken) {

      clearInterval(typeTimer);

      return;
    }

    cursor.insertAdjacentText("beforebegin", text.charAt(index));

    index++;

    if (index >= text.length) {

      clearInterval(typeTimer);

      cursor.remove();

    }

  }, 28);

}

// Solicitar traduccion

function requestTranslation() {

  const token = ++analysisToken;

  clearTimeout(analysisTimer);

  clearInterval(typeTimer);

  translationScreen.classList.remove("error");

  $("retryBtn").style.display = "none";

  $("translationStatus").textContent = "ANALIZANDO...";

  $("translationKicker").textContent =
    "COMPARANDO PATRÓN ACÚSTICO";

  translationText.className = "translation-text";

  translationText.textContent = "▰ ▰ ▱ ▱ ▱";

  analysisTimer = setTimeout(() => {

    if (token !== analysisToken) return;

    if (!selectedSignal.translation) {

      showTranslationError();

      return;
    }

    $("translationStatus").textContent =
      "TRADUCCIÓN COMPLETA";

    $("translationKicker").textContent =
      "SIGNIFICADO DETECTADO // ES-01";

    typeTranslation(selectedSignal.translation, token);

  }, 1100);

}

// error

function showTranslationError() {

  translationScreen.classList.add("error");

  $("translationStatus").textContent = "ERROR 404";

  $("translationKicker").textContent =
    "PATRÓN NO RECONOCIDO";

  translationText.className =
    "translation-text error-text";

  translationText.textContent =
    "La señal contiene frecuencias que EXINE no puede asociar a un registro. No fue posible establecer una traducción.";

  $("retryBtn").style.display = "block";

}

// Animación de ondas

function resizeCanvas() {

  const ratio = Math.max(1, window.devicePixelRatio || 1);

  const width = Math.max(1, waveCanvas.clientWidth);

  const height = Math.max(1, waveCanvas.clientHeight);

  waveCanvas.width = Math.floor(width * ratio);

  waveCanvas.height = Math.floor(height * ratio);

  waveCtx.setTransform(ratio, 0, 0, ratio, 0, 0);

}

function drawWave() {

  const width = waveCanvas.clientWidth;

  const height = waveCanvas.clientHeight;

  if (!width || !height) {

    animationFrame = requestAnimationFrame(drawWave);

    return;
  }

  waveCtx.clearRect(0, 0, width, height);

  // Líneas de fondo

  waveCtx.strokeStyle = "rgba(131,228,210,.075)";

  waveCtx.lineWidth = 1;

  for (let x = 0; x < width; x += 48) {

    waveCtx.beginPath();

    waveCtx.moveTo(x, 0);

    waveCtx.lineTo(x, height);

    waveCtx.stroke();

  }

  for (let y = 24; y < height; y += 34) {

    waveCtx.beginPath();

    waveCtx.moveTo(0, y);

    waveCtx.lineTo(width, y);

    waveCtx.stroke();

  }

  const mid = height / 2;

  let data = null;

  if (isPlaying && analyser) {

    if (!waveData || waveData.length !== analyser.fftSize) {

      waveData = new Uint8Array(analyser.fftSize);

    }

    data = waveData;

    analyser.getByteTimeDomainData(data);

  }

  const time = performance.now() / 1000;

  function getWaveY(x, amplitude, phase) {

    if (data) {

      const sampleIndex =
        Math.floor((x / width) * data.length);

      const sample =
        (data[sampleIndex] - 128) / 128;

      return mid + sample * height * amplitude + phase;

    }

    const envelope =
      selectedSignal.id === "404" ? 8 : 4.5;

    const wave =
      Math.sin(x * 0.045 + time * 1.15) *
      Math.sin(x * 0.012 - time * .55);

    return mid + wave * envelope + phase;

  }

  function drawTrace(amplitude, phase, color, lineWidth, glow) {

    waveCtx.beginPath();

    waveCtx.lineWidth = lineWidth;
    waveCtx.strokeStyle = color;
    waveCtx.shadowBlur = glow;
    waveCtx.shadowColor = "rgba(131,228,210,.5)";

    for (let x = 0; x < width; x++) {

      const y = getWaveY(x, amplitude, phase);

      if (x === 0) {
        waveCtx.moveTo(x, y);
      } else {
        waveCtx.lineTo(x, y);
      }

    }

    waveCtx.stroke();

  }

  // Trazos de onda repetidos para que se vea mas interesantes y con profundidad
  drawTrace(
    data ? 0.37 : 0.9,
    0,
    "rgba(131,228,210,.12)",
    8,
    isPlaying ? 18 : 8
  );

  drawTrace(
    data ? 0.32 : 0.72,
    3,
    "rgba(213,239,157,.32)",
    1,
    4
  );

  drawTrace(
    data ? 0.37 : 1,
    0,
    isPlaying ? "#83e4d2" : "rgba(131,228,210,.62)",
    1.8,
    isPlaying ? 13 : 4
  );

  waveCtx.shadowBlur = 0;

  // Movimiento de la línea de escaneo que indica la posición actual de reproducción.
  const scanX = ((time * (isPlaying ? 90 : 28)) % (width + 30)) - 15;
  const scanGradient = waveCtx.createLinearGradient(scanX - 12, 0, scanX + 12, 0);
  scanGradient.addColorStop(0, "rgba(131,228,210,0)");
  scanGradient.addColorStop(.5, "rgba(131,228,210,.55)");
  scanGradient.addColorStop(1, "rgba(131,228,210,0)");
  waveCtx.fillStyle = scanGradient;
  waveCtx.fillRect(scanX - 12, 0, 24, height);

  waveCtx.fillStyle = "rgba(213,239,157,.7)";
  waveCtx.fillRect(scanX, 0, 1, height);

  // Small live markers make the signal easier to read at a glance.
  waveCtx.fillStyle = "rgba(131,228,210,.7)";
  for (let x = 24; x < width; x += 48) {
    const y = getWaveY(x, data ? .37 : 1, 0);
    waveCtx.beginPath();
    waveCtx.arc(x, y, 1.5, 0, Math.PI * 2);
    waveCtx.fill();
  }

  // Marcas de lectura

  waveCtx.fillStyle = "rgba(131,228,210,.55)";

  waveCtx.font = "8px monospace";

  waveCtx.fillText("+1.0", 8, 13);

  waveCtx.fillText("-1.0", 8, height - 8);

  animationFrame = requestAnimationFrame(drawWave);

}

// Conectar botones del traductor

$("randomBtn").addEventListener("click", generateRandomSignal);

$("errorPick").addEventListener("click", () => {
  selectSignal("404");
});

$("playBtn").addEventListener("click", playSignal);

$("pauseBtn").addEventListener("click", pauseSignal);

$("translateBtn").addEventListener("click", requestTranslation);

$("retryBtn").addEventListener("click", () => {

  generateRandomSignal();

  requestTranslation();

});

// Iniciar sistema

window.addEventListener("resize", resizeCanvas);

selectSignal("001");

resizeCanvas();

drawWave();