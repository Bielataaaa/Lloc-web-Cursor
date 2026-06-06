/* =============================================================================
   CYBERGUARD — app.js
   Toda la logica interactiva de la web. No hay backend: todo corre en el
   navegador del usuario.
   ============================================================================= */

/* ==================== NAVEGACION ==================== */

// Textos reutilizados en la interfaz
const TEXTO_EXPANDIR = 'Haz clic para ver mas';
const TEXTO_CONTRAER = 'Contraer';
const TEXTO_BOTON_COMPROBAR = '// comprobar_filtracion';
const TEXTO_BOTON_COMPROBANDO = '// comprobando...';

// Claves de los criterios del analizador de contraseñas (coinciden con ids en HTML)
const CLAVES_CRITERIOS = ['len', 'upper', 'lower', 'num', 'sym', 'rep'];

// Atajo para obtener un elemento del DOM por su id
const getEl = (id) => document.getElementById(id);

// Muestra el resultado de la comprobacion de filtraciones
const setPwnedResult = (el, html) => {
  el.className = 'pwned-result show';
  el.innerHTML = html;
};

// Marca como activo el enlace del menu que coincide con la seccion
function setNavActiveByHref(href) {
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === href);
  });
}

// Llamada desde onclick en los enlaces del menu
function setActive(el) {
  setNavActiveByHref(el.getAttribute('href'));
}

/* ==================== ATAQUES ==================== */

// Base de datos de ataques: cada objeto tiene titulo, descripcion, pasos y defensa
const attacks = [
  {
    id: 'phishing', icon: 'PH', risk: 'critical', riskLabel: 'Critico',
    title: 'Suplantacion (phishing)',
    short: 'Correos enganosos para robar credenciales o instalar malware.',
    desc: 'El phishing es uno de los ciberataques mas comunes. Los atacantes envian mensajes suplantando entidades de confianza para que pulses enlaces maliciosos o entregues credenciales.',
    steps: ['El atacante crea un correo convincente imitando una marca real', 'La victima abre una pagina falsa de inicio de sesion', 'Las credenciales se capturan y se envian al atacante', 'El atacante accede a la cuenta real'],
    defense: 'Verifica siempre el remitente. Ninguna empresa legitima pide tu contraseña por correo. Si dudas, entra manualmente en la web oficial y activa 2FA.'
  },
  {
    id: 'ransomware', icon: 'RA', risk: 'critical', riskLabel: 'Critico',
    title: 'Secuestro de datos (ransomware)',
    short: 'Malware que cifra archivos y exige un pago por el descifrado.',
    desc: 'El ransomware cifra archivos de un equipo o red y pide un rescate por la clave. Las variantes modernas tambien roban datos y amenazan con publicarlos.',
    steps: ['Entra por phishing, descargas maliciosas o servicios expuestos', 'Se propaga por la red en silencio', 'Activa el cifrado masivo de archivos', 'Muestra una nota de rescate en criptomonedas'],
    defense: 'La mejor defensa son copias de seguridad offline y desconectadas. No pagues el rescate: no garantiza recuperacion y financia mas ataques.'
  },
  {
    id: 'mitm', icon: 'MI', risk: 'high', riskLabel: 'Alto',
    title: 'Intermediario malicioso',
    short: 'Un atacante intercepta la comunicacion entre dos partes.',
    desc: 'El atacante se coloca entre dos partes que se comunican para espiar o modificar el trafico en tiempo real. Es comun en redes Wi-Fi publicas.',
    steps: ['El atacante se conecta a la misma red o crea una red falsa', 'Redirige el trafico con tecnicas de suplantacion', 'Lee, registra o altera datos en transito', 'Victima y servidor no detectan la interceptacion'],
    defense: 'Usa siempre HTTPS y una VPN de confianza en redes publicas. No ignores avisos de certificado del navegador.'
  },
  {
    id: 'sqli', icon: 'SQ', risk: 'high', riskLabel: 'Alto',
    title: 'Inyeccion SQL',
    short: 'Codigo SQL malicioso inyectado en formularios.',
    desc: 'Si una aplicacion inserta entrada del usuario en consultas SQL sin validacion, un atacante puede leer, modificar o borrar datos.',
    steps: ['Detecta un campo conectado a base de datos', 'Inyecta SQL como \' OR 1=1 --', 'La base ejecuta el SQL inyectado', 'Se extraen tablas o se evita el inicio de sesion'],
    defense: 'Como desarrollador, usa consultas parametrizadas y sentencias preparadas. Nunca concatentes entrada de usuario en SQL.'
  },
  {
    id: 'ddos', icon: 'DD', risk: 'high', riskLabel: 'Alto',
    title: 'Ataque de denegacion de servicio (DDoS)',
    short: 'Saturacion de trafico para tumbar un servicio.',
    desc: 'Un DDoS inunda un objetivo con trafico desde miles de dispositivos comprometidos y deja el servicio inaccesible.',
    steps: ['El atacante controla una botnet', 'Ordena trafico masivo simultaneo al objetivo', 'Se agotan ancho de banda, CPU o memoria', 'Los usuarios legitimos sufren errores y lentitud'],
    defense: 'Usa CDN y mitigacion DDoS. Aplica limites de tasa, monitoriza anomalias y prepara autoescalado.'
  },
  {
    id: 'social', icon: 'IS', risk: 'medium', riskLabel: 'Medio',
    title: 'Ingenieria social',
    short: 'Manipulacion psicologica para obtener informacion sensible.',
    desc: 'La ingenieria social explota la psicologia humana en lugar de fallos tecnicos. Busca urgencia, confianza falsa y suplantacion.',
    steps: ['Investiga a la victima en redes y fuentes publicas', 'Se hace pasar por alguien de confianza', 'Crea urgencia artificial para forzar accion', 'La victima entrega datos o ejecuta acciones riesgosas'],
    defense: 'Verifica siempre la identidad por un canal alternativo. Si hay urgencia extrema, desconfia y valida antes de actuar.'
  }
];

