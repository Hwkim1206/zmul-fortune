/* 운세 계산: 생년월일 + 오늘 날짜 → 시드 난수 → 점수 → 지물 → 문구
   같은 생일, 같은 날짜면 항상 같은 결과가 나온다. */

const AREAS = ['luck', 'relation', 'health', 'money'];
const ITEM_BY_AREA = { luck: 'flower', relation: 'mirror', health: 'torch', money: 'spoon' };

/* 문자열 → 32비트 정수 해시 (FNV-1a) */
function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/* 시드 기반 결정적 난수 생성기 (mulberry32). 호출할 때마다 0~1 사이 값 */
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/* 점수 → 5단계 등급 키. 경계는 위에서부터 great/good/normal/care 시작점 */
const AREA_CUTS  = [80, 60, 40, 20]; // 영역 점수: 균등분포 → 20점 간격
const TOTAL_CUTS = [62, 54, 46, 38]; // 종합 점수: 4개 평균이라 정규분포 → 20% 분위 경계

function tierOf(score, cuts = AREA_CUTS) {
  if (score >= cuts[0]) return 'great';   // 대길
  if (score >= cuts[1]) return 'good';    // 길
  if (score >= cuts[2]) return 'normal';  // 평
  if (score >= cuts[3]) return 'care';    // 흉 → 쉬어가는 날
  return 'rest';                          // 대흉 → 다지는 날
}

/* 배열에서 시드 난수로 하나 고르기 */
function pickOne(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

/* 배열에서 서로 다른 n개 고르기 */
function pickMany(rng, arr, n) {
  const pool = arr.slice();
  const out = [];
  while (out.length < n && pool.length) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

/* 메인 함수: birth = { y, m, d } */
function buildFortune(birth) {
  const seed = hashString(`${birth.y}-${birth.m}-${birth.d}|${todayKey()}`);
  const rng = makeRng(seed);

  // 영역별 점수 0~100
  const scores = {};
  AREAS.forEach(a => { scores[a] = Math.round(rng() * 100); });

  // 최고점 영역 → 지물. 동점이면 먼저 나온 영역
  const topArea = AREAS.reduce((best, a) => (scores[a] > scores[best] ? a : best), AREAS[0]);
  const item = ITEM_BY_AREA[topArea];

  // 종합 점수 = 평균
  const total = Math.round(AREAS.reduce((s, a) => s + scores[a], 0) / AREAS.length);

  // 문구 조립
  const itemData = CONTENT.items[item];
  const areas = {};
  AREAS.forEach(a => {
    const tier = tierOf(scores[a]);
    areas[a] = {
      score: scores[a],
      tier,
      label: CONTENT.tiers[tier].label,
      text: pickOne(rng, CONTENT.areas[a][tier]),
    };
  });
  const totalTier = tierOf(total, TOTAL_CUTS);

  return {
    item,
    topArea,
    scores,
    total,
    totalTier,
    totalLabel: CONTENT.tiers[totalTier].label,
    totalText: pickOne(rng, CONTENT.total[totalTier]),
    headline: pickOne(rng, itemData.headlines),
    keywords: pickMany(rng, itemData.keywords, 3),
    guide: pickOne(rng, itemData.guides),
    areas,
  };
}

/* 로딩 화면용 상식 한 줄 (매번 진짜 랜덤) */
function randomFact() {
  return CONTENT.facts[Math.floor(Math.random() * CONTENT.facts.length)];
}
