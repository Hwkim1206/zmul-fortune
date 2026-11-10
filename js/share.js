/* 공유: 이미지 저장(html2canvas), 카카오톡 공유(앱 키 필요) */

const KAKAO_APP_KEY = ''; // 카카오 개발자 콘솔의 JavaScript 키. 넣으면 버튼이 활성화됨

/* 공유 카드 DOM을 PNG로 저장 */
async function saveShareImage() {
  const card = document.getElementById('shareCard');
  const btn = document.getElementById('saveImageBtn');
  btn.disabled = true;
  btn.textContent = '이미지 만드는 중...';
  try {
    const canvas = await html2canvas(card, { scale: 3, backgroundColor: null, useCORS: true });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = '제주동자석_행운카드.png';
    a.click();
  } catch (err) {
    alert('이미지를 만들지 못했어요. 다시 시도해 주세요.');
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = '이미지 저장';
  }
}

/* 카카오톡 공유. 앱 키가 있을 때만 동작 */
function initKakao() {
  const btn = document.getElementById('kakaoBtn');
  if (!KAKAO_APP_KEY || !window.Kakao) return; // 키 없음 → 버튼 비활성 유지
  if (!Kakao.isInitialized()) Kakao.init(KAKAO_APP_KEY);
  btn.disabled = false;
  btn.textContent = '카카오톡 공유';
  btn.addEventListener('click', () => {
    const f = state.fortune;
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '오늘의 제주 동자석 행운 카드',
        description: `${CONTENT.items[f.item].title} · ${f.headline}`,
        imageUrl: location.origin + '/assets/share_' + f.item + '.png', // 배포 시 지물별 썸네일 필요
        link: { mobileWebUrl: location.href, webUrl: location.href },
      },
      buttons: [{ title: '나도 뽑기', link: { mobileWebUrl: location.href, webUrl: location.href } }],
    });
  });
}