// Guarda el id del ataque actualmente expandido (null si ninguno)
let openAttack = null;

// Devuelve la clase CSS segun el nivel de riesgo
function getRiskClass(risk) {
  return risk === 'critical' ? 'risk-critical' : risk === 'high' ? 'risk-high' : 'risk-medium';
}

// Abre o cierra visualmente una tarjeta de ataque
function setAttackExpanded(id, expanded) {
  const card = getEl('card-' + id);
  const expandText = getEl('expand-' + id);
  if (!card || !expandText) return;
  card.classList.toggle('open', expanded);
  expandText.textContent = expanded ? TEXTO_CONTRAER : TEXTO_EXPANDIR;
}

// Genera las tarjetas de ataque en el grid del HTML
function buildAttacks() {
  const grid = getEl('attacks-grid');
  let html = '';
  attacks.forEach((a) => {
    const riskClass = getRiskClass(a.risk);
    html += `
      <div class="attack-card" id="card-${a.id}" onclick="toggleAttack('${a.id}')">
        <div class="attack-top">
          <div class="attack-icon">${a.icon}</div>
          <span class="risk-badge ${riskClass}">${a.riskLabel}</span>
        </div>
        <h3>${a.title}</h3>
        <p>${a.short}</p>
        <div class="attack-expand" id="expand-${a.id}">${TEXTO_EXPANDIR}</div>
      </div>`;
  });
  // Panel compartido donde se muestra el detalle del ataque seleccionado
  html += `<div class="attack-detail-panel" id="attack-panel"></div>`;
  grid.innerHTML = html;
}

// Al hacer clic en una tarjeta: muestra u oculta su detalle
function toggleAttack(id) {
  const panel = getEl('attack-panel');

  // Si ya estaba abierta, la cerramos
  if (openAttack === id) {
    panel.classList.remove('open');
    setAttackExpanded(id, false);
    openAttack = null;
    return;
  }

  // Cierra la tarjeta anterior si habia otra abierta
  if (openAttack) {
    setAttackExpanded(openAttack, false);
  }

  const a = attacks.find(x => x.id === id);

  // Rellena el panel con descripcion, pasos y consejo de defensa
  panel.innerHTML = `
    <div class="detail-inner">
      <div>
        <h4>Como funciona</h4>
        <p>${a.desc}</p>
      </div>
      <div>
        <h4>Flujo del ataque</h4>
        <ol class="attack-steps">${a.steps.map(s => `<li>${s}</li>`).join('')}</ol>
      </div>
      <div class="defense-tip">
        <h4>// Defensa</h4>
        <p>${a.defense}</p>
      </div>
    </div>`;
  panel.classList.add('open');
  setAttackExpanded(id, true);
  openAttack = id;
  setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}

