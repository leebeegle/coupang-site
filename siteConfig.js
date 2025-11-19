// siteConfig.js
(function() {
  const domainMap = {
    "shop.friendstoktok.co.kr":    { id: "shop",    index: 0,  label: "데일리 쇼핑 가이드",   theme: "purple", naverVerification: "7626138d07a9191811b7ab1fc30cddba4520bf11" },
    "aurora.friendstoktok.co.kr":  { id: "aurora",  index: 1,  label: "오로라 특가 정보",     theme: "red",    naverVerification: "b847fb427f6d81f295d591dca70856cc67ff8d3b" },
    "meteor.friendstoktok.co.kr":  { id: "meteor",  index: 2,  label: "메테오 쇼핑 찬스",     theme: "green",  naverVerification: "2cd8c2a4d5660f5cd17e6dfd71e9c8292281bdf4" },
    "galaxy.friendstoktok.co.kr":  { id: "galaxy",  index: 3,  label: "갤럭시 쇼핑 정보",     theme: "blue",   naverVerification: "96dac739b13492d6e688c4f7a88df8da786fe60b" },
    "nebula.friendstoktok.co.kr":  { id: "nebula",  index: 4,  label: "네뷸라 가격 비교",     theme: "gold",   naverVerification: "090f9b6553237d4df202ff36953be5c61c8c2d1e" },
    "comet.friendstoktok.co.kr":   { id: "comet",   index: 5,  label: "코멧 핫딜 아이템",     theme: "purple", naverVerification: "4407a0c119021b3d7545f90bab6211c47b54ee36" },
    "orbit.friendstoktok.co.kr":   { id: "orbit",   index: 6,  label: "오빗 추천 상품",       theme: "red",    naverVerification: "540a4254c25bfb5a7faa08d400efb7ebda8fb100" },
    "saturn.friendstoktok.co.kr":  { id: "saturn",  index: 7,  label: "새턴 쇼핑 위클리",     theme: "green",  naverVerification: "8018e2c84e9a7157e2d085184499c5ae92f6a88a" },
    "jupiter.friendstoktok.co.kr": { id: "jupiter", index: 8,  label: "주피터 쇼핑 매거진",   theme: "blue",   naverVerification: "eab1fd92314693f0f8d0357df60322766f86aed0" },
    "venus.friendstoktok.co.kr":   { id: "venus",   index: 9,  label: "비너스 스타일 픽",     theme: "gold",   naverVerification: "e514aa1ca653dd935d995e9862d061d6a45fd92f" },
    "mercury.friendstoktok.co.kr": { id: "mercury", index: 10, label: "머큐리 쇼핑 노트",     theme: "purple", naverVerification: "ed628313b00d3d0bb573863791d6adf8a6607921" },
    "eclipse.friendstoktok.co.kr": { id: "eclipse", index: 11, label: "이클립스 특가 모음",   theme: "red",    naverVerification: "2462b53909249b58ae47aa5fa0b5b4f6efaebde5" },
    "nova.friendstoktok.co.kr":    { id: "nova",    index: 12, label: "노바 쇼핑 하이라이트",   theme: "green",  naverVerification: "995ab1d0ea4c95a0c888e0e5e22012e515d58301" },
    "cosmos.friendstoktok.co.kr":  { id: "cosmos",  index: 13, label: "코스모스 쇼핑 유니버스", theme: "blue",   naverVerification: "c684469212d4ea968376659b3ea68d14de9f6a9a" },
    "pluto.friendstoktok.co.kr":   { id: "pluto",   index: 14, label: "플루토 추천 아이템",     theme: "gold",   naverVerification: "d8f3161a56c7fda605c7223b4f4c13f27f1cbe8f" },
    "rocket.friendstoktok.co.kr":  { id: "rocket",  index: 15, label: "로켓 쇼핑 투데이",     theme: "purple", naverVerification: "59004d1a7f20ca13573217646dfb1c58adbcf504" },
    "apollo.friendstoktok.co.kr":  { id: "apollo",  index: 16, label: "아폴로 쇼핑 가이드",   theme: "red",    naverVerification: "22b2f7c516816c309b21ef11614eef920f739d86" },
    "luna.friendstoktok.co.kr":    { id: "luna",    index: 17, label: "루나의 쇼핑 다이어리",   theme: "green",  naverVerification: "ab10d2304e10617677cf379a16c2e9d345cf00e2" },
    "astro.friendstoktok.co.kr":   { id: "astro",   index: 18, label: "아스트로 쇼핑 월드",     theme: "blue",   naverVerification: "6dd009ee931e4bb83eae4d68d99e0768b971593e" },
    "stella.friendstoktok.co.kr":  { id: "stella",  index: 19, label: "스텔라의 추천 목록",   theme: "gold",   naverVerification: "d208186e6c263de7f1f6143395858643606248c6" },
    "solaris.friendstoktok.co.kr": { id: "solaris", index: 20, label: "솔라리스 쇼핑 정보",   theme: "purple", naverVerification: "a979a36e7ae9c4a8dd4ac07f80d6448e8ad5fb1a" }
  };

  const host = window.location.hostname;
  const info = domainMap[host] || domainMap["shop.friendstoktok.co.kr"];
  const totalSites = Object.keys(domainMap).length;

  // 전역으로 현재 사이트 정보 제공
  window.__SITE_INFO__ = {
    id: info.id,
    index: info.index,     // 0 ~ 20
    label: info.label,
    theme: info.theme,
    naverVerification: info.naverVerification,
    totalSites,
    domainMap
  };

  window.__SITE_ID__ = info.id;

  // 🔥 SEO 개선: 동적으로 헤더와 타이틀 변경
  window.addEventListener("DOMContentLoaded", () => {
    // 🔥 테마 적용: body에 data-theme 속성 추가
    document.body.setAttribute('data-theme', info.theme);

    // 🔥 네이버 사이트 인증: 메타 태그 동적 추가
    if (info.naverVerification) {
      const meta = document.createElement('meta');
      meta.name = 'naver-site-verification';
      meta.content = info.naverVerification;
      document.head.appendChild(meta);
    }

    document.title = info.label;
    const h1 = document.querySelector(".site-header h1");
    const subtitle = document.querySelector(".site-header .subtitle");
    if (h1) h1.textContent = info.label;
    if (subtitle) subtitle.textContent = `${info.label}에서 제공하는 쿠팡 인기 상품 정보입니다.`;
  });
})();
