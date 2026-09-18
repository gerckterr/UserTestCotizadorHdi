// ============================================================================
// Test de usabilidad — Cotizador Auto (HDI)
// Lógica del test: intro -> 3 tareas -> encuesta final -> cierre.
// Vanilla JS, sin dependencias. Ver README.md para cómo publicar y conectar
// la Google Sheet.
// ============================================================================

// URL del Web App de Google Apps Script (Paso 2 del README). Déjala vacía o
// con este placeholder y el test sigue funcionando: solo no habrá guardado
// automático, y el botón de "copiar mis respuestas" sigue disponible.
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycby0SBxmXFxOsElF45rz5Pyf1qiktpRBEmgtvc2eBn1liQLXKfBf-d2lufyTNi0Q8qOL/exec';

const KEY = 'ux_test_cotizador_v3';
const SID_KEY = 'ux_test_session_id_v1';

// ----------------------------------------------------------------------------
// Contenido del test — copiado literalmente del prototipo design/Test de
// Usuario.dc.html. No se reescriben preguntas ni copys.
// ----------------------------------------------------------------------------

const TASKS = [
  {
    kicker: 'Tarea 1 de 3',
    title: 'Cotiza un auto, revisa la protección y quédate con un paquete.',
    hint: 'Usa el auto que quieras (si no se te ocurre uno: Nissan Versa 2020, CP 06700). Tómate tu tiempo para ver los precios y, si quieres, cambia la suma asegurada, un deducible o alguna cobertura antes de elegir.',
    qs: [
      { id: 'logro', type: 'choice', label: '¿Pudiste llegar a ver precios y elegir un paquete?', opts: ['Sí, sin problema', 'Sí, pero me costó', 'No lo logré'] },
      { id: 'dif', type: 'scale', label: '¿Qué tan fácil o difícil te resultó?', hint: '1 = muy fácil · 5 = muy difícil' },
      { id: 'esperado', type: 'text', label: '¿Te pidieron algún dato que no esperabas o que no sabrías de memoria?', ph: 'Escribe lo que recuerdes', optional: true },
      { id: 'compr', type: 'text', label: 'Con tus palabras: ¿en qué se diferencian los paquetes que viste?', ph: 'Responde como se lo explicarías a un amigo' },
      { id: 'deducible', type: 'text', label: '¿Los datos que viste son suficientes para hacerte elegir un paquete? ', ph: 'No hay respuesta correcta, dinos qué entendiste' },
      { id: 'precio', type: 'choice', label: '¿Te quedó claro cómo cambiaba el precio según lo que elegías?', opts: ['Sí', 'Más o menos', 'No'] },
      { id: 'porque', type: 'text', label: '¿Por qué elegiste ese paquete?', ph: 'Opcional', optional: true },
      { id: 'notas', type: 'text', label: '¿Algo te confundió o te detuvo?', ph: 'Opcional', optional: true }
    ]
  },
  {
    kicker: 'Tarea 2 de 3',
    title: 'Llena tus datos.',
    hint: 'Usa datos inventados. Solo queremos ver si el formulario se deja llenar.',
    qs: [
      { id: 'logro', type: 'choice', label: '¿Pudiste completar tus datos?', opts: ['Sí, sin problema', 'Sí, pero me costó', 'No lo logré'] },
      { id: 'dif', type: 'scale', label: '¿Qué tan fácil o difícil te resultó?', hint: '1 = muy fácil · 5 = muy difícil' },
      { id: 'campos', type: 'text', label: '¿Hubo algún campo que no entendiste o que te haría abandonar?', ph: 'Opcional', optional: true }
    ]
  },
  {
    kicker: 'Tarea 3 de 3',
    title: 'Llega hasta el pago y confirma la contratación.',
    hint: 'Es una simulación: usa los datos de tarjeta de prueba que aparecen, nunca los tuyos.',
    qs: [
      { id: 'logro', type: 'choice', label: '¿Pudiste terminar la contratación?', opts: ['Sí, sin problema', 'Sí, pero me costó', 'No lo logré'] },
      { id: 'dif', type: 'scale', label: '¿Qué tan fácil o difícil te resultó?', hint: '1 = muy fácil · 5 = muy difícil' },
      { id: 'despues', type: 'text', label: '¿Qué crees que pasa después de pagar? ¿Qué recibes y cuándo?', ph: 'Lo que entendiste de las pantallas' },
      { id: 'confianza', type: 'choice', label: 'En la vida real, ¿habrías pagado aquí?', opts: ['Sí', 'Lo dudaría', 'No'] }
    ]
  }
];

