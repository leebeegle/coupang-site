// dailyKeywords.js
const { execSync } = require("child_process");
const { getBestCategoryProducts } = require("./coupangApi");

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

function extractKeywordFromName(name) {
  if (!name) return "쿠팡 베스트";

  const lower = name.toLowerCase();

  const SPECIAL_KEYWORDS = [
    "에어팟",
    "airpods",
    "아이패드",
    "ipad",
    "갤럭시 버즈",
    "갤럭시버즈",
    "galaxy buds",
    "갤럭시 탭",
    "갤럭시탭",
    "galaxy tab",
    "플스5",
    "ps5",
    "playstation 5",
  ];

  for (const kw of SPECIAL_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) return kw;
  }

  let cleaned = name
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\([^)]*\)/g, "");

  const tokens = cleaned.split(/[\s,/]+/).filter(Boolean);
  if (tokens.length === 0) return name.trim();
  if (tokens.length === 1) return tokens[0];
  return tokens.slice(0, 2).join(" ");
}

(async () => {
  try {
    const CATEGORY_ID = 1016; // 가전디지털
    const CATEGORY_NAME = "가전·디지털";

    console.log("가전디지털 카테고리 베스트 20개 가져오는 중...");
    const bestProducts = await getBestCategoryProducts(CATEGORY_ID, 20);

    if (!bestProducts || bestProducts.length === 0) {
      console.log("베스트 상품을 가져오지 못했습니다. 종료합니다.");
      return;
    }

    console.log("가져온 베스트 상품 개수:", bestProducts.length);

    const selected = pickRandom(bestProducts);
    const productName = selected.productName || selected.title || "이름 없음";

    console.log("\n랜덤 선택된 상품:");
    console.log("▶", productName);

    const keyword = extractKeywordFromName(productName);

    console.log(`\n검색 키워드: "${keyword}" (카테고리: ${CATEGORY_NAME})`);

    const cmdAutoPost = `node autoPost.js "${keyword}" "${CATEGORY_NAME}"`;
    console.log(`\n===== 실행: ${cmdAutoPost} =====`);
    execSync(cmdAutoPost, { stdio: "inherit" });

    console.log('\n===== 실행: node generate.js =====');
    execSync("node generate.js", { stdio: "inherit" });

    console.log("\n✅ 랜덤 베스트 상품 기반 가격 비교 글 생성 + 사이트 빌드 완료");
  } catch (err) {
    console.error("dailyKeywords 실행 중 오류:", err);
  }
})();
