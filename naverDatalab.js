// naverDatalab.js
// 네이버 데이터랩(통합 검색어 트렌드)로
// "대형 후보 키워드 풀"을 평가해서
// 최근 7일 기준으로 잘 나가는 것들 중에서
// 랜덤으로 limit개 뽑아서 반환

require("dotenv").config();

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
  throw new Error("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 이 .env 에 없습니다.");
}

// 날짜 YYYY-MM-DD
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// n일 전 날짜
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// 네이버 데이터랩에 실제로 한 번 호출하는 함수 (keywordGroups 최대 5개)
async function callDatalab(keywordGroups) {
  const endDate = formatDate(new Date());
  const startDate = formatDate(daysAgo(7)); // 최근 7일

  const body = {
    startDate,
    endDate,
    timeUnit: "date",
    keywordGroups,
    device: "mo", // 모바일 기준
    ages: ["3", "4", "5", "6", "7"], // 19~49 정도
    gender: ""
  };

  const res = await fetch("https://openapi.naver.com/v1/datalab/search", {
    method: "POST",
    headers: {
      "X-Naver-Client-Id": NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`네이버 데이터랩 API 오류: ${res.status} ${text}`);
  }

  return res.json();
}

/**
 * 네이버 데이터랩으로 미리 정의된 "대형 후보 키워드 풀"을 평가해서
 * 최근 7일 기준으로 잘 나가는 것들 중에서
 * 랜덤으로 limit개 뽑아서 반환
 */
async function getTrendingKeywords(limit = 5) {
  // ✅ 후보 키워드 풀 – 여기만 잘 관리해두면 됨
  const keywordGroups = [
    // 가구/인테리어
    { groupName: "소파", keywords: ["소파", "쇼파", "패브릭 소파", "3인용 소파"] },
    { groupName: "책상", keywords: ["책상", "컴퓨터 책상", "게이밍 책상"] },
    { groupName: "의자", keywords: ["의자", "컴퓨터 의자", "사무용 의자"] },

    // 생활가전
    { groupName: "청소기", keywords: ["무선 청소기", "청소기", "싸이클론 청소기"] },
    { groupName: "로봇청소기", keywords: ["로봇청소기", "물걸레 로봇청소기"] },
    { groupName: "에어컨", keywords: ["에어컨", "벽걸이 에어컨", "스탠드 에어컨"] },
    { groupName: "세탁기", keywords: ["세탁기", "드럼 세탁기", "통돌이 세탁기"] },
    { groupName: "냉장고", keywords: ["냉장고", "양문형 냉장고", "비스포크 냉장고"] },
    { groupName: "건조기", keywords: ["건조기", "의류건조기"] },
    { groupName: "가습기", keywords: ["가습기", "초음파 가습기", "가열식 가습기"] },

    // 계절/난방/쿨링
    { groupName: "전기장판", keywords: ["전기장판", "온수매트", "전기요"] },
    { groupName: "전기히터", keywords: ["전기히터", "온풍기", "온풍히터"] },
    { groupName: "선풍기", keywords: ["선풍기", "서큘레이터", "타워형 선풍기"] },

    // 주방/소형가전
    { groupName: "에어프라이어", keywords: ["에어프라이어", "에어프라이어 오븐"] },
    { groupName: "전자레인지", keywords: ["전자레인지", "렌지"] },
    { groupName: "커피머신", keywords: ["커피머신", "드립커피 머신", "캡슐 커피머신"] },
    { groupName: "블렌더", keywords: ["믹서기", "블렌더", "주스기"] },
    { groupName: "전기포트", keywords: ["전기포트", "티포트"] },

    // 패션/의류
    { groupName: "패딩", keywords: ["패딩", "롱패딩", "숏패딩"] },
    { groupName: "코트", keywords: ["코트", "롱코트", "겨울 코트"] },
    { groupName: "맨투맨", keywords: ["맨투맨", "후드티"] },
    { groupName: "운동화", keywords: ["운동화", "러닝화", "스니커즈"] },

    // 반려동물
    { groupName: "강아지 사료", keywords: ["강아지 사료", "강아지 간식"] },
    { groupName: "고양이 사료", keywords: ["고양이 사료", "고양이 모래"] },

    // 자동차/차량용품
    { groupName: "차량용 청소기", keywords: ["차량용 청소기", "차량용 무선 청소기"] },
    { groupName: "차량용 방향제", keywords: ["차량용 방향제", "차량용 디퓨저"] },

    // 캠핑/레저
    { groupName: "텐트", keywords: ["텐트", "캠핑 텐트", "원터치 텐트"] },
    { groupName: "캠핑 의자", keywords: ["캠핑 의자", "야전의자"] },

    // 게임/IT
    { groupName: "게이밍 키보드", keywords: ["게이밍 키보드", "기계식 키보드"] },
    { groupName: "게이밍 마우스", keywords: ["게이밍 마우스", "무선 마우스"] },
    { groupName: "게임패드", keywords: ["게임패드", "콘솔 게임패드"] }
  ];

  // 👉 네이버 제한 때문에 keywordGroups 를 5개씩 끊어서 여러 번 호출
  const chunkSize = 5;
  const allScores = [];

  for (let i = 0; i < keywordGroups.length; i += chunkSize) {
    const chunk = keywordGroups.slice(i, i + chunkSize);
    const json = await callDatalab(chunk);

    const scored = (json.results || []).map((r) => {
      const data = r.data || [];
      const last = data[data.length - 1];
      const lastRatio = last ? last.ratio : 0;
      return {
        groupName: r.title, // 우리가 넣은 groupName
        score: lastRatio
      };
    });

    allScores.push(...scored);
  }

  // 점수 높은 순으로 정렬
  allScores.sort((a, b) => b.score - a.score);

  // 1) 상위권을 풀(pool)로 사용 (예: 상위 40개)
  const poolSize = 40;
  const pool = allScores.slice(0, Math.min(poolSize, allScores.length));

  // 2) 풀을 한 번 섞는다 (Fisher–Yates shuffle)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // 3) 섞인 풀에서 limit개만 뽑아서 반환
  const top = pool.slice(0, limit).map((s) => s.groupName);

  console.log("네이버 데이터랩 상위 랜덤 키워드:", top);
  return top;
}

module.exports = { getTrendingKeywords };