const INTRO_QS = [
  { id: 'nombre', type: 'text', label: '¿Cómo te llamas?', ph: 'Nombre o apodo, para identificar tus respuestas' },
  { id: 'device', type: 'choice', label: '¿Desde dónde estás probando?', opts: ['Celular', 'Computadora', 'Tablet'] },
  { id: 'exp', type: 'choice', label: '¿Has cotizado o contratado un seguro de auto por internet antes?', opts: ['Sí', 'No', 'Solo cotizado'] }
];

const FINAL_QS = [
  { id: 'f_paso', type: 'scale', label: 'Supe en todo momento en qué paso estaba y cuánto faltaba.', hint: '1 = nada de acuerdo · 5 = totalmente de acuerdo' },
  { id: 'f_leng', type: 'scale', label: 'El lenguaje de las coberturas y los seguros fue claro.', hint: '1 = nada de acuerdo · 5 = totalmente de acuerdo' },
  { id: 'f_solo', type: 'scale', label: 'Podría repetir todo el proceso solo, sin ayuda.', hint: '1 = nada de acuerdo · 5 = totalmente de acuerdo' },
  { id: 'f_conf', type: 'scale', label: 'Me sentí en confianza dando mis datos.', hint: '1 = nada de acuerdo · 5 = totalmente de acuerdo' },
  { id: 'f_peor', type: 'text', label: '¿Cuál fue el peor momento de todo el proceso?', ph: 'El punto donde más te trabaste' },
  { id: 'f_falto', type: 'text', label: '¿Algo que esperabas encontrar y no estaba?', ph: 'Opcional', optional: true },
  { id: 'f_libre', type: 'text', label: '¿Algo más que nos quieras decir?', ph: 'Opcional', optional: true }
];

const SCALE = ['1', '2', '3', '4', '5'];

// Ranking de pantallas del cotizador (viene de cotizador.html vía postMessage,
// con polling del atributo data-screen como respaldo).
const RANK = { landing: 0, auto: 1, help: 1, llamar: 1, marcamos: 1, llamamos: 1, contacto: 2, plan: 3, identidad: 4, ine: 4, datos: 5, poliza: 6, pago: 7, listo: 8 };
// Pantalla mínima que hay que alcanzar para dar por terminada cada tarea (1,2,3)
const NEED = [4, 6, 8];
const NEED_TXT = [
  'Elige tu paquete y continúa al siguiente paso.',
  'Completa tus datos y llega a la pantalla de tu póliza.',
  'Termina el pago y llega a la pantalla de confirmación.'
];

// ----------------------------------------------------------------------------
// Estado + persistencia local
// ----------------------------------------------------------------------------

function genId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'sid_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

function defaultState() {
  return {
    i: 0, ans: {}, copied: false, sheet: false, stuck: false,
    rank: 0, blind: false, fired: -1, taskOf: -1, baseRank: 0, baseSig: '', ready: -1,
    // seguimiento por tarea, para reportar y para la Sheet
    taskMaxRank: {}, taskMaxScreen: {}, taskStuck: {},
    taskStartedAt: {}, taskFiredAt: {}, taskDuration: {},
    startedAt: null, finishedAt: null,
    lastSendOk: null
  };
}

function loadState() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  let sessionId = null;
  try { sessionId = localStorage.getItem(SID_KEY); } catch (e) {}
  if (!sessionId) {
    sessionId = genId();
    try { localStorage.setItem(SID_KEY, sessionId); } catch (e) {}
  }
  const merged = Object.assign(defaultState(), saved);
  merged.sessionId = sessionId;
  return merged;
}

