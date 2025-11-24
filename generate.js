// generate.js
const fs = require("fs");
const path = require("path");

// --- 1. 초기 설정 및 데이터 로드 ---

// dist 폴더(최종 배포용 폴더) 설정
const distDir = path.join(__dirname, "dist");
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 포스트 데이터 로드
const dataPath = path.join(__dirname, "postsData.json");
const allPosts = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

// 사이트 설정(domainMap) 로드
const siteConfigRaw = fs.readFileSync(path.join(__dirname, 'siteConfig.js'), 'utf-8');
const domainMapMatch = siteConfigRaw.match(/const domainMap = ({[\s\S]*?});/);
if (!domainMapMatch) {
  throw new Error('❌ siteConfig.js에서 domainMap을 찾을 수 없습니다.');
}
const domainMap = eval('(' + domainMapMatch[1] + ')');
const sites = Object.values(domainMap);
const totalSites = sites.length;

// --- 2. HTML 빌드 헬퍼 함수 ---

/**
 * 개별 포스트 상세 페이지 HTML 생성
 * @param {object} post - 포스트 데이터
 * @param {object} site - 사이트 정보
 * @returns {string} HTML 문자열
 */
function buildPostHtml(post, site) {
  const productsHtml = (post.products || [])
    .map(
      (p) => `
      <article class="product-card">
        <img src="${p.image}" alt="${p.name}" />
        <div class="product-body">
          <h3>${p.name}</h3>
          <p class="product-desc">${p.desc}</p>
          <div class="product-meta">
            <span class="price">${p.price}</span>
            <span class="tag">${p.tag}</span>
          </div>
          <a class="product-link" href="${p.link}" target="_blank" rel="nofollow">
            쿠팡에서 가격 확인하기
          </a>
        </div>
      </article>
    `
    )
    .join("\n");

  const tagsHtml = (post.tags || [])
    .map((t) => `<span class="tag-item">#${t}</span>`)
    .join(" ");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${post.title} | ${site.label}</title>
  <meta name="description" content="${post.description}">
  <meta name="naver-site-verification" content="${site.naverVerification}" />
  <link rel="stylesheet" href="../styles.css" />
  <link rel="canonical" href="https://${site.id}.friendstoktok.co.kr/posts/${post.slug}.html" />
</head>
<body data-theme="${site.theme}">
  <header class="site-header">
    <h1><a href="../index.html">${site.label}</a></h1>
    <p class="subtitle">${site.label}에서 제공하는 쿠팡 인기 상품 정보입니다.</p>
  </header>

  <main class="content">
    <section class="post-info">
      <span class="badge">가격 비교</span>
      <h2>${post.title}</h2>
      <p class="post-desc">${post.description}</p>
      <p class="post-tags">${tagsHtml}</p>
    </section>
    <section class="product-grid">${productsHtml}</section>
  </main>

  <footer class="site-footer">
    <p>※ 본 페이지의 링크를 통해 구매 시, 제작자는 쿠팡파트너스 활동을 통해 일정 수수료를 받을 수 있습니다.</p>
  </footer>
</body>
</html>`;
}

/**
 * 사이트 메인(index.html) 페이지 생성
 * @param {Array<object>} posts - 해당 사이트에 속한 포스트 목록
 * @param {object} site - 사이트 정보
 * @returns {string} HTML 문자열
 */
function buildIndexHtml(posts, site) {
  const sorted = [...posts].sort((a, b) => (a.date < b.date ? 1 : -1));

  const categoriesSet = new Set(sorted.map((p) => p.category || "기타"));
  const categories = ["전체", ...Array.from(categoriesSet).sort()];

  const chipsHtml = categories
    .map((c, idx) => `<button class="category-chip${idx === 0 ? " active" : ""}" data-category="${c}">${c}</button>`)
    .join("\n");

  const cardsHtml = sorted
    .map((p) => {
      const thumb = (p.products && p.products[0]) ? p.products[0].image : "https://via.placeholder.com/400x300?text=No+Image";
      return `
      <article class="post-card" data-category="${p.category || '기타'}">
        <img src="${thumb}" alt="${p.title}" />
        <div class="post-card-body">
          <h2 class="post-card-title">${p.title}</h2>
          <p class="post-card-date">${p.date}</p>
          <a class="post-card-link" href="posts/${p.slug}.html">최저가 보러가기</a>
        </div>
      </article>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${site.label}</title>
  <meta name="description" content="${site.label}에서 제공하는 쿠팡 인기 상품과 가격 비교 정보를 확인하세요.">
  <meta name="naver-site-verification" content="${site.naverVerification}" />
  <link rel="stylesheet" href="styles.css" />
  <link rel="canonical" href="https://${site.id}.friendstoktok.co.kr" />
</head>
<body data-theme="${site.theme}">
  <header class="site-header">
    <h1>${site.label}</h1>
    <p class="subtitle">${site.label}에서 제공하는 쿠팡 인기 상품 정보입니다.</p>
  </header>

  <main class="content">
    <section class="post-grid-section">
      <div class="category-bar">${chipsHtml}</div>
      <div class="post-grid">${cardsHtml}</div>
    </section>
  </main>

  <footer class="site-footer">
    <p>※ 본 페이지의 링크를 통해 구매 시, 제작자는 쿠팡파트너스 활동을 통해 일정 수수료를 받을 수 있습니다.</p>
  </footer>

  <script>
    (function() {
      const chips = Array.from(document.querySelectorAll('.category-chip'));
      const cards = Array.from(document.querySelectorAll('.post-card'));
      
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          const selectedCategory = chip.getAttribute('data-category');
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          
          cards.forEach(card => {
            const cardCategory = card.getAttribute('data-category') || '기타';
            if (selectedCategory === '전체' || cardCategory === selectedCategory) {
              card.style.display = '';
            } else {
              card.style.display = 'none';
            }
          });
        });
      });
    })();
  </script>
