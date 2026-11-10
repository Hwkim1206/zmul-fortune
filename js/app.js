/* 화면 전환과 전역 상태 */

const state = {
  birth: null,    // { y, m, d }
  scores: null,   // { luck, relation, health, money }
  item: null,     // 'flower' | 'mirror' | 'torch' | 'spoon'
  fortune: null,  // 결과 문구 묶음
};

/* 화면 진입 시 실행할 함수 (있을 때만) */
const onEnter = {};

function go(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const next = document.getElementById(id);
  if (next) next.classList.add('active');
  window.scrollTo(0, 0);
  if (onEnter[id]) onEnter[id]();
}

const ITEMS = ['flower', 'mirror', 'torch', 'spoon'];

/* 캐릭터 요소의 지물 클래스를 바꿈 */
function setChar(el, item) {
  ITEMS.forEach(i => el.classList.remove(i));
  el.classList.add(item);
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-go]');
  if (btn) go(btn.dataset.go);
});

/* ---------- 02 생년월일 ---------- */

const birthY = document.getElementById('birthY');
const birthM = document.getElementById('birthM');
const birthD = document.getElementById('birthD');
const birthError = document.getElementById('birthError');
const birthFields = [birthY, birthM, birthD];

function daysIn(y, m) { return new Date(y, m, 0).getDate(); }

/* 숫자만 남기고, 자릿수가 차면 다음 칸으로 */
function initBirth() {
  birthFields.forEach((el, i) => {
    el.addEventListener('input', () => {
      el.value = el.value.replace(/\D/g, '').slice(0, el.maxLength);
      el.closest('.field').classList.remove('is-error');
      birthError.hidden = true;
      const next = birthFields[i + 1];
      if (next && el.value.length === el.maxLength) next.focus();
    });
    // 백스페이스로 빈 칸에서 이전 칸으로
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !el.value && birthFields[i - 1]) birthFields[i - 1].focus();
    });
  });
}

/* 검증: 각 칸 범위 + 실제 존재하는 날짜 + 미래 아님. 잘못된 칸을 돌려줌 */
function validateBirth() {
  const y = Number(birthY.value), m = Number(birthM.value), d = Number(birthD.value);
  const now = new Date();
  const bad = [];
  if (!birthY.value || y < 1900 || y > now.getFullYear()) bad.push(birthY);
  if (!birthM.value || m < 1 || m > 12) bad.push(birthM);
  if (!birthD.value || d < 1 || d > 31) bad.push(birthD);
  if (!bad.length) {
    if (d > daysIn(y, m)) bad.push(birthD);
    else if (new Date(y, m - 1, d) > now) bad.push(birthY);
  }
  return { ok: !bad.length, bad, y, m, d };
}

document.getElementById('birthForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const r = validateBirth();
  birthFields.forEach(el => el.closest('.field').classList.toggle('is-error', r.bad.includes(el)));
  birthError.hidden = r.ok;
  if (!r.ok) { r.bad[0].focus(); return; }
  state.birth = { y: r.y, m: r.m, d: r.d };
  go('loading');
});

initBirth();

/* ---------- 03 로딩 ---------- */

const LOADING_MS = 2500;

onEnter.loading = () => {
  // 생일 없이 개발용으로 바로 들어온 경우 임시값
  if (!state.birth) state.birth = { y: 1995, m: 1, d: 1 };

  setChar(document.getElementById('loadingChar'), ITEMS[Math.floor(Math.random() * ITEMS.length)]);
  document.getElementById('factText').textContent = randomFact();
  document.getElementById('loadingTitle').innerHTML =
    CONTENT.loadingTitles[Math.floor(Math.random() * CONTENT.loadingTitles.length)];

  state.fortune = buildFortune(state.birth);
  state.item = state.fortune.item;

  setTimeout(() => go('card'), LOADING_MS);
};

/* ---------- 04 카드 뒤집기 ---------- */

const luckCard = document.getElementById('luckCard');
const cardScreen = document.getElementById('card');