function saveLocal() {
  try {
    const toSave = Object.assign({}, state);
    delete toSave.sessionId;
    localStorage.setItem(KEY, JSON.stringify(toSave));
  } catch (e) {}
}

function resetAll() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(SID_KEY); } catch (e) {}
  state = loadState();
  render();
}

let state = loadState();

// ----------------------------------------------------------------------------
// Envío a Google Sheets (Apps Script Web App). Best-effort: si falla, no
// rompe el flujo del test; solo se marca un aviso discreto en la pantalla
// de cierre.
// ----------------------------------------------------------------------------

function buildPayload() {
  const a = state.ans;
  const total = TASKS.length + 2;
  const payload = {
    session_id: state.sessionId,
    fecha: new Date().toISOString(),
    nombre: a['intro.nombre'] || '',
    dispositivo: a['intro.device'] || '',
    experiencia_previa: a['intro.exp'] || '',
    completado: state.i >= total ? 'sí' : 'no',
    duracion_total_seg: totalDurationSeconds()
  };
  TASKS.forEach((t, idx) => {
    const n = idx + 1;
    t.qs.forEach(q => { payload['t' + n + '_' + q.id] = a['t' + n + '.' + q.id] || ''; });
    payload['t' + n + '_pantalla_alcanzada'] = state.taskMaxScreen[n] || '';
    payload['t' + n + '_se_atoro'] = state.taskStuck[n] ? 'sí' : 'no';
    payload['t' + n + '_duracion_seg'] = state.taskDuration[n] != null ? state.taskDuration[n] : '';
  });
  FINAL_QS.forEach(q => { payload['fin_' + q.id] = a['fin.' + q.id] || ''; });
  return payload;
}

function totalDurationSeconds() {
  if (!state.startedAt) return '';
  const end = state.finishedAt || Date.now();
  return Math.round((end - state.startedAt) / 1000);
}

function sendToSheets() {
  if (!SHEETS_URL || SHEETS_URL.indexOf('PEGA_AQUI') !== -1) return;
  const payload = buildPayload();
  fetch(SHEETS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
    keepalive: true
  }).then(() => {
    state.lastSendOk = true;
    saveLocal();
    if (state.i >= TASKS.length + 2) render();
  }).catch(() => {
    state.lastSendOk = false;
    saveLocal();
    if (state.i >= TASKS.length + 2) render();
  });
}

// ----------------------------------------------------------------------------
// Detección de pantalla del cotizador: postMessage (primario) + polling del
// atributo data-screen del iframe (respaldo, por si el postMessage no llega).
// ----------------------------------------------------------------------------

function handleScreenUpdate(screen, sig) {
  const r = RANK[screen];
  if (typeof r !== 'number') return;
  const i = state.i;
  const onTask = i >= 1 && i <= TASKS.length;

  // Al entrar a una tarea nueva se guarda el punto de partida real del prototipo
  if (state.taskOf !== i) {
    state.taskOf = i;
    state.baseRank = r;
    state.baseSig = sig || '';
    state.rank = r;
    if (onTask && state.taskStartedAt[i] == null) state.taskStartedAt[i] = Date.now();
    saveLocal();
    return;
  }

  if (r > state.rank) state.rank = r;

  if (onTask) {
    if (state.taskMaxRank[i] == null || r > state.taskMaxRank[i]) {
      state.taskMaxRank[i] = r;
      state.taskMaxScreen[i] = screen;
    }
    const need = NEED[i - 1];
    const ok = r >= need && r > state.baseRank;
    if (ok && !state.sheet && state.fired !== i) {
      state.sheet = true;
      state.stuck = false;
      state.fired = i;
      state.ready = i;
      if (state.taskFiredAt[i] == null) state.taskFiredAt[i] = Date.now();
      state.taskDuration[i] = state.taskStartedAt[i] ? Math.round((state.taskFiredAt[i] - state.taskStartedAt[i]) / 1000) : '';
      render();
      saveLocal();
      return;
    } else if (ok && state.ready !== i) {
      state.ready = i;
    }
  }
  render();
  saveLocal();
}

