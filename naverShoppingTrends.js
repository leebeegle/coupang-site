// naverShoppingTrends.js
// 네이버 쇼핑 "베스트 키워드" 페이지에서
// 텍스트를 직접 파싱해서 인기 키워드 목록을 추출하는 버전

const cheerio = require("cheerio");

// categoryId / demo 값은 필요에 따라 바꿀 수 있음.
// 지금은 "전체 카테고리, 전체 연령/성별" 기준.
const CATEGORY_ID = "ALL"; // 전체
const AGE_GENDER = "A00";  // 전체 연령/성별

function buildUrl() {
  return `https://search.shopping.naver.com/best/category/keyword?categoryCategoryId=${CATEGORY_ID}&categoryDemo=${AGE_GENDER}&categoryRootCategoryId=ALL&chartRank=1&period=P1D`;
}

/**
 * 네이버 쇼핑 "베스트키워드" 페이지에서
 * 상위 limit개 키워드를 텍스트 기반으로 추출
 */
async function getShoppingTrendingKeywords(limit = 20) {
  const url = buildUrl();

  const headers = {
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
    "Accept-Encoding": "gzip"
  };

  console.log("네이버 쇼핑 인기 키워드 페이지 접속:", url);
  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`네이버 쇼핑 키워드 페이지 오류: ${res.status} ${text}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // 페이지 전체 텍스트를 줄 단위로 나눠서
  // "위 랭킹"이 들어간 줄에서 키워드 부분만 뽑아낸다.
  const text = $("body").text();
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.includes("위") &&
        l.includes("랭킹") &&
        (l.includes("펼침") || l.includes("접기"))
    );

  const keywords = [];

  for (const line of lines) {
    // 예시:
    // "1 위 랭킹 상승 음력달력 문구/사무용품 접기"
    // "2 위 랭킹 신규 근조리본 공구 펼침"
    const tokens = line.split(/\s+/).filter(Boolean);
    if (tokens.length < 5) continue;

    // 마지막 토큰: "펼침" or "접기"
    // 그 앞: 카테고리 (문구/사무용품, 공구, ...)
    // 그 앞: 우리가 쓸 키워드 (음력달력, 근조리본, ...)
    const last = tokens[tokens.length - 1];
    const category = tokens[tokens.length - 2];
    const keyword = tokens[tokens.length - 3];

    // 방어적으로 체크
    if (!keyword || !category) continue;
    if (!/펼침|접기/.test(last)) continue;

    // 너무 짧은 거 / 이상한 건 패스
    if (keyword.length < 2) continue;

    keywords.push(keyword);
  }

  // 중복 제거
  const unique = Array.from(new Set(keywords));

  if (unique.length === 0) {
    throw new Error(
      "텍스트에서 인기 키워드를 추출하지 못했습니다. 페이지 구조가 바뀌었을 수 있습니다."
    );
  }

  // 상위 limit개만 잘라서 반환
  const result = unique.slice(0, Math.min(limit, unique.length));
  console.log("네이버 쇼핑 인기 키워드 추출 결과:", result);

  return result;
}

module.exports = { getShoppingTrendingKeywords };
