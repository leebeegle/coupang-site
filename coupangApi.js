// coupangApi.js
require("dotenv").config();
const crypto = require("crypto");

const BASE_URL = "https://api-gateway.coupang.com";

const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
const SECRET_KEY = process.env.COUPANG_SECRET_KEY;
const SUB_ID = process.env.COUPANG_SUB_ID || "";

if (!ACCESS_KEY || !SECRET_KEY) {
  throw new Error("COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY 미설정");
}

function makeDatetime() {
  const d = new Date();
  const yy = String(d.getUTCFullYear()).slice(2);
  const MM = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${yy}${MM}${dd}T${hh}${mm}${ss}Z`;
}

// 🔥 공식 포맷 — 절대 공백 넣지 말 것!
function generateHmac(method, urlPathWithQuery, body = null) {
  const [path, query = ""] = urlPathWithQuery.split("?");
  const datetime = makeDatetime();
  
  // HMAC 메시지 생성: datetime + method + path + query
  // POST 요청의 body는 서명에 포함되지 않음
  const message = datetime + method + path + query;

  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(message, "utf8")
    .digest("hex");

  return `CEA algorithm=HmacSHA256,access-key=${ACCESS_KEY},signed-date=${datetime},signature=${signature}`;
}

async function callCoupang(method, urlPathWithQuery, body = null) {
  const authorization = generateHmac(method, urlPathWithQuery, body);

  const options = {
    method,
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json;charset=UTF-8",
    },
  };

  if (body) {
    options.body = body;
  }

  const res = await fetch(BASE_URL + urlPathWithQuery, options);
  const resBody = await res.json();

  if (!res.ok || resBody.rCode !== "0") {
    throw new Error(
      `쿠팡 API 오류: ${res.status} - ${resBody.rMessage || "Unknown Error"}`
    );
  }

  if (!resBody.data || !resBody.data.productData) {
    console.warn("⚠️ API 응답에 data.productData 필드가 없습니다.", resBody);
    return [];
  }

  return resBody.data.productData;
}

async function getBestCategoryProducts(categoryId, limit = 10) {
  const path = `/v2/providers/affiliate_open_api/apis/openapi/products/bestcategories/${categoryId}?limit=${limit}&subId=${SUB_ID}`;
  return await callCoupang("GET", path);
}

// ----------------------------------------------------------------
// 🔥 검색 기반 상품 가져오기
// ----------------------------------------------------------------
async function searchProducts(keyword, limit = 10) {
  const encoded = encodeURIComponent(keyword);
  const path = `/v2/providers/affiliate_open_api/apis/openapi/products/search?keyword=${encoded}&limit=${limit}&subId=${SUB_ID}`;
  return await callCoupang("GET", path);
}

module.exports = {
  getBestCategoryProducts,
  searchProducts,
};