window.addEventListener('message', ev => {
  const d = ev.data;
  if (!d || d.type !== 'screen' || typeof d.screen !== 'string') return;
  handleScreenUpdate(d.screen, d.sig);
});

let pollFailCount = 0;
setInterval(() => {
  try {
    const frame = document.getElementById('cotizadorFrame');
    const doc = frame && frame.contentDocument;
    if (!doc) return;
    const el = doc.querySelector('[data-screen]');
    if (!el) return;
    pollFailCount = 0;
    handleScreenUpdate(el.getAttribute('data-screen'), el.getAttribute('data-sig') || '');
  } catch (e) {
    pollFailCount++;
    // Si tanto postMessage como el polling fallan de forma sostenida (p.ej.
    // el iframe quedó en un origen distinto), no dejamos a la persona
    // bloqueada sin poder avanzar nunca.
    if (pollFailCount > 5 && !state.blind) { state.blind = true; render(); }
  }
}, 700);

// ----------------------------------------------------------------------------
// Helpers de contenido según el paso actual
// ----------------------------------------------------------------------------

function screenQs() {
  const i = state.i;
  if (i === 0) return { ns: 'intro', qs: INTRO_QS };
  if (i >= 1 && i <= TASKS.length) return { ns: 't' + i, qs: TASKS[i - 1].qs };
  if (i === TASKS.length + 1) return { ns: 'fin', qs: FINAL_QS };
  return { ns: '', qs: [] };
}

function setAnswer(key, val) {
  state.ans[key] = val;
  state.copied = false;
  saveLocal();
  render();
}

