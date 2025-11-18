// coupangApi.js
require("dotenv").config();
const crypto = require("crypto");

const BASE_URL = "https://api-gateway.coupang.com";

const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
const SECRET_KEY = process.env.COUPANG_SECRET_KEY;
const SUB_ID = process.env.COUPANG_SUB_ID || "";

// 키가 없으면 바로 에러
if (!ACCESS_KEY || !SECRET_KEY) {
  throw new Error(
    "COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY 가 .env 에 설정되어 있지 않습니다."
  );
}

// 쿠팡 HMAC에서 쓰는 GMT 시간 포맷: yyMMdd'T'HHmmss'Z'
function makeDatetime() {
  const d = new Date();
  const yy = String(d.getUTCFullYear()).slice(2); // 뒤 2자리
  const MM = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${yy}${MM}${dd}T${hh}${mm}${ss}Z`;
}

// 공식 문서 방식과 동일:
// message = datetime + method + path + query
function generateHmac(method, urlPathWithQuery) {
  const [path, query = ""] = urlPathWithQuery.split("?");

  const datetime = makeDatetime();
  const message = datetime + method + path + query;

  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(message, "utf8")
    .digest("hex");

  const authorization = `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`;

  return authorization;
}

// 공통 호출 함수
async function callCoupang(method, urlPathWithQuery) {
  const authorization = generateHmac(method, urlPathWithQuery);

  const res = await fetch(BASE_URL + urlPathWithQuery, {
    method,
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json;charset=UTF-8",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`쿠팡 API 오류: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json;
}

// ✅ 1) 키워드 검색
async function searchProducts(keyword, limit = 6) {
  let path =
    `/v2/providers/affiliate_open_api/apis/openapi/products/search` +
    `?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;

  if (SUB_ID) {
    path += `&subId=${encodeURIComponent(SUB_ID)}`;
  }

  const json = await callCoupang("GET", path);
  const data = json.data || {};

  if (Array.isArray(data.productData)) return data.productData;
  if (Array.isArray(data)) return data;
  return [];
}

// ✅ 2) 카테고리별 베스트 상품
async function getBestCategoryProducts(categoryId, limit = 20) {
  let path =
    `/v2/providers/affiliate_open_api/apis/openapi/products/bestcategories/${categoryId}` +
    `?limit=${limit}`;

  if (SUB_ID) {
    path += `&subId=${encodeURIComponent(SUB_ID)}`;
  }

  const json = await callCoupang("GET", path);
  const data = json.data || {};

  if (Array.isArray(data.productData)) return data.productData;
  if (Array.isArray(data)) return data;
  return [];
}

// ✅ 3) 골드박스 상품
async function getGoldboxProducts(limit = 20) {
  let path =
    `/v2/providers/affiliate_open_api/apis/openapi/products/goldbox` +
    `?limit=${limit}`;

  if (SUB_ID) {
    path += `&subId=${encodeURIComponent(SUB_ID)}`;
  }

  const json = await callCoupang("GET", path);
  const data = json.data || {};

  if (Array.isArray(data.productData)) return data.productData;
  if (Array.isArray(data)) return data;
  return [];
}

module.exports = {
  searchProducts,
  getBestCategoryProducts,
  getGoldboxProducts,
};