onEnter.card = () => {
  if (!state.fortune) { state.birth = state.birth || { y: 1995, m: 1, d: 1 }; state.fortune = buildFortune(state.birth); state.item = state.fortune.item; }
  luckCard.classList.remove('flipped');
  cardScreen.classList.remove('revealed');
  setChar(document.getElementById('cardChar'), state.item);
  document.getElementById('cardName').textContent = CONTENT.items[state.item].title;
};

function flipCard() {
  if (luckCard.classList.contains('flipped')) return;
  luckCard.classList.add('flipped');
  cardScreen.classList.add('revealed');
}

luckCard.addEventListener('click', flipCard); // 자동 이동 없음, 버튼으로 진행

/* ---------- 05 메인 결과 ---------- */

/* 개발용 진입 등 결과가 없으면 임시 생일로 생성 */
function ensureFortune() {
  if (state.fortune) return;
  state.birth = state.birth || { y: 1995, m: 1, d: 1 };
  state.fortune = buildFortune(state.birth);
  state.item = state.fortune.item;
}

onEnter.result = () => {
  ensureFortune();
  const f = state.fortune;
  setChar(document.getElementById('resultChar'), f.item);
  document.getElementById('resultHeadline').textContent = f.headline;
  document.getElementById('resultGuide').textContent = f.guide;
  const tags = document.getElementById('resultTags');
  tags.innerHTML = '';
  f.keywords.forEach(k => {
    const li = document.createElement('li');
    li.textContent = '#' + k;
    tags.appendChild(li);
  });
};

/* ---------- 06 상세 운세 ---------- */

const detailTabs = document.getElementById('detailTabs');

function renderTab(key) {
  const f = state.fortune;
  const label = document.getElementById('detailLabel');
  const score = document.getElementById('detailScore');
  const gauge = document.getElementById('detailGauge');
  const text = document.getElementById('detailText');
  const mini = document.getElementById('miniList');

  detailTabs.querySelectorAll('.tab').forEach(t => t.classList.toggle('is-active', t.dataset.tab === key));

  let value, tierLabel, body;
  if (key === 'total') {
    value = f.total; tierLabel = f.totalLabel; body = f.totalText;
    mini.innerHTML = AREAS.map(a => `
      <li><span>${CONTENT.areaNames[a]}</span>
          <div class="gauge"><div class="gauge-fill" style="width:${f.scores[a]}%"></div></div>
          <span class="mini-score">${f.scores[a]}</span></li>`).join('');
  } else {
    const area = f.areas[key];
    value = area.score; tierLabel = area.label; body = area.text;
    mini.innerHTML = '';
  }

  label.textContent = tierLabel;
  score.textContent = value;
  text.textContent = body;

  // 게이지: 0에서 점수까지 채움
  gauge.style.transition = 'none';
  gauge.style.width = '0';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    gauge.style.transition = '';
    gauge.style.width = value + '%';
  }));
}

detailTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (tab) renderTab(tab.dataset.tab);
});

onEnter.detail = () => { ensureFortune(); renderTab('total'); };

/* ---------- 07 공유 모달 ---------- */

const shareModal = document.getElementById('share');

function openShare() {
  ensureFortune();
  const f = state.fortune;
  setChar(document.getElementById('shareChar'), f.item);
  document.getElementById('shareName').textContent = CONTENT.items[f.item].title;
  document.getElementById('shareHeadline').textContent = f.headline;
  document.getElementById('shareScores').innerHTML = AREAS
    .map(a => `<li>${CONTENT.areaNames[a]}<b>${f.scores[a]}</b></li>`).join('');
  shareModal.hidden = false;
}
function closeShare() { shareModal.hidden = true; }

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-open="share"]')) openShare();
  if (e.target.closest('[data-close="share"]')) closeShare();
});
document.getElementById('saveImageBtn').addEventListener('click', saveShareImage);
initKakao();

/* 개발용: index.html#birth 처럼 열면 해당 화면으로 바로 이동 */
if (location.hash) {
  const [screen, flag] = location.hash.slice(1).split('.');
  go(screen);
  if (screen === 'card' && flag === 'flipped') flipCard();   // #card.flipped → 뒤집힌 상태
  if (screen === 'detail' && flag) renderTab(flag);           // #detail.luck → 해당 탭
  if (screen === 'share') { go('detail'); openShare(); }      // #share → 상세 위에 모달
}
