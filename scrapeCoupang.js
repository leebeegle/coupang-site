const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

// 날짜를 YYYY-MM-DD 형태로 포맷
function formatDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 한글 키워드 → slug 형식으로
function makeSlug(keyword) {
  return (
    keyword
      .trim()
      .replace(/\s+/g, "-") // 공백 → -
      .replace(/[^a-zA-Z0-9가-힣\-]/g, "") +
    "-" +
    formatDate()
  );
}

// 쿠팡 검색 페이지에서 HTML을 받아와서 상품 파싱
async function scrape(keyword, limit = 6) {
  const url = `https://www.coupang.com/np/search?q=${encodeURIComponent(
    keyword
  )}&channel=user`;

  console.log(`쿠팡 검색 페이지 접속 중: ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP 오류: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const items = $("li.search-product");
  const result = [];

  items.each((_, el) => {
    if (result.length >= limit) return false;

    const $el = $(el);

    // 광고 상품 제외
    if (
      $el.attr("data-is-ad") === "true" ||
      $el.find(".ad-badge,.search-product__ad-badge").length > 0
    ) {
      return;
    }

    const name = $el.find(".name").text().trim();
    const priceVal = $el.find(".price-value").first().text().trim();
    const imgEl = $el.find("img.search-product-wrap-img");
    const linkEl = $el.find("a.search-product-link");

    const imgSrc =
      imgEl.attr("data-img-src") || imgEl.attr("src");
    const href = linkEl.attr("href");

    if (!name || !priceVal || !imgSrc || !href) return;

    const price = "₩ " + priceVal;
    const image = imgSrc.startsWith("http") ? imgSrc : "https:" + imgSrc;
    const link = href.startsWith("http")
      ? href
      : "https://www.coupang.com" + href;

    result.push({ name, price, image, link });
  });

  return result;
}

async function main() {
  const keyword = process.argv[2];

  if (!keyword) {
    console.error('사용법: node scrapeCoupang.js "검색어"');
    process.exit(1);
  }

  console.log(`키워드 "${keyword}" 로 상품을 가져옵니다...`);

  let products;
  try {
    products = await scrape(keyword, 6);
  } catch (e) {
    console.error("스크래핑 중 치명적인 오류가 발생했습니다.");
    console.error(e);
    return;
  }

  if (!products || products.length === 0) {
    console.log("상품을 찾지 못했습니다. 셀렉터가 바뀌었을 수 있습니다.");
    return;
  }

  console.log(`총 ${products.length}개 상품 추출 완료.`);

  // postsData.json 읽기
  const dataPath = path.join(__dirname, "postsData.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const posts = JSON.parse(raw);

  const slug = makeSlug(keyword);

  const fullProducts = products.map((p) => ({
    name: p.name,
    desc: `${keyword} 관련 추천 상품입니다.`,
    price: p.price,
    tag: `${keyword} 추천`,
    image: p.image,
    link: p.link
  }));

  const newPost = {
    slug,
    title: `${keyword} 추천 상품 ${fullProducts.length}개`,
    headline: `${keyword} 추천 모음`,
    date: formatDate(),
    description: `${keyword} 관련 쿠팡 인기 상품을 모아서 비교해봤습니다.`,
    products: fullProducts
  };

  posts.push(newPost);

  fs.writeFileSync(dataPath, JSON.stringify(posts, null, 2), "utf-8");

  console.log(`새 글 추가됨: slug = ${slug}`);
  console.log(`postsData.json 갱신 완료`);
  console.log(`👉 이제 "node generate.js" 를 실행해서 HTML을 다시 생성하면 됩니다.`);
}

main().catch((err) => {
  console.error("예상치 못한 오류 발생:", err);
});