function buildSummary() {
  const a = state.ans;
  const L = [];
  L.push('TEST DE USABILIDAD — COTIZADOR AUTO');
  L.push('Participante: ' + (a['intro.nombre'] || '(sin nombre)'));
  L.push('Dispositivo: ' + (a['intro.device'] || '-') + ' · Experiencia previa: ' + (a['intro.exp'] || '-'));
  L.push('Fecha: ' + new Date().toLocaleString('es-MX'));
  L.push('');
  TASKS.forEach((t, n) => {
    L.push('— ' + t.kicker.toUpperCase() + ': ' + t.title);
    t.qs.forEach(q => {
      const v = a['t' + (n + 1) + '.' + q.id];
      L.push('  ' + q.label + ' → ' + (v ? v : '(sin respuesta)'));
    });
    L.push('');
  });
  L.push('— IMPRESIÓN GENERAL');
  FINAL_QS.forEach(q => { L.push('  ' + q.label + ' → ' + (a['fin.' + q.id] || '(sin respuesta)')); });
  return L.join('\n');
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ----------------------------------------------------------------------------
// Render
// ----------------------------------------------------------------------------

const ICON_CHECK = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#76B82A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
const ICON_BACK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F7B33" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>';

const el = {
  root: document.getElementById('root'),
  barFill: document.getElementById('barFill'),
  counter: document.getElementById('counter'),
  stage: document.getElementById('stage'),
  taskKicker: document.getElementById('taskKicker'),
  taskTitle: document.getElementById('taskTitle'),
  taskHint: document.getElementById('taskHint'),
  frame: document.getElementById('cotizadorFrame'),
  paper: document.getElementById('paper'),
  paperInner: document.getElementById('paperInner'),
  qwrap: document.getElementById('qwrap'),
  sheetHeader: document.getElementById('sheetHeader'),
  qList: document.getElementById('qList'),
  taskbar: document.getElementById('taskbar'),
  btnDoneTask: document.getElementById('btnDoneTask'),
  btnStuck: document.getElementById('btnStuck'),
  taskNeed: document.getElementById('taskNeed'),
  doneHint: document.getElementById('doneHint'),
  navbar: document.getElementById('navbar'),
  btnBack: document.getElementById('btnBack'),
  btnNext: document.getElementById('btnNext'),
  navNote: document.getElementById('navNote')
};

function renderQuestions(qs, ns, container) {
  container.innerHTML = qs.map(q => {
    const key = ns + '.' + q.id;
    const val = state.ans[key] || '';
    const isScale = q.type === 'scale';
    let body = '';
    if (q.type === 'choice' || isScale) {
      const opts = isScale ? SCALE : q.opts;
      body = '<div class="q-opts">' + opts.map(label => {
        const sel = val === label ? 'true' : 'false';
        return '<button type="button" class="opt btn" data-sel="' + sel + '" data-key="' + esc(key) + '" data-value="' + esc(label) + '">' + esc(label) + '</button>';
      }).join('') + '</div>';
    } else if (q.type === 'text') {
      body = '<div class="q-text"><textarea class="ta" rows="3" placeholder="' + esc(q.ph || '') + '" data-key="' + esc(key) + '">' + esc(val) + '</textarea></div>';
    }
    return '<div class="q-card">' +
      '<div class="q-label">' + esc(q.label) + '</div>' +
      (q.hint ? '<div class="q-hint">' + esc(q.hint) + '</div>' : '') +
      body +
      '</div>';
  }).join('');
}

function render() {
  const i = state.i;
  const total = TASKS.length + 2;
  const isTask = i >= 1 && i <= TASKS.length;
  const isIntro = i === 0;
  const isFinal = i === TASKS.length + 1;
  const isDone = i === total;
  const sheetOpen = isTask && state.sheet;
  const { ns, qs } = screenQs();

  el.root.dataset.task = isTask ? 'true' : 'false';
  el.stage.dataset.on = isTask ? 'true' : 'false';
  el.paper.dataset.on = isTask ? 'false' : 'true';

  el.barFill.style.width = Math.round((i / total) * 100) + '%';
  el.counter.textContent = isDone ? 'Fin' : (i + 1) + '/' + total;

  if (isTask) {
    const t = TASKS[i - 1];
    el.taskKicker.textContent = t.kicker;
    el.taskTitle.textContent = t.title;
    el.taskHint.textContent = t.hint;
  }

  // --- Contenido principal (paper) ---
  if (isIntro) {
    el.paperInner.innerHTML =
      '<div>' +
      '<h1 class="title">Ayúdanos a mejorar el cotizador de auto</h1>' +
      '<p style="font-size:16px;line-height:1.5;color:#4A4A4A;margin:14px 0 0">Vas a usar una versión de prueba y a contarnos cómo te fue. No es un examen: evaluamos la herramienta, no a ti.</p>' +
      '<div class="card-intro">' +
      '<div class="row"><span class="num">1</span><div class="txt">Son <strong>3 tareas</strong>, una a la vez. La instrucción se queda arriba mientras usas el cotizador aquí mismo.</div></div>' +
      '<div class="row"><span class="num">2</span><div class="txt">Al terminar cada tarea tocas el botón verde y respondes unas preguntas cortas.</div></div>' +
      '<div class="row"><span class="num">3</span><div class="txt">Toma unos <strong>15 minutos</strong>. Si algo no se puede hacer, dilo: eso también nos sirve.</div></div>' +
      '</div>' +
      '<div class="notice-warn">Es una simulación. <strong>No uses datos reales</strong> de tarjeta ni documentos personales.</div>' +
      '</div>';
  } else if (isFinal) {
    el.paperInner.innerHTML =
      '<div>' +
      '<div class="kicker">Últimas preguntas</div>' +
      '<h2 class="subtitle">Tu impresión general</h2>' +
      '</div>';
  } else if (isDone) {
    const summary = buildSummary();
    const failed = state.lastSendOk === false;
    el.paperInner.innerHTML =
      '<div>' +
      '<div class="done-check">' + ICON_CHECK + '</div>' +
      '<h2 class="done-title">Terminaste, gracias</h2>' +
      '<p class="done-copy">' + (failed
        ? 'No pudimos guardar tus respuestas automáticamente. Por favor, toca el botón para copiarlas y pégalas en el mismo chat donde te compartimos este link.'
        : 'Gracias por tu tiempo. Tus respuestas ya se guardaron automáticamente.') + '</p>' +
      '<div class="sheets-warning" data-show="' + (failed ? 'true' : 'false') + '">No se pudo confirmar el envío automático. Usa el botón de abajo como respaldo.</div>' +
      '<button type="button" class="btn btn-copy" id="btnCopy">' + (state.copied ? '¡Copiado! Ya puedes pegarlas' : 'Copiar mis respuestas') + '</button>' +
      '<div class="copy-note">' + (state.copied ? 'Pégalas en el chat donde te compartimos este link.' : 'Si el botón no funciona, selecciona el texto de abajo y cópialo a mano.') + '</div>' +
      '<div class="summary-label">Esto es lo que se copia:</div>' +
      '<textarea class="ta" rows="12" readonly style="margin-top:8px;font-size:13px;line-height:1.5">' + esc(summary) + '</textarea>' +
      '<button type="button" class="btn-reset" id="btnReset">Borrar y empezar de nuevo</button>' +
      '</div>';
  } else {
    el.paperInner.innerHTML = '';
  }

  // --- Encuesta (overlay en tarea, en flujo normal en intro/final) ---
  const qmode = sheetOpen ? 'sheet' : (isTask ? 'off' : 'flow');
  el.qwrap.dataset.mode = qmode;

  if (sheetOpen) {
    const autoNote = (!state.stuck && state.fired === i) ? 'Llegaste a donde pedía la tarea. Responde y sigues con la siguiente.' : '';
    const stuckNote = state.stuck ? 'No pasa nada: cuéntanos qué intentaste y dónde se trabó. Al guardar pasas a la siguiente tarea.' : '';
    const sheetTitle = state.stuck ? '¿Dónde te atoraste?' : '¿Cómo te fue con esta tarea?';
    el.sheetHeader.style.display = '';
    el.sheetHeader.innerHTML =
      '<button type="button" class="sheet-back btn" id="btnCloseSheet">' + ICON_BACK + ' Volver a la tarea</button>' +
      (autoNote ? '<div class="auto-note">' + esc(autoNote) + '</div>' : '') +
      '<div class="kicker">' + esc(TASKS[i - 1].kicker) + '</div>' +
      '<h2 class="sheet-title">' + esc(sheetTitle) + '</h2>' +
      (stuckNote ? '<div class="stuck-note">' + esc(stuckNote) + '</div>' : '');
  } else {
    el.sheetHeader.style.display = 'none';
    el.sheetHeader.innerHTML = '';
  }

  const questionsVisible = !(isTask && !sheetOpen);
  renderQuestions(questionsVisible ? qs : [], ns, el.qList);

  const missing = questionsVisible && qs.some(q => !q.optional && !(state.ans[ns + '.' + q.id] || '').trim());

  // --- Barra de tarea (botón "Ya terminé" / "Me atoré") ---
  const showTaskBar = isTask && !sheetOpen;
  el.taskbar.style.display = showTaskBar ? '' : 'none';
  if (showTaskBar) {
    const taskReady = state.blind || state.ready === i;
    el.btnDoneTask.disabled = !taskReady;
    el.taskNeed.textContent = taskReady ? '' : ('Para continuar: ' + NEED_TXT[i - 1]);
    el.taskNeed.style.display = taskReady ? 'none' : '';
    el.doneHint.textContent = taskReady ? 'Tarea lograda. Responde unas preguntas y sigues.' : '';
  }

  // --- Barra de navegación (Atrás / Siguiente) ---
  const showNav = !isDone && !(isTask && !sheetOpen);
  el.navbar.style.display = showNav ? '' : 'none';
  if (showNav) {
    el.navbar.style.position = sheetOpen ? 'fixed' : 'static';
    const canBack = i > 0 && !sheetOpen;
    el.btnBack.style.display = canBack ? '' : 'none';
    el.btnNext.disabled = missing;
    el.btnNext.textContent = isIntro ? 'Empezar' : (isFinal ? 'Terminar' : 'Guardar y continuar');
    el.navNote.textContent = missing ? 'Responde las preguntas para continuar' : '';
  }
}

// ----------------------------------------------------------------------------
// Navegación
// ----------------------------------------------------------------------------

function goNext() {
  const i = state.i;
  const total = TASKS.length + 2;
  const isTask = i >= 1 && i <= TASKS.length;
  const sheetOpen = isTask && state.sheet;
  const wasTaskIndex = isTask ? i : null;

  state.i = Math.min(i + 1, total);
  if (sheetOpen) state.sheet = false;

  if (state.i === 1 && state.startedAt == null) state.startedAt = Date.now();
  if (state.i >= 1 && state.i <= TASKS.length && state.taskStartedAt[state.i] == null) {
    state.taskStartedAt[state.i] = Date.now();
  }
  if (state.i === total) state.finishedAt = Date.now();

  saveLocal();
  render();

  // Guardado incremental: al terminar una tarea (se cerró su encuesta) o al
  // terminar la encuesta final.
  if (wasTaskIndex != null && sheetOpen) sendToSheets();
  if (i === TASKS.length + 1) sendToSheets();
}

function goBack() {
  state.i = Math.max(state.i - 1, 0);
  state.sheet = false;
  saveLocal();
  render();
}

// ----------------------------------------------------------------------------
// Listeners
// ----------------------------------------------------------------------------

el.btnNext.addEventListener('click', () => { if (!el.btnNext.disabled) goNext(); });
el.btnBack.addEventListener('click', goBack);
el.btnDoneTask.addEventListener('click', () => {
  if (el.btnDoneTask.disabled) return;
  state.sheet = true;
  state.stuck = false;
  saveLocal();
  render();
});
el.btnStuck.addEventListener('click', () => {
  const i = state.i;
  if (i >= 1 && i <= TASKS.length) state.taskStuck[i] = true;
  state.sheet = true;
  state.stuck = true;
  saveLocal();
  render();
});

el.qwrap.addEventListener('click', ev => {
  if (ev.target.id === 'btnCloseSheet' || ev.target.closest('#btnCloseSheet')) {
    state.sheet = false;
    state.stuck = false;
    saveLocal();
    render();
    return;
  }
  const optBtn = ev.target.closest('button[data-key]');
  if (optBtn) setAnswer(optBtn.getAttribute('data-key'), optBtn.getAttribute('data-value'));
});
el.qwrap.addEventListener('input', ev => {
  if (ev.target.tagName === 'TEXTAREA' && ev.target.dataset.key) {
    const key = ev.target.dataset.key;
    setAnswer(key, ev.target.value);
    // setAnswer -> render() reconstruye el <textarea>, así que se pierde el
    // foco a media escritura. Lo recuperamos en el siguiente frame.
    requestAnimationFrame(() => {
      const t = el.qList.querySelector('textarea[data-key="' + key.replace(/"/g, '\\"') + '"]');
      if (t) { t.focus(); const len = t.value.length; try { t.setSelectionRange(len, len); } catch (e) {} }
    });
  }
});

el.paperInner.addEventListener('click', ev => {
  if (ev.target.id === 'btnCopy') {
    const txt = buildSummary();
    if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
    state.copied = true;
    render();
    setTimeout(() => { state.copied = false; render(); }, 4000);
  } else if (ev.target.id === 'btnReset') {
    resetAll();
  }
});

// Guardado al cerrar/perder foco la pestaña: cubre a quien abandona a la mitad.
function sendOnLeave() {
  if (state.i > 0) sendToSheets();
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sendOnLeave(); });
window.addEventListener('pagehide', sendOnLeave);

// ----------------------------------------------------------------------------
// Arranque
// ----------------------------------------------------------------------------

render();