</body>
</html>`;
}

// --- 3. SEO 파일 생성 함수 ---

/**
 * 사이트맵(sitemap.xml) 생성
 * @param {string} siteDir - 사이트 빌드 디렉토리
 * @param {string} baseUrl - 사이트 기본 URL
 * @param {Array<object>} posts - 해당 사이트 포스트 목록
 */
function generateSitemap(siteDir, baseUrl, posts) {
  const today = new Date().toISOString().split("T")[0];
  let urls = `<url><loc>${baseUrl}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`;
  
  posts.forEach(post => {
    urls += `\n  <url><loc>${baseUrl}/posts/${post.slug}.html</loc><lastmod>${post.date}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
  });

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;
  fs.writeFileSync(path.join(siteDir, "sitemap.xml"), sitemapXml, "utf-8");
}

/**
 * robots.txt 생성
 * @param {string} siteDir - 사이트 빌드 디렉토리
 * @param {string} baseUrl - 사이트 기본 URL
 */
function generateRobotsTxt(siteDir, baseUrl) {
  const content = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml`;
  fs.writeFileSync(path.join(siteDir, "robots.txt"), content, "utf-8");
}

// --- 4. 메인 빌드 프로세스 ---

console.log(`🔥 총 ${sites.length}개의 사이트 빌드를 시작합니다.`);

sites.forEach((site, siteIndex) => {
  const domain = Object.keys(domainMap).find(key => domainMap[key].id === site.id);
  const baseUrl = `https://${domain}`;
  const siteDir = path.join(distDir, site.id);
  const sitePostsDir = path.join(siteDir, "posts");

  // 사이트별 디렉토리 생성
  fs.mkdirSync(siteDir, { recursive: true });
  fs.mkdirSync(sitePostsDir, { recursive: true });

  // 해당 사이트에 속하는 포스트 필터링
  const sitePosts = allPosts.filter((post, idx) => {
    // 새로운 포스트는 siteIndex 속성으로, 없으면 기존 방식으로 인덱스 계산
    const postSiteIndex = post.siteIndex !== undefined ? post.siteIndex : idx % totalSites;
    return postSiteIndex === site.index;
  });

  console.log(`\n[${site.id}] 사이트 빌드 중... (포스트 ${sitePosts.length}개)`);

  // 1. 개별 포스트 페이지 생성
  sitePosts.forEach(post => {
    const html = buildPostHtml(post, site);
    fs.writeFileSync(path.join(sitePostsDir, `${post.slug}.html`), html, "utf-8");
  });

  // 2. 메인 index.html 생성
  const indexHtml = buildIndexHtml(sitePosts, site);
  fs.writeFileSync(path.join(siteDir, "index.html"), indexHtml, "utf-8");

  // 3. SEO 파일(sitemap.xml, robots.txt) 생성
  generateSitemap(siteDir, baseUrl, sitePosts);
  generateRobotsTxt(siteDir, baseUrl);
  
  // 4. 네이버 소유 확인 HTML 파일 생성
  const naverVerificationHtml = `<html><head><meta name="naver-site-verification" content="${site.naverVerification}" /></head><body></body></html>`;
  fs.writeFileSync(path.join(siteDir, `naver${site.naverVerification}.html`), naverVerificationHtml, "utf-8");

  // 5. 정적 에셋(styles.css) 복사
  fs.copyFileSync(path.join(__dirname, "styles.css"), path.join(siteDir, "styles.css"));
  
  console.log(`✅ [${site.id}] 사이트 빌드 완료!`);
});

console.log("\n🎉 모든 사이트 빌드가 성공적으로 완료되었습니다.");