// Inicializa las tarjetas al cargar la pagina
buildAttacks();

/* ==================== FILTRACIONES (Have I Been Pwned) ==================== */

// Permite comprobar con la tecla Enter
getEl('pwned-email').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkPwned();
});

// Consulta si un correo aparece en filtraciones conocidas
async function checkPwned() {
  const correo = getEl('pwned-email').value.trim();

  // Validacion basica del formato de correo
  if (!correo || !correo.includes('@')) { alert('Introduce un correo valido.'); return; }

  const btn = getEl('check-btn');
  const resultEl = getEl('pwned-result');
  btn.disabled = true;
  btn.textContent = TEXTO_BOTON_COMPROBANDO;
  resultEl.className = 'pwned-result';

  // Enlace de respaldo al comprobador oficial
  const officialUrl = `https://haveibeenpwned.com/account/${encodeURIComponent(correo)}`;

  try {
    // Timeout de 8 segundos por si la API tarda o no responde
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // Proxy CORS: el navegador no puede llamar directamente a HIBP,
    // asi que pasamos por allorigins.win que actua de intermediario
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent('https://haveibeenpwned.com/api/v2/breachedaccount/' + encodeURIComponent(correo) + '?truncateResponse=false')}`;
    const resp = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    const data = await resp.json();

    if (data.contents) {
      try {
        const parsed = JSON.parse(data.contents);

        // Si devuelve un array con filtraciones, el correo esta comprometido
        if (Array.isArray(parsed) && parsed.length > 0) {
          const names = parsed.slice(0, 10).map(b => b.Name || b.name || 'Desconocido');
          setPwnedResult(resultEl, `
            <div class="result-pwned">
              <div class="result-header">
                <span style="font-size:20px;">ALERTA</span>
                <h3>Detectado en ${parsed.length} filtracion${parsed.length > 1 ? 'es' : ''}!</h3>
              </div>
              <p class="result-body">Tu correo aparece en estas filtraciones. Cambia tus contraseñas cuanto antes y activa 2FA en las cuentas afectadas.</p>
              <div class="breach-tags">${names.map(n => `<span class="breach-tag">${n}</span>`).join('')}${parsed.length > 10 ? `<span class="breach-tag">+${parsed.length - 10} mas</span>` : ''}</div>
            </div>`);
        } else {
          showSafe(resultEl);
        }
      } catch(e) {
        // La respuesta no era JSON valido
        showManualCheck(resultEl, officialUrl);
      }
    } else {
      showManualCheck(resultEl, officialUrl);
    }
  } catch(e) {
    // Error de red, timeout o bloqueo CORS
    showManualCheck(resultEl, officialUrl);
  } finally {
    btn.disabled = false;
    btn.textContent = TEXTO_BOTON_COMPROBAR;
  }
}

// Muestra mensaje cuando no hay filtraciones detectadas
function showSafe(el) {
  setPwnedResult(el, `<div class="result-safe"><div class="result-header"><span style="font-size:20px;">OK</span><h3>No se han encontrado filtraciones</h3></div><p class="result-body">Tu correo no aparece en filtraciones conocidas con este metodo. Sigue usando contraseñas fuertes y unicas.</p></div>`);
}

// Si falla la API, ofrece el enlace directo a Have I Been Pwned
function showManualCheck(el, officialUrl) {
  setPwnedResult(el, `
    <div style="font-size:12px;color:var(--text-muted);padding:12px;background:var(--surface);border-radius:8px;border:0.5px solid var(--border);line-height:1.7;">
      No hemos podido validar automaticamente (CORS/API). Para una comprobacion fiable, abre el verificador oficial:
      <br><br>
      <a href="${officialUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--green);font-weight:700;">Abrir Have I Been Pwned para este correo</a>
    </div>`);
}

/* ==================== CUESTIONARIO ==================== */

// Banco de 6 preguntas: correct = indice de la respuesta correcta (0-based)
const quizData = [
  { q: 'Cual es la forma mas comun de distribuir ransomware?', opts: ['Memorias USB', 'Correos de phishing', 'Intrusion fisica', 'Hackeo por satelite'], correct: 1, explain: 'Mas del 90% del ransomware llega por correos de phishing con adjuntos o enlaces maliciosos.' },
  { q: 'Que protege principalmente HTTPS?', opts: ['Malware en tu dispositivo', 'Espionaje de datos en transito', 'Robo de contraseñas del servidor', 'Paginas de phishing'], correct: 1, explain: 'HTTPS cifra los datos en transito y evita escuchas tipo man-in-the-middle. No protege por si solo la base de datos del servidor ni detiene el phishing.' },
  { q: 'Cual de estas contraseñas tiene mayor entropia?', opts: ['P@ssw0rd123', 'correct-horse-battery', 'Qx#9mL!vKp2$', 'password2024!'], correct: 2, explain: 'Qx#9mL!vKp2$ mezcla mayusculas, minusculas, numeros y simbolos sin patrones de diccionario, por eso ofrece mas entropia por caracter.' },
  { q: 'Que es la autenticacion de dos factores?', opts: ['Dos contraseñas al iniciar sesion', 'Contraseña + segundo factor de verificacion', 'Solo inicio biometrico', 'Acceso a correo cifrado'], correct: 1, explain: 'La autenticacion de dos factores combina algo que sabes (contraseña) con algo que tienes (movil/token) o algo que eres (biometria).' },
  { q: 'Un "CEO" te escribe con urgencia pidiendo codigos de tarjetas regalo. Lo mas probable es...', opts: ['Una emergencia real', 'Compromiso de correo empresarial (BEC)', 'Una prueba interna de seguridad', 'Una simulacion de phishing'], correct: 1, explain: 'Es una estafa clasica de BEC. Los atacantes suplantan o comprometen correos ejecutivos para forzar peticiones financieras urgentes y falsas.' },
  { q: 'Que es una vulnerabilidad zero-day?', opts: ['Un fallo corregido el mismo dia', 'Un exploit sin parche disponible', 'Un virus que se borra en 24 horas', 'Un token de reseteo que expira a medianoche'], correct: 1, explain: 'Zero-day significa que el desarrollador ha tenido cero dias para corregirla. Son muy valiosas para atacantes porque aun no hay defensa completa.' },
];

let qIdx = 0;      // Pregunta actual (0 a 5)
let score = 0;       // Aciertos acumulados
let answered = false; // Evita responder dos veces la misma pregunta

// Dibuja la pregunta actual o la pantalla de resultados finales
function renderQuiz() {
  const box = getEl('quiz-box');

  // Si ya respondio todas, muestra puntuacion final
  if (qIdx >= quizData.length) {
    const pct = Math.round((score / quizData.length) * 100);
    const grade = pct >= 80 ? 'Excelente trabajo!' : pct >= 50 ? 'Buen intento.' : 'Sigue practicando.';
    box.innerHTML = `
      <div class="quiz-complete">
        <div class="quiz-complete-score">${score}/${quizData.length}</div>
        <div class="quiz-complete-sub">${pct}% correcto</div>
        <div class="quiz-complete-grade">${grade}</div>
        <button class="retry-btn" onclick="restartQuiz()">// reiniciar_quiz</button>
      </div>`;
    return;
  }

  const q = quizData[qIdx];
  answered = false;
  const pct = Math.round((qIdx / quizData.length) * 100);

  box.innerHTML = `
    <div class="quiz-header">
      <span class="quiz-header-left">P${qIdx + 1}</span>
      <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
      <span class="quiz-score-badge">${score} correcto</span>
    </div>
    <div class="quiz-body">
      <div class="quiz-question">${q.q}</div>
      <div class="quiz-options">${q.opts.map((o, i) => `<button class="quiz-opt" onclick="answerQuiz(${i})">${o}</button>`).join('')}</div>
      <div class="quiz-feedback" id="qfb"></div>
      <div class="quiz-footer">
        <button class="next-btn" id="next-btn" onclick="nextQ()">${qIdx === quizData.length - 1 ? 'Ver resultado' : 'Siguiente pregunta'}</button>
      </div>
    </div>`;
}

// Procesa la respuesta elegida: colorea botones y muestra explicacion
function answerQuiz(idx) {
  if (answered) return;
  answered = true;

  const q = quizData[qIdx];
  const opciones = document.querySelectorAll('.quiz-opt');
  opciones.forEach(b => b.disabled = true);

  // Marca la opcion elegida como correcta o incorrecta
  opciones[idx].classList.add(idx === q.correct ? 'correct' : 'wrong');
  if (idx !== q.correct) opciones[q.correct].classList.add('correct');
  if (idx === q.correct) score++;

  const fb = getEl('qfb');
  fb.className = 'quiz-feedback show ' + (idx === q.correct ? 'good' : 'bad');
  fb.textContent = (idx === q.correct ? 'Correcto. ' : 'Incorrecto. ') + q.explain;
  getEl('next-btn').classList.add('show');
}

function nextQ() { qIdx++; renderQuiz(); }
function restartQuiz() { qIdx = 0; score = 0; renderQuiz(); }
renderQuiz();

/* ==================== ANALIZADOR DE CONTRASEÑA ==================== */

// Evalua la fuerza de una contraseña en tiempo real (llamada desde oninput del HTML)
function testPassword(pw) {
  const bar = getEl('pw-bar');
  const strengthLbl = getEl('pw-strength');
  const entropyLbl = getEl('pw-entropy');
  const suggestions = getEl('pw-suggestions');

  // Comprueba cada criterio con expresiones regulares
  const criteria = {
    len: pw.length >= 12,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    num: /\d/.test(pw),
    sym: /[^a-zA-Z0-9]/.test(pw),
    rep: pw.length > 0 && !/(.)\1{2,}/.test(pw) // sin 3+ caracteres repetidos seguidos
  };

  // Actualiza los puntos verdes de cada criterio en la interfaz
  CLAVES_CRITERIOS.forEach(k => {
    getEl('d-' + k).classList.toggle('pass', criteria[k]);
    getEl('c-' + k).classList.toggle('pass', criteria[k]);
  });

  // Si el campo esta vacio, resetea la barra y los textos
  if (!pw) {
    bar.style.width = '0%';
    strengthLbl.textContent = '—';
    strengthLbl.style.color = 'var(--text-muted)';
    entropyLbl.textContent = '';
    suggestions.textContent = '';
    return;
  }

  // Calcula entropia aproximada en bits segun el espacio de caracteres usado
  const charspace = (criteria.lower?26:0)+(criteria.upper?26:0)+(criteria.num?10:0)+(criteria.sym?32:0);
  const bits = Math.round(pw.length * Math.log2(Math.max(charspace, 1)));

  // Puntuacion de 0 a 100 segun longitud y variedad de caracteres
  let s = 0;
  if (pw.length >= 8) s += 15;
  if (pw.length >= 12) s += 15;
  if (pw.length >= 16) s += 10;
  if (criteria.upper && criteria.lower) s += 15;
  if (criteria.num) s += 10;
  if (criteria.sym) s += 20;
  if (criteria.rep) s += 10;
  if (pw.length >= 20) s += 5;
  s = Math.min(s, 100);

  // Niveles de fuerza con color asociado para la barra
  const tiers = [
    { min:0,  lbl:'Muy debil',   color:'#e24b4a' },
    { min:25, lbl:'Debil',       color:'#f59e0b' },
    { min:45, lbl:'Aceptable',   color:'#d97706' },
    { min:65, lbl:'Fuerte',      color:'#65a30d' },
    { min:82, lbl:'Muy fuerte',  color:'#22c55e' },
  ];
  const tier = [...tiers].reverse().find(t => s >= t.min);

  bar.style.width = s + '%';
  bar.style.background = tier.color;
  strengthLbl.textContent = tier.lbl;
  strengthLbl.style.color = tier.color;
  entropyLbl.textContent = bits + ' bits de entropia';

  // Sugerencias de mejora segun criterios no cumplidos
  const tips = [];
  if (pw.length < 12) tips.push('Usa al menos 12 caracteres');
  if (!criteria.upper) tips.push('Anade mayusculas');
  if (!criteria.num) tips.push('Anade numeros');
  if (!criteria.sym) tips.push('Anade simbolos (!@#$%^&*)');
  if (!criteria.rep) tips.push('Evita caracteres repetidos');
  suggestions.innerHTML = tips.length ? tips.join('<br>') : (s >= 65 ? 'Composicion de contraseña solida.' : '');
  suggestions.style.color = s >= 65 ? '#a7f3d0' : 'var(--text-muted)';
}

/* ==================== SEGUIMIENTO DE SCROLL ==================== */

// Actualiza el menu activo automaticamente al hacer scroll por las secciones
const sections = ['attacks','pwned','quiz','tips','password'];
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      setNavActiveByHref('#' + e.target.id);
    }
  });
}, { threshold: 0.3 }); // Se activa cuando el 30% de la seccion es visible

sections.forEach(id => {
  const el = getEl(id);
  if (el) observer.observe(el);
});
