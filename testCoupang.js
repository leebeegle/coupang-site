// testCoupang.js
const { searchProducts } = require("./coupangApi");

(async () => {
  try {
    const keyword = "아이패드"; // 테스트용
    console.log(`"${keyword}"로 쿠팡 검색 호출 중...`);

    const products = await searchProducts(keyword, 5);

    console.log("받아온 상품 개수:", products.length);
    products.slice(0, 5).forEach((p, i) => {
      console.log(
        `${i + 1}. ${p.productName || p.title} - ${p.productPrice || p.price}`
      );
    });
  } catch (err) {
    console.error("테스트 실패:", err.message);
  }
})();
