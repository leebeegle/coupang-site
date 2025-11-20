// autoAddPostsFromCoupang.js
require("dotenv").config();

// .env 파일의 키 이름을 coupangApi.js가 예상하는 이름으로 변경
process.env.ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
process.env.SECRET_KEY = process.env.COUPANG_SECRET_KEY;
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { searchProducts } = require("./coupangApi");

const KEYWORDS_TO_PROCESS = 21; // 하루에 생성할 포스트 수 (도메인 개수와 일치)

// CSV 파일에서 모든 키워드를 읽어오는 함수
function getKeywordsFromCSV() {
  return new Promise((resolve, reject) => {
    const keywords = [];
    const csvPath = path.join(__dirname, "coupang_categories.csv");
    fs.createReadStream(csvPath)
      .pipe(
        csv({ // 쉼표로 구분된 CSV 파일을 읽도록 separator 옵션 제거 (기본값: 쉼표)
          mapHeaders: ({ header }) => header.trim(), // 헤더 공백 제거
        })
      )
      .on("data", (row) => {
        // 디버깅을 위해 모든 행을 출력
        console.log("- 읽은 행:", row); 
        if (row.keyword) {
          keywords.push({
            keyword: row.keyword.trim(),
            category: row.category ? row.category.trim() : "기타",
          });
        }
      })
      .on("end", () => {
        console.log(`✅ CSV 파일에서 ${keywords.length}개의 키워드를 읽었습니다.`);
        resolve(keywords);
      })
      .on("error", reject);
  });
}

// 배열에서 무작위로 n개의 항목을 선택하는 함수
function getRandomSample(arr, n) {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

async function main() {
  console.log(`🔥 자동 포스트 생성 시작 (목표: ${KEYWORDS_TO_PROCESS}개)`);

  const allKeywords = await getKeywordsFromCSV();
  if (allKeywords.length === 0) {
    console.log("❌ 키워드를 찾을 수 없습니다.");
    return;
  }

  const selectedKeywords = getRandomSample(allKeywords, KEYWORDS_TO_PROCESS);
  console.log(
    `➡️  선택된 키워드: ${selectedKeywords.map((k) => k.keyword).join(", ")}`
  );

  const postsDataPath = path.join(__dirname, "postsData.json");
  const raw = fs.readFileSync(postsDataPath, "utf-8");
  const posts = JSON.parse(raw);
  const totalPosts = posts.length; // 🔥 기존 포스트 개수 확인

  const newPosts = [];

  for (let i = 0; i < selectedKeywords.length; i++) { // 🔥 인덱스 사용을 위해 for 루프 변경
    const { keyword, category } = selectedKeywords[i];
    const siteIndex = (totalPosts + i) % KEYWORDS_TO_PROCESS; // 🔥 사이트 인덱스 계산

    console.log(`⏳ '${keyword}' 키워드로 상품 검색 중... (사이트 인덱스: ${siteIndex})`);
    try {
      const products = await searchProducts(keyword, 10);

      // API 응답이 배열이 아니거나, 상품이 6개 미만인 경우 건너뛰기
      if (!Array.isArray(products) || products.length < 6) {
        console.log(
          `⚠️ '${keyword}'에 대한 상품이 충분하지 않아(6개 미만) 건너뜁니다.`
        );
        continue;
      }

      console.log(`✅ '${keyword}'에서 ${products.length}개 상품 가져옴`);

      const today = new Date().toISOString().split("T")[0];
      const slug = `${keyword.replace(/\s+/g, "-")}-${today}`;

      const selectedProducts = products.slice(0, 6).map((p) => ({
        name: p.productName,
        price: p.productPrice.toLocaleString("ko-KR") + "원",
        desc: p.productName,
        tag: p.keyword || keyword,
        image: p.productImage,
        link: p.productUrl,
      }));

      const newPost = {
        slug,
        date: today,
        title: `${keyword} 추천 상품 BEST 6`,
        headline: `${keyword} 가격 비교`,
        description: `${keyword} 관련 인기 상품 6개를 비교하고 최저가 정보를 확인하세요.`,
        category: category,
        products: selectedProducts,
        siteIndex: siteIndex, // 🔥 사이트 인덱스를 포스트 데이터에 저장
      };

      newPosts.push(newPost);
      console.log(`👍 새 글 준비 완료: ${slug}`);
    } catch (error) {
      console.error(`❌ '${keyword}' 처리 중 오류 발생:`, error.message);
    }
  }

  if (newPosts.length > 0) {
    const updatedPosts = [...posts, ...newPosts];
    fs.writeFileSync(
      postsDataPath,
      JSON.stringify(updatedPosts, null, 2),
      "utf-8"
    );
    console.log(`🎉 총 ${newPosts.length}개의 새 글을 postsData.json에 추가했습니다.`);
  } else {
    console.log("🤷 추가할 새 글이 없습니다.");
  }
}

main();
