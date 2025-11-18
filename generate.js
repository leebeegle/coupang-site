// generate.js
const fs = require("fs");
const path = require("path");

// 🔹 dist 폴더(최종 배포용 폴더) 설정
const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// 🔹 데이터 로드
const dataPath = path.join(__dirname, "postsData.json");
const raw = fs.readFileSync(dataPath, "utf-8");
const posts = JSON.parse(raw);

// 🔹 dist/posts 폴더 설정
const postsDir = path.join(distDir, "posts");
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}

// 상세 페이지
function buildPostHtml(post) {
  const productsHtml = (post.products || [])
    .map(
      (p) => `
      <article class="product-card">
        <img src="${p.image}" alt="${p.name}" />
        <div class="product-body">
          <h3>${p.name}</h3>
          <p class="product-desc">
            ${p.desc}
          </p>
          <div class="product-meta">
            <span class="price">${p.price}</span>
            <span class="tag">${p.tag}</span>
          </div>
          <a 
            class="product-link" 
            href="${p.link}" 
            target="_blank" 
            rel="nofollow"
          >
            쿠팡에서 가격 확인하기
          </a>
        </div>
      </article>
    `
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>${post.title}</title>
  <!-- dist/posts/xxx.html 기준으로 상위 폴더의 styles.css -->
  <link rel="stylesheet" href="../styles.css" />
</head>
<body>
  <header class="site-header">
    <h1>${post.headline}</h1>
    <p class="subtitle">쿠팡파트너스 링크를 포함하고 있습니다.</p>
  </header>

  <main class="content">
    <section class="post-info">
      <span class="badge">가격 비교</span>
      <h2>${post.title}</h2>
      <p class="post-desc">
        ${post.description}
      </p>
    </section>

    <section class="product-grid">
      ${productsHtml}
    </section>
  </main>

  <footer class="site-footer">
    <p>※ 본 페이지의 링크를 통해 구매 시, 제작자는 쿠팡파트너스 활동을 통해 일정 수수료를 받을 수 있습니다.</p>
  </footer>
</body>
</html>`;
}

// 메인 index.html
function buildIndexHtml(posts) {
  const sorted = [...posts].sort((a, b) => (a.date < b.date ? 1 : -1));

  // 🔹 카테고리 목록 만들기
  const categoriesSet = new Set(
    sorted.map((p) => (p.category ? p.category : "기타"))
  );
  const categories = Array.from(categoriesSet).sort((a, b) =>
    a.localeCompare(b, "ko")
  );
  categories.unshift("전체");

  const chipsHtml = categories
    .map((c, idx) => {
      const active = idx === 0 ? " active" : "";
      return `<button class="category-chip${active}" data-category="${c}">${c}</button>`;
    })
    .join("\n");

  const cardsHtml = sorted
    .map((p) => {
      const firstProduct = (p.products || [])[0] || {};
      const thumb =
        firstProduct.image ||
        "https://via.placeholder.com/400x300?text=No+Image";
      const title = p.title;
      const date = p.date || "";
      const category = p.category || "기타";

      return `
      <article class="post-card" data-category="${category}">
        <img src="${thumb}" alt="${title}" />
        <div class="post-card-body">
          <h2 class="post-card-title">${title}</h2>
          <p class="post-card-date">${date}</p>
          <a class="post-card-link" href="posts/${p.slug}.html">
            최저가 보러가기
          </a>
        </div>
      </article>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>오늘의 쇼핑 추천</title>
  <!-- dist/index.html 기준으로 같은 폴더의 styles.css -->
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="site-header">
    <h1>오늘의 쇼핑 추천</h1>
    <p class="subtitle">쿠팡파트너스 링크를 포함한 자동 가격 비교 컬렉션</p>
  </header>

  <main class="content">
    <section class="post-grid-section">
      <div class="category-bar">
        ${chipsHtml}
      </div>
      <div class="post-grid">
        ${cardsHtml}
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <p>※ 본 페이지의 링크를 통해 구매 시, 제작자는 쿠팡파트너스 활동을 통해 일정 수수료를 받을 수 있습니다.</p>
  </footer>

  <script>
    (function() {
      const chips = Array.from(document.querySelectorAll('.category-chip'));
      const cards = Array.from(document.querySelectorAll('.post-card'));

      function applyFilter(category) {
        cards.forEach(card => {
          const c = card.getAttribute('data-category') || '기타';
          if (category === '전체' || c === category) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      }

      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          const category = chip.getAttribute('data-category');
          applyFilter(category);
        });
      });
    })();
  </script>
</body>
</html>`;
}

// 상세 페이지들 생성
posts.forEach((post) => {
  const html = buildPostHtml(post);
  const filePath = path.join(postsDir, `${post.slug}.html`);
  fs.writeFileSync(filePath, html, "utf-8");
  console.log(`생성됨: dist/posts/${post.slug}.html`);
});

// index.html 생성
const indexHtml = buildIndexHtml(posts);
const indexPath = path.join(distDir, "index.html");
fs.writeFileSync(indexPath, indexHtml, "utf-8");
console.log("dist/index.html 생성/업데이트 완료");

// 🔹 styles.css를 dist로 복사 (배포용)
const srcCss = path.join(__dirname, "styles.css");
const distCss = path.join(distDir, "styles.css");
if (fs.existsSync(srcCss)) {
  fs.copyFileSync(srcCss, distCss);
  console.log("styles.css → dist/styles.css 복사 완료");
} else {
  console.warn("⚠ styles.css 파일을 찾을 수 없습니다. 스타일이 적용되지 않을 수 있습니다.");
}
