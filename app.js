// --- NAVEGACIO ---
function go(id, btn) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.nb').forEach(b => b.classList.remove('on'));
  document.getElementById(id).classList.add('on');
  btn.classList.add('on');
}

// --- ATACS ---
const attacks = [
  { name: 'Phishing',         desc: 'Correus falsos que imiten entitats legítimes per robar credencials. Verifica sempre el remitent i els enllaços abans de fer clic.', tag: 'Social' },
  { name: 'Ransomware',       desc: 'Xifra els teus arxius i demana un rescat. La millor defensa són còpies de seguretat regulars seguint la regla 3-2-1.',              tag: 'Malware' },
  { name: 'Man in the Middle',desc: 'Intercepta el teu trànsit en xarxes públiques. Fes servir sempre HTTPS i VPN per protegir-te.',                                       tag: 'Xarxa' },
  { name: 'Força bruta',      desc: 'Prova milers de contrasenyes fins a encertar. Fes servir contrasenyes llargues i úniques per a cada servei.',                        tag: 'Accés' },
];

const atkList = document.getElementById('atk-list');
attacks.forEach(a => {
  const card = document.createElement('div');
  card.className = 'atk-card';
  card.innerHTML = `
    <div class="atk-header">
      <span class="atk-name">${a.name}</span>
      <span class="tag">${a.tag}</span>
    </div>
    <div class="atk-desc">${a.desc}</div>
  `;
  card.addEventListener('click', () => card.classList.toggle('open'));
  atkList.appendChild(card);
});

// --- QÜESTIONARI ---
const questions = [
  { q: 'Què és el phishing?',           opts: ['Un antivirus', 'Correus falsos per robar dades', 'Un protocol de xarxa'], ans: 1 },
  { q: 'Què vol dir 2FA?',              opts: ['Dos tallafocs', 'Doble factor d\'autenticació', 'Dos fitxers adjunts'], ans: 1 },
  { q: 'Quina és la regla de còpies?',  opts: ['1-1-1', '2-1-0', '3-2-1'], ans: 2 },
];

let currentQ = 0;
let score = 0;

function renderQuiz() {
  const box = document.getElementById('qbox');

  if (currentQ >= questions.length) {
    box.innerHTML = `<div class="quiz-score">${score} / ${questions.length} correctes</div>`;
    return;
  }

  const q = questions[currentQ];
  box.innerHTML = `
    <p class="quiz-question">${currentQ + 1}/${questions.length} — ${q.q}</p>
    <div class="quiz-opts">
      ${q.opts.map((o, i) => `<button class="quiz-opt" onclick="answer(${i})">${o}</button>`).join('')}
    </div>
  `;
}

function answer(i) {
  const btns = document.querySelectorAll('.quiz-opt');
  const correct = questions[currentQ].ans;

  btns.forEach(b => b.disabled = true);
  btns[correct].classList.add('correct');
  if (i !== correct) btns[i].classList.add('wrong');
  else score++;

  setTimeout(() => { currentQ++; renderQuiz(); }, 800);
}

renderQuiz();

// --- CONTRASENYA ---
const crits = [
  ['len',   '12+ caràcters',      v => v.length >= 12],
  ['upper', 'Majúscules',         v => /[A-Z]/.test(v)],
  ['lower', 'Minúscules',         v => /[a-z]/.test(v)],
  ['num',   'Números',            v => /[0-9]/.test(v)],
  ['sym',   'Símbols',            v => /[^A-Za-z0-9]/.test(v)],
  ['rep',   'Sense repetició',    v => v.length > 0 && !/(.)\1{2,}/.test(v)],
];

const critContainer = document.getElementById('pcrit');
crits.forEach(([id, label]) => {
  const div = document.createElement('div');
  div.className = 'crit';
  div.innerHTML = `<div class="crit-dot" id="d-${id}"></div>${label}`;
  critContainer.appendChild(div);
});

const strengthLabels = ['—', 'Molt feble', 'Feble', 'Acceptable', 'Forta', 'Molt forta', 'Excel·lent'];
const strengthColors = ['#e24b4a', '#e24b4a', '#ba7517', '#ba7517', '#3b6d11', '#3b6d11', '#3b6d11'];

function testPw(v) {
  const results = crits.map(([id, , fn]) => {
    const ok = fn(v);
    document.getElementById('d-' + id).classList.toggle('ok', ok);
    return ok;
  });

  const pts = results.filter(Boolean).length;
  const pct = Math.round((pts / crits.length) * 100);

  document.getElementById('pbar').style.width  = pct + '%';
  document.getElementById('pbar').style.background = strengthColors[pts];
  document.getElementById('plbl').textContent  = v ? strengthLabels[pts] : '—';
}