// coupangApiClient.js
// 30개 카테고리를 완전 자동 랜덤으로 상품 30개 가져오는 모듈
// - 정식 카테고리: categoryId 로 베스트 API 호출
// - 전문관: 검색 API로 keyword 기반 상품 호출

require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");

// 정식 카테고리 (categoryId 존재)
const NORMAL_CATEGORIES = [
  { name: "패션의류/잡화", id: 186764 },
  { name: "뷰티", id: 176760 },
  { name: "출산/유아동", id: 195970 },
  { name: "식품", id: 194276 },
  { name: "주방용품", id: 195999 },
  { name: "생활용품", id: 195998 },
  { name: "홈인테리어", id: 195994 },
  { name: "가전디지털", id: 178255 },
  { name: "스포츠/레저", id: 177296 },
  { name: "자동차용품", id: 184141 },
  { name: "도서/음반/DVD", id: 185176 },
  { name: "완구/취미", id: 185179 },
  { name: "문구/오피스", id: 201943 },
  { name: "반려동물용품", id: 186245 },
  { name: "헬스/건강식품", id: 186654 },
];

// 전문관 (검색 API 기반)
const SPECIAL_CATEGORIES = [
  { name: "국내여행", keywords: ["여행 캐리어", "목베개"] },
  { name: "해외여행", keywords: ["여권 케이스", "여행 파우치"] },
  { name: "R.LUX", keywords: ["명품", "럭셔리"] },
  { name: "로켓설치", keywords: ["TV 설치", "에어컨 설치"] },
  { name: "공간별 집꾸미기", keywords: ["인테리어 조명", "홈데코"] },
  { name: "헬스케어 전문관", keywords: ["체중계", "안마기"] },
  { name: "쿠팡 Only", keywords: ["쿠팡PB", "쿠팡전용"] },
  { name: "싱글라이프", keywords: ["1인가구", "미니가전"] },
  { name: "악기전문관", keywords: ["기타", "피아노", "전자드럼"] },
  { name: "결혼준비", keywords: ["웨딩", "혼수"] },
  { name: "아트/공예", keywords: ["DIY", "미술용품"] },
  { name: "미세먼지용품", keywords: ["공기청정기", "KF94"] },
  { name: "홈카페", keywords: ["커피머신", "원두"] },
  { name: "실버스토어", keywords: ["효도선물", "건강보조"] },
  { name: "로켓펫닥터", keywords: ["반려동물 건강", "강아지 영양제"] },
];

// 랜덤 추출 유틸
function pick(array) {
  const idx = Math.floor(Math.random() * array.length);
  return array[idx];
}

/* ─────────────────────────
   1) 정식 카테고리 API
────────────────────────── */

const { getBestCategoryProducts } = require("./coupangApi");

/* ─────────────────────────
   2) 검색 API 로 전문관 상품 받기
────────────────────────── */

async function fetchSearchProducts(keyword, limit = 30) {
  const method = "GET";

  // 검색 API
  const path = `/v2/providers/affiliate_open_api/apis/openapi/products/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;

  const timestamp = String(Date.now());
  const signature = crypto
    .createHmac("sha256", process.env.CP_SECRET_KEY)
    .update(`${timestamp}${method}${path}`)
    .digest("hex");

  const headers = {
    "Content-Type": "application/json",
    "X-Coupang-Api-Key": process.env.CP_ACCESS_KEY,
    "X-Coupang-Timestamp": timestamp,
    "X-Coupang-Signature": signature,
  };

  const url = `https://api-gateway.coupang.com${path}`;

  const res = await axios.get(url, { headers });
  return res.data.data.productData || [];
}

/* ─────────────────────────
   3) 메인 함수: 랜덤 카테고리 상품 30개 가져오기
────────────────────────── */

async function fetchRandomProducts(limit = 30) {
  // 전체 카테고리 합치기
  const allCategories = [
    ...NORMAL_CATEGORIES.map((c) => ({ ...c, type: "normal" })),
    ...SPECIAL_CATEGORIES.map((c) => ({ ...c, type: "special" })),
  ];

  // 하나 랜덤 선택
  const selected = pick(allCategories);

  // 정식 카테고리 → 베스트 API
  if (selected.type === "normal") {
    const list = await getBestCategoryProducts(selected.id, limit);
    return {
      topCategoryName: selected.name,
      products: list || [],
    };
  }

  // 전문관 → 검색 API
  if (selected.type === "special") {
    const keyword = pick(selected.keywords);
    const list = await fetchSearchProducts(keyword, limit);
    return {
      topCategoryName: selected.name,
      products: list || [],
    };
  }
}

module.exports = {
  fetchRandomProducts,
};
