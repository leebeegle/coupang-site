// autoPost.js
const fs = require("fs");
const path = require("path");
const { searchProducts } = require("./coupangApi");

// 최소 몇 개 이상일 때만 글을 만들지 설정
const MIN_PRODUCTS_FOR_POST = 3;

// 날짜 포맷
function formatDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// slug 생성
function makeSlug(keyword) {
  return (
    keyword
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9가-힣\-]/g, "") +
    "-" +
    formatDate()
  );
}

// 키워드로 대충 카테고리 추론
function inferCategory(keyword = "") {
  const k = keyword.toLowerCase();

  if (/(에어팟|airpods|갤럭시|아이폰|노트북|청소기|선풍기|탭|모니터)/i.test(keyword)) {
    return "가전제품";
  }
  if (/(크림|로션|토너|세럼|마스크팩|립스틱|마스카라|파운데이션)/i.test(keyword)) {
    return "화장품";
  }
  if (/(운동화|런닝화|축구화|헬스|덤벨|요가|캠핑|텐트|등산)/i.test(keyword)) {
    return "스포츠";
  }
  if (/(소파|책상|의자|침대|매트리스|식탁|커튼|러그)/i.test(keyword)) {
    return "가구·인테리어";
  }
  if (/(반려견|강아지|고양이|사료|간식|캣타워|모래)/i.test(keyword)) {
    return "반려동물";
  }

  return "기타";
}

async function addPostByKeyword(keyword, categoryArg) {
  const category = categoryArg || inferCategory(keyword);

  console.log(`"${keyword}" 키워드로 쿠팡 API 검색 중... (카테고리: ${category})`);

  const rawProducts = await searchProducts(keyword, 6);

  if (!rawProducts.length) {
    console.log("상품을 찾지 못했습니다.");
    return;
  }

  if (rawProducts.length < MIN_PRODUCTS_FOR_POST) {
    console.log(
      `상품이 ${rawProducts.length}개밖에 없어서 글 생성을 건너뜁니다. (최소 ${MIN_PRODUCTS_FOR_POST}개 필요)`
    );
    return;
  }

  console.log(`상품 ${rawProducts.length}개 수신 완료.`);

  const products = rawProducts.map((p) => {
    const name = p.productName || p.title || "이름 없음";
    const priceValue = p.productPrice || p.price || 0;
    const price =
      typeof priceValue === "number"
        ? "₩ " + priceValue.toLocaleString("ko-KR")
        : "₩ " + String(priceValue);

    const image = p.productImage || p.productImageUrl || "";
    const link =
      p.productUrl ||
      p.productUrlPc ||
      p.landingUrl ||
      p.coupangProductUrl ||
      "";

    return {
      name,
      desc: `${keyword} 관련 추천 상품입니다.`,
      price,
      tag: `${keyword} 추천`,
      image,
      link,
    };
  });

  const dataPath = path.join(__dirname, "postsData.json");
  const posts = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  const slug = makeSlug(keyword);

  const newPost = {
    slug,
    title: `${keyword} 추천 상품 ${products.length}개`,
    headline: `${keyword} 가격 비교`,
    date: formatDate(),
    description: `${keyword} 관련 쿠팡 인기 상품을 모아서 가격을 비교해봤습니다.`,
    category, // 🔹 카테고리 저장!
    products,
  };

  posts.push(newPost);
  fs.writeFileSync(dataPath, JSON.stringify(posts, null, 2), "utf-8");

  console.log(`새 글 추가됨: ${slug} (카테고리: ${category})`);
  console.log("postsData.json 저장 완료");
}

// CLI 인자
const keyword = process.argv[2];
const categoryArg = process.argv[3]; // 선택: 직접 카테고리 넣고 싶을 때

if (!keyword) {
  console.error('사용법: node autoPost.js "검색어" ["카테고리"]');
  process.exit(1);
}

addPostByKeyword(keyword, categoryArg).catch((err) => {
  console.error("오류 발생:", err);
});
