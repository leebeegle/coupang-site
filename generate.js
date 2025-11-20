// generate.js
const fs = require('fs');
const path = require("path");
const vm = require('vm');

// siteConfig.js의 domainMap을 Node.js 환경에서 읽어오기 위한 설정
const siteConfigRaw = fs.readFileSync(path.join(__dirname, 'siteConfig.js'), 'utf-8');
// 🔥 해결: Node.js 환경에는 window.location이 없으므로, 오류가 나지 않도록 가짜 객체를 만들어준다.
const sandbox = {
  window: {
    location: { hostname: "shop.friendstoktok.co.kr" }, // 기본값으로 아무 도메인이나 넣어준다.
    // 🔥 해결: Node.js 환경에서 브라우저 전용 함수 실행 오류를 막기 위한 가짜 함수
    addEventListener: () => {},
  },
  document: { head: { appendChild: () => {} }, body: { setAttribute: () => {} }, querySelector: () => null }
};
vm.createContext(sandbox);
vm.runInContext(siteConfigRaw, sandbox);
const domainMap = sandbox.window.__SITE_INFO__.domainMap;
const TOTAL_SITES = sandbox.window.__SITE_INFO__.totalSites;


// dist 폴더(최종 배포용 폴더) 설정
const distDir = path.join(__dirname, "dist");
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 상세 페이지
function buildPostHtml(post, siteInfo) {
  // --------------------------------------------------
  // 1. 각 사이트의 고유 정보(label, id)를 사용하도록 수정
  // --------------------------------------------------
  const siteLabel = siteInfo.label;
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

  // ⭐⭐⭐ 여기 post.tags를 상세페이지에 추가함!
  const tagsHtml = (post.tags || [])
    .map((t) => `<span class="tag-item">#${t}</span>`)
    .join(" ");

  // 2. 구조화된 데이터(Schema) 생성
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.description,
    "datePublished": new Date(post.date).toISOString(),
    "author": {
      "@type": "Organization",
      "name": siteLabel // 사이트별 이름 적용
    },
    "image": (post.products && post.products.length > 0) ? post.products[0].image : `https://${siteInfo.id}.friendstoktok.co.kr/og_image.jpg`,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://{__SITE_INFO__.id}.friendstoktok.co.kr/posts/${post.slug}.html`
    },
    "review": (post.products || []).map(p => ({
      "@type": "Review",
      "itemReviewed": {
        "@type": "Product",
        "name": p.name,
        "image": p.image,
        "description": p.desc,
        "offers": {
          "@type": "Offer",
          "priceCurrency": "KRW",
          "price": p.price.replace(/[^0-9]/g, ''),
          "url": p.link
        }
      },
      "author": {
        "@type": "Organization",
        "name": siteLabel // 사이트별 이름 적용
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5", // 예시 평점
        "bestRating": "5"
      }
    }))
  };

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${post.title}</title>
  <!-- 1. 메타 태그 및 OG 태그 (사이트별 정보 동적 적용) -->
  <meta name="description" content="${post.description}" />
  <meta property="og:title" content="${post.title}" />
  <meta property="og:description" content="${post.description}" />
  <meta property="og:image" content="${(post.products && post.products.length > 0) ? post.products[0].image : `https://${siteInfo.id}.friendstoktok.co.kr/og_image.jpg`}" />
  <meta property="og:url" content="https://${siteInfo.id}.friendstoktok.co.kr/posts/${post.slug}.html" />
  <meta property="og:site_name" content="${siteLabel}" />
  <meta property="og:type" content="website" />
  <script type="application/ld+json">${JSON.stringify(schemaData, null, 2)}</script>
  <!-- dist/posts/xxx.html 기준으로 상위 폴더의 styles.css -->
  <link rel="stylesheet" href="../styles.css" />
