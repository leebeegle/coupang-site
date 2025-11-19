// generate.js
const fs = require("fs");
const path = require("path");

// � dist 폴더(최종 배포용 폴더) 설정
const distDir = path.join(__dirname, "dist");
// 🔥 인증 파일 유지를 위해 dist 폴더를 비우지 않도록 주석 처리
// if (fs.existsSync(distDir)) {
//   fs.rmSync(distDir, { recursive: true, force: true });
// }
fs.mkdirSync(distDir, { recursive: true });

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

  // ⭐⭐⭐ 여기 post.tags를 상세페이지에 추가함!
  const tagsHtml = (post.tags || [])
    .map((t) => `<span class="tag-item">#${t}</span>`)
    .join(" ");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
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
      <p class="post-desc">${post.description}</p>

      <!-- 🔥 여기에 태그 추가됨 -->
      <p class="post-tags">
        ${tagsHtml}
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

  // 🔹 각 카드에 data-post-idx 붙여서 "이 글이 리스트에서 몇 번째인지" 정보 저장
  const cardsHtml = sorted
    .map((p, idx) => {
      const firstProduct = (p.products || [])[0] || {};
      const thumb =
        firstProduct.image ||
        "https://via.placeholder.com/400x300?text=No+Image";
      const title = p.title;
      const date = p.date || "";
      const category = p.category || "기타";

      return `
      <article class="post-card" data-category="${category}" data-post-idx="${idx}">
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

  <!-- 🔹 사이트별 필터 + 카테고리 필터 -->
  <script>
    (function() {
      const chips = Array.from(document.querySelectorAll('.category-chip'));
      const cards = Array.from(document.querySelectorAll('.post-card'));

      // 🔹 1) 도메인 → 사이트 index 매핑 (21개 고정)
      const HOST_INDEX_MAP = {
        "shop.friendstoktok.co.kr":    0,
        "aurora.friendstoktok.co.kr":  1,
        "meteor.friendstoktok.co.kr":  2,
        "galaxy.friendstoktok.co.kr":  3,
        "nebula.friendstoktok.co.kr":  4,
        "comet.friendstoktok.co.kr":   5,
        "orbit.friendstoktok.co.kr":   6,
        "saturn.friendstoktok.co.kr":  7,
        "jupiter.friendstoktok.co.kr": 8,
        "venus.friendstoktok.co.kr":   9,
        "mercury.friendstoktok.co.kr": 10,
        "eclipse.friendstoktok.co.kr": 11,
        "nova.friendstoktok.co.kr":    12,
        "cosmos.friendstoktok.co.kr":  13,
        "pluto.friendstoktok.co.kr":   14,
        "rocket.friendstoktok.co.kr":  15,
        "apollo.friendstoktok.co.kr":  16,
        "luna.friendstoktok.co.kr":    17,
        "astro.friendstoktok.co.kr":   18,
        "stella.friendstoktok.co.kr":  19,
        "solaris.friendstoktok.co.kr": 20
      };

      const TOTAL_SITES = 21;
      const host = window.location.hostname;
      const siteIndex = HOST_INDEX_MAP.hasOwnProperty(host)
        ? HOST_INDEX_MAP[host]
        : 0;

      cards.forEach(card => {
        const idx = parseInt(card.getAttribute('data-post-idx'), 10) || 0;
        const belongs = (idx % TOTAL_SITES) === siteIndex;

        if (!belongs) {
          card.dataset.hiddenBySite = "1";
          card.style.display = 'none';
        } else {
          card.dataset.hiddenBySite = "0";
          card.style.display = '';
        }
      });

      function applyFilter(category) {
        cards.forEach(card => {
          const hiddenBySite = card.dataset.hiddenBySite === "1";
          if (hiddenBySite) {
            card.style.display = 'none';
            return;
          }
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
  console.warn("⚠ styles.css 파일을 찾을 수 없습니다.");
}

// 🔹 siteConfig.js도 dist로 복사
const srcConfig = path.join(__dirname, "siteConfig.js");
const distConfig = path.join(distDir, "siteConfig.js");
if (fs.existsSync(srcConfig)) {
  fs.copyFileSync(srcConfig, distConfig);
  console.log("siteConfig.js → dist/siteConfig.js 복사 완료");
} else {
  console.warn("⚠ siteConfig.js 파일을 찾을 수 없습니다.");
}

// 🔥 SEO 개선: 사이트맵(sitemap.xml) 생성 함수
function generateSitemaps(posts) {
  const today = new Date().toISOString().split("T")[0];
  
  // siteConfig.js에서 도메인 목록 가져오기
  const siteConfigRaw = fs.readFileSync(path.join(__dirname, 'siteConfig.js'), 'utf-8');
  const domainMapMatch = siteConfigRaw.match(/const domainMap = ({[\s\S]*?});/);
  if (!domainMapMatch) {
    console.error('❌ siteConfig.js에서 domainMap을 찾을 수 없습니다.');
    return;
  }
  // JSON이 아닌 JavaScript 객체이므로 eval을 사용해 파싱
  const domainMap = eval('(' + domainMapMatch[1] + ')');
  const domains = Object.keys(domainMap);

  domains.forEach(domain => {
    const siteIndex = domainMap[domain].index;
    const baseUrl = `https://${domain}`;

    // 1. 메인 페이지 URL 추가
    const urls = [{
      loc: `${baseUrl}/`,
      lastmod: today,
      changefreq: "daily",
      priority: "1.0",
    }];

    // 2. 해당 도메인에 속하는 포스트만 필터링하여 URL 추가
    posts.forEach((post, idx) => {
      if (idx % domains.length === siteIndex) {
        urls.push({
          loc: `${baseUrl}/posts/${post.slug}.html`,
          lastmod: post.date,
          changefreq: "weekly",
          priority: "0.8",
        });
      }
    });

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `<url><loc>${url.loc}</loc><lastmod>${url.lastmod}</lastmod><changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`).join("\n  ")}
</urlset>`;

    // 도메인별로 sitemap 파일 생성 (예: sitemap_shop.xml)
    const sitemapFileName = `sitemap_${domainMap[domain].id}.xml`;
    fs.writeFileSync(path.join(distDir, sitemapFileName), sitemapXml, "utf-8");
    console.log(`✅ ${sitemapFileName} 생성 완료`);
  });
}

// 🔥 SEO 개선: 사이트맵 생성 함수 호출
generateSitemaps(posts);

// 🔥 SEO 개선: robots.txt 파일 생성 함수 (static)
function generateRobotsTxt() {
  const siteConfigRaw = fs.readFileSync(path.join(__dirname, 'siteConfig.js'), 'utf-8');
  const domainMapMatch = siteConfigRaw.match(/const domainMap = ({[\s\S]*?});/);
  if (!domainMapMatch) return;
  const domainMap = eval('(' + domainMapMatch[1] + ')');
  const domains = Object.keys(domainMap);

  let sitemapLinks = '';
  domains.forEach(domain => {
    const sitemapFileName = `sitemap_${domainMap[domain].id}.xml`;
    sitemapLinks += `Sitemap: https://${domain}/${sitemapFileName}\n`;
  });

  const robotsTxtContent = `User-agent: *\nAllow: /\n\n${sitemapLinks}`;
  fs.writeFileSync(path.join(distDir, "robots.txt"), robotsTxtContent, "utf-8");
  console.log("✅ robots.txt 생성 완료");
}

// 🔥 SEO 개선: robots.txt 생성 함수 호출
generateRobotsTxt();
