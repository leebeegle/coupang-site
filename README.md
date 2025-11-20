# 쿠팡 파트너스 자동 포스팅 및 배포 시스템

이 프로젝트는 쿠팡 파트너스 API를 활용하여 지정된 키워드에 대한 상품 정보를 가져와, 21개의 개별 도메인에 자동으로 포스트를 생성하고 Firebase에 배포하는 시스템입니다. 모든 과정은 GitHub Actions를 통해 자동화됩니다.

## ✨ 주요 기능

- **자동 포스트 생성**: `coupang_categories.csv` 파일에 등록된 키워드를 기반으로 쿠팡 상품 정보를 가져와 포스트를 생성합니다.
- **데이터 누적**: 생성된 포스트는 `postsData.json` 파일에 계속해서 누적 저장됩니다.
- **자동화된 빌드 및 배포**: GitHub Actions를 통해 지정된 스케줄(하루 5회)에 따라 자동으로 포스트 생성, 정적 사이트 빌드, Firebase 배포가 실행됩니다.
- **다중 도메인 운영**: 단 하나의 코드 베이스로 21개의 서로 다른 도메인에 콘텐츠를 분산하여 게시합니다.

---

## 📂 프로젝트 구조

주요 파일과 디렉토리의 역할은 다음과 같습니다.

- **`.github/workflows/deploy.yml`**: GitHub Actions 워크플로우 파일입니다. 자동화의 모든 단계를 정의합니다.
- **`autoAddPostsFromCoupang.js`**: 쿠팡 API에서 상품 정보를 가져와 `postsData.json`에 새 포스트를 추가하는 스크립트입니다.
- **`generate.js`**: `postsData.json` 데이터를 기반으로 실제 웹사이트(`dist` 폴더)를 구성하는 HTML 파일들을 생성하는 스크립트입니다.
- **`siteConfig.js`**: 21개 도메인의 정보(ID, 인덱스, 테마, 네이버 인증 코드 등)를 관리하는 설정 파일입니다.
- **`coupang_categories.csv`**: 포스팅할 상품의 **키워드**와 **카테고리** 목록을 관리하는 파일입니다.
- **`postsData.json`**: 생성된 모든 포스트 데이터가 누적되는 핵심 데이터베이스 파일입니다.
- **`firebase.json`**: Firebase 호스팅 배포 관련 설정을 담고 있습니다.
- **`dist/`**: `generate.js` 스크립트 실행 후 생성되는 최종 웹사이트 파일들이 저장되는 폴더입니다. 이 폴더의 내용이 Firebase에 배포됩니다.

---

## 🚀 설치 및 설정

### 1. 로컬 환경 설정

프로젝트를 로컬 컴퓨터에서 실행하기 위해 필요한 설정입니다.

```bash
# 프로젝트에 필요한 라이브러리들을 설치합니다.
npm install
```

### 2. 환경 변수 설정

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 아래와 같이 쿠팡 파트너스 API 키를 입력합니다. 이 파일은 Git에 의해 추적되지 않으므로 외부에 노출될 염려가 없습니다.

```
COUPANG_ACCESS_KEY=발급받은_ACCESS_KEY
COUPANG_SECRET_KEY=발급받은_SECRET_KEY
```

### 3. GitHub Actions 설정

자동 배포를 위해 GitHub 저장소에 아래의 값들을 Secrets으로 등록해야 합니다.

> `저장소 > Settings > Secrets and variables > Actions` 로 이동하여 `New repository secret` 버튼을 눌러 추가합니다.

- `COUPANG_ACCESS_KEY`: 쿠팡 파트너스 Access Key
- `COUPANG_SECRET_KEY`: 쿠팡 파트너스 Secret Key
- `FIREBASE_SERVICE_ACCOUNT`: Firebase 프로젝트의 서비스 계정 키 (JSON 형식)

---

## 🛠️ 사용 방법

### 로컬에서 수동으로 실행하기

