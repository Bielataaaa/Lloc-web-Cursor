function go(id, btn) {
  document.querySelectorAll('.pg').forEach((p) => p.classList.remove('on'));
  document.querySelectorAll('.nb').forEach((b) => b.classList.remove('on'));
  document.getElementById(id).classList.add('on');
  if (btn) btn.classList.add('on');
}

function jumpTo(id) {
  const targetButton = [...document.querySelectorAll('.nb')].find((b) =>
    b.getAttribute('onclick')?.includes(`'${id}'`)
  );
  go(id, targetButton);
}

const attacks = [
  {
    name: 'Phishing',
    desc: 'Correus o missatges falsos que imiten empreses reals per robar dades. Comprova sempre el remitent i l’enllaç.',
    tag: 'Enginyeria social',
  },
  {
    name: 'Ransomware',
    desc: 'Programari maliciós que xifra arxius i demana un rescat. La millor defensa són còpies de seguretat regulars (regla 3-2-1).',
    tag: 'Malware',
  },
  {
    name: 'Man in the Middle',
    desc: 'Intercepció del trànsit en xarxes insegures. Evita Wi‑Fi públic sense protecció i utilitza HTTPS o VPN.',
    tag: 'Xarxa',
  },
  {
    name: 'Força bruta',
    desc: 'Proves automàtiques de milers de contrasenyes fins encertar. Solució: contrasenyes llargues, úniques i 2FA.',
    tag: 'Accés',
  },
];

const atkList = document.getElementById('atk-list');
attacks.forEach((a) => {
  const card = document.createElement('article');
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

const questions = [
  {
    q: 'Què és el phishing?',
    opts: ['Un antivirus', 'Correus falsos per robar dades', 'Un tallafoc'],
    ans: 1,
  },
  {
    q: 'Què vol dir 2FA?',
    opts: ['Dos factors d’autenticació', 'Dos fitxers adjunts', 'Dues VPN'],
    ans: 0,
  },
  {
    q: 'Quina és la millor pràctica de contrasenyes?',
    opts: ['Repetir la mateixa', 'Fer-la curta', 'Fer-la llarga i única'],
    ans: 2,
  },
  {
    q: 'Quina regla de còpies és recomanable?',
    opts: ['3-2-1', '1-1-1', '5-5-5'],
    ans: 0,
  },
];

let currentQ = 0;
let score = 0;

function renderQuiz() {
  const box = document.getElementById('qbox');
  if (currentQ >= questions.length) {
    box.innerHTML = `
      <div class="quiz-score">${score} / ${questions.length} correctes</div>
      <p>${score >= 3 ? 'Molt bé! Tens bona base.' : 'Bona feina. Repassa els conceptes i torna-ho a provar.'}</p>
      <button class="primary" onclick="resetQuiz()">Reiniciar quiz</button>
    `;
    return;
  }

  const q = questions[currentQ];
  box.innerHTML = `
    <p class="quiz-question">${currentQ + 1}/${questions.length} — ${q.q}</p>
    <div class="quiz-opts">
      ${q.opts
        .map((o, i) => `<button class="quiz-opt" onclick="answer(${i})">${o}</button>`)
        .join('')}
    </div>
  `;
}

function answer(i) {
  const btns = document.querySelectorAll('.quiz-opt');
  const correct = questions[currentQ].ans;
  btns.forEach((b) => (b.disabled = true));
  btns[correct].classList.add('correct');
  if (i !== correct) btns[i].classList.add('wrong');
  else score++;
  setTimeout(() => {
    currentQ++;
    renderQuiz();
  }, 850);
}

function resetQuiz() {
  currentQ = 0;
  score = 0;
  renderQuiz();
}

renderQuiz();

const crits = [
  ['len', '12+ caràcters', (v) => v.length >= 12],
  ['upper', 'Majúscules', (v) => /[A-Z]/.test(v)],
  ['lower', 'Minúscules', (v) => /[a-z]/.test(v)],
  ['num', 'Números', (v) => /[0-9]/.test(v)],
  ['sym', 'Símbols', (v) => /[^A-Za-z0-9]/.test(v)],
  ['rep', 'Sense repetició de 3+', (v) => v.length > 0 && !/(.)\1{2,}/.test(v)],
];

const critContainer = document.getElementById('pcrit');
crits.forEach(([id, label]) => {
  const div = document.createElement('div');
  div.className = 'crit';
  div.innerHTML = `<div class="crit-dot" id="d-${id}"></div>${label}`;
  critContainer.appendChild(div);
});

const strengthLabels = ['—', 'Molt feble', 'Feble', 'Acceptable', 'Forta', 'Molt forta', 'Excel·lent'];
const strengthColors = ['#f44336', '#f44336', '#ff9800', '#ff9800', '#4caf50', '#4caf50', '#4caf50'];

function testPw(v) {
  const results = crits.map(([id, , fn]) => {
    const ok = fn(v);
    document.getElementById(`d-${id}`).classList.toggle('ok', ok);
    return ok;
  });
  const pts = results.filter(Boolean).length;
  const pct = Math.round((pts / crits.length) * 100);
  const bar = document.getElementById('pbar');
  bar.style.width = `${pct}%`;
  bar.style.background = strengthColors[pts];
  document.getElementById('plbl').textContent = v ? strengthLabels[pts] : '—';
}

function subscribe(e) {
  e.preventDefault();
  const email = document.getElementById('mail');
  const msg = document.getElementById('sub-msg');
  msg.textContent = `Gràcies! ${email.value} s'ha subscrit correctament.`;
  email.value = '';
}