</head>
<body>
  <header class="site-header">
    <h1>${siteLabel}</h1>
    <p class="subtitle">쿠팡파트너스 링크를 포함하고 있습니다.</p>
  </header>

  <main class="content">
    <section class="post-info">
      <span class="badge">가격 비교</span>
      <h2>${post.title}</h2>
      <p class="post-desc">${post.description}</p>      
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
function buildIndexHtml(posts, siteInfo) {
  // --------------------------------------------------
  // 2. 각 사이트의 고유 정보(label, id)를 사용하도록 수정
  // --------------------------------------------------
  const siteLabel = siteInfo.label;
  const sortedPosts = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
  // 🔹 카테고리 목록 만들기
  // 🔥 버그 수정: 'sorted' -> 'sortedPosts' 로 변경
  const categoriesSet = new Set(
    sortedPosts.map((p) => (p.category ? p.category : "기타"))
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

  // 🔹 각 카드에 data-post-idx 붙여서 "이 글이 리스트에서 몇 번째인지" 정보 저장
  const cardsHtml = sortedPosts
    .map((p, idx) => {
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
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>오늘의 쇼핑 추천</title>
  <!-- 1. 메타 태그 및 OG 태그 (사이트별 정보 동적 적용) -->
  <meta name="description" content="AI가 추천하는 오늘의 쇼핑 아이템! 매일 업데이트되는 인기 상품들을 만나보세요." />
  <meta property="og:title" content="${siteLabel}" />
  <meta property="og:description" content="AI가 추천하는 오늘의 쇼핑 아이템! 매일 업데이트되는 인기 상품들을 만나보세요." />
  <meta property="og:image" content="https://{__SITE_INFO__.id}.friendstoktok.co.kr/og_image.jpg" />
  <meta property="og:url" content="https://${siteInfo.id}.friendstoktok.co.kr/" />
  <meta property="og:site_name" content="${siteLabel}" />
  <meta property="og:type" content="website" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="site-header">
    <h1></h1>
    <p class="subtitle"></p>
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

  <!-- 🔹 여기서 siteConfig.js 먼저 불러오고 -->
  <script src="siteConfig.js"></script>

  <!-- 🔹 카테고리 필터 스크립트 -->
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
          applyFilter(chip.getAttribute('data-category'));
        });
      });
    })();
  </script>

</body>
</html>`;
}

function generateRobotsTxt(siteInfo) {
  const sitemapUrl = `https://${siteInfo.id}.friendstoktok.co.kr/sitemap.xml`;
  const content = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}`;
  return content;
}

function generateSitemap(sitePosts, siteInfo) {
  const baseUrl = `https://${siteInfo.id}.friendstoktok.co.kr`;
  const today = new Date().toISOString().split("T")[0];

  const urls = [{
    loc: `${baseUrl}/`,
    lastmod: today,
    changefreq: "daily",
    priority: "1.0",
  }];

  sitePosts.forEach(post => {
    urls.push({
      loc: `${baseUrl}/posts/${post.slug}.html`,
      lastmod: post.date,
      changefreq: "weekly",
      priority: "0.8",
    });
  });

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `<url><loc>${url.loc}</loc><lastmod>${url.lastmod}</lastmod><changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`).join("\n  ")}
</urlset>`;

  return sitemapXml;
}

// --------------------------------------------------
// 3. 각 도메인에 맞는 콘텐츠를 생성하여 빌드
// --------------------------------------------------

const dataPath = path.join(__dirname, "postsData.json");
const raw = fs.readFileSync(dataPath, "utf-8");
const allPosts = JSON.parse(raw);

Object.values(domainMap).forEach(siteInfo => {
  // 🔥 수정: 각 사이트별로 빌드 결과물을 저장할 고유한 폴더 경로를 생성합니다. (예: dist/shop, dist/aurora)
  const siteDistDir = path.join(distDir, siteInfo.id);
  const sitePostsDir = path.join(siteDistDir, 'posts');
  fs.mkdirSync(sitePostsDir, { recursive: true });

  // 해당 사이트에 속하는 포스트만 필터링
  // 🔥 버그 수정: 'posts' -> 'allPosts' 로 변경
  const sitePosts = allPosts.filter((post, idx) => (idx % TOTAL_SITES) === siteInfo.index);

  // 상세 페이지들 생성
  sitePosts.forEach((post) => {
    const html = buildPostHtml(post, siteInfo);
    const filePath = path.join(sitePostsDir, `${post.slug}.html`);
    fs.writeFileSync(filePath, html, "utf-8");
  });

  // index.html 생성
  const indexHtml = buildIndexHtml(sitePosts, siteInfo);
  const indexPath = path.join(siteDistDir, "index.html");
  fs.writeFileSync(indexPath, indexHtml, "utf-8");

  // robots.txt 생성
  const robotsTxt = generateRobotsTxt(siteInfo);
  fs.writeFileSync(path.join(siteDistDir, 'robots.txt'), robotsTxt, 'utf-8');

  // sitemap.xml 생성
  const sitemapXml = generateSitemap(sitePosts, siteInfo);
  fs.writeFileSync(path.join(siteDistDir, 'sitemap.xml'), sitemapXml, 'utf-8');

  // siteConfig.js 복사
  const srcConfig = path.join(__dirname, "siteConfig.js");
  fs.copyFileSync(srcConfig, path.join(siteDistDir, "siteConfig.js"));

  // styles.css 복사
  const srcCss = path.join(__dirname, "styles.css");
  fs.copyFileSync(srcCss, path.join(siteDistDir, "styles.css"));

  // firebase.json 파일 생성
  const firebaseJson = {
    hosting: {
      public: "dist",
      rewrites: [{ source: "**", destination: "/index.html" }]
    }
  };
  fs.writeFileSync(path.join(__dirname, 'firebase.json'), JSON.stringify(firebaseJson, null, 2), 'utf-8');

  console.log(`✅ ${siteInfo.id} 사이트 빌드 완료 (${sitePosts.length}개 포스트)`);
});