```bash
# 1. 새로운 포스트를 생성하여 postsData.json에 추가합니다.
node autoAddPostsFromCoupang.js

# 2. postsData.json을 기반으로 dist 폴더에 웹사이트를 생성합니다.
node generate.js
```

### 자동 배포

`.github/workflows/deploy.yml` 파일에 설정된 스케줄에 따라 자동으로 모든 과정이 실행됩니다. 또한, GitHub Actions 탭에서 `workflow_dispatch` 기능을 통해 수동으로 워크플로우를 실행할 수도 있습니다.

---

## 🔧 커스터마이징

- **키워드 추가/수정**: `coupang_categories.csv` 파일을 열어 원하는 키워드와 카테고리를 추가하거나 수정할 수 있습니다.
- **도메인 정보 변경**: `siteConfig.js` 파일의 `domainMap` 객체에서 각 도메인의 라벨, 테마, 네이버 인증 코드 등을 수정할 수 있습니다.

---

## Appendix: Git 기본 명령어 가이드

이 프로젝트를 관리할 때 자주 사용하는 Git 명령어들입니다.

### 1. 로컬 프로젝트를 처음 GitHub에 올릴 때

내 컴퓨터에서 만든 프로젝트를 새로운 GitHub 저장소(Repository)에 처음으로 올리는 방법입니다.

```bash
# 1. 현재 폴더를 Git 저장소로 초기화합니다.
git init

# 2. GitHub 저장소 주소를 'origin'이라는 이름으로 연결합니다.
# [저장소_URL] 부분은 실제 GitHub 저장소 주소로 변경해야 합니다.
git remote add origin [저장소_URL]

# 3. 모든 파일을 올릴 준비를 합니다. (스테이징)
git add .

# 4. 'Initial commit'이라는 메시지와 함께 첫 저장을 합니다. (커밋)
git commit -m "Initial commit"

# 5. GitHub 저장소로 변경사항을 밀어 올립니다. (푸시)
git push -u origin main
```

### 2. GitHub의 최신 내용을 내 컴퓨터로 가져올 때 (동기화)

GitHub에서 직접 파일을 수정했거나, 자동화 작업으로 인해 파일(`postsData.json` 등)이 변경되었을 때, 그 최신 내용을 로컬 환경에 반영하는 방법입니다. **다른 작업을 시작하기 전에 항상 실행하는 것이 안전합니다.**

```bash
# GitHub 저장소(origin)의 main 브랜치 내용을 가져와서 현재 로컬 브랜치와 병합합니다.
git pull origin main
```

> **⚠️ 참고**: 만약 `git pull`을 실행했을 때 GitHub의 파일과 내 컴퓨터의 파일이 둘 다 수정된 상태라면 '충돌(Conflict)'이 발생할 수 있습니다. 이때는 VS Code에서 충돌이 발생한 파일을 열어, 어떤 내용을 남길지 직접 선택하고 저장한 뒤 다시 커밋 및 푸시를 진행해야 합니다.

### 3. 로컬에서 수정한 내용을 GitHub에 올릴 때

내 컴퓨터에서 수정한 코드(`coupang_categories.csv` 등)를 GitHub 저장소에 반영하는 가장 일반적인 방법입니다.

```bash
# 1. 특정 파일만 올리고 싶을 때
git add [파일_이름]

# 또는, 모든 변경사항을 한번에 올리고 싶을 때
git add .

# 2. 변경사항에 대한 설명을 메시지로 남겨 저장합니다.
git commit -m "docs: 키워드 목록 업데이트"

# 3. GitHub 저장소로 최종 업로드합니다.
git push origin main
```

<!-- ✔ 선택 2) 로컬 수정은 버리고 GitHub 최신 코드만 받고 싶은 경우

⚠ 로컬 변경 사라짐 (되돌릴 수 없음) -->

git restore .
git pull origin main


🎯 특정 파일만 Git에 올리는 명령어
git add README.md
git commit -m "update README"
git push origin main


설명하자면:

git add README.md → 이 파일만 staging에 올림

git commit -m "update README" → 이 파일만 포함된 커밋 생성

git push origin main → 원격 저장소(main)으로 업로드