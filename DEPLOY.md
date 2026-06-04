# 部署到 GitHub Pages（自動）

設定好後：**每次 `git push`，網站就自動重新部署**。網址會是
`https://<你的GitHub帳號>.github.io/<repo名>/`

> `vite.config.ts` 已會在 GitHub Actions 自動帶入正確的 base，你不用手動改任何路徑。

---

## 前置
- 一個 GitHub 帳號
- 電腦已安裝 git
- （建議）先在本機跑一次 `npm install && npm run build` 確認沒有錯誤

## 步驟

### 1. 把專案變成 git repo 並 commit
```bash
cd ~/Documents/learning/kids-english
git init
git add .
git commit -m "init: 星河探險英文學習 App"
git branch -M main
```

### 2. 建立 GitHub repo 並推上去

**方法 A：用 GitHub 網站（不需安裝額外工具）**
1. 到 https://github.com/new 建立一個 **Public** 的 repo（例如叫 `kids-english`），**不要**勾選加 README。
2. 回到終端機執行（把網址換成你的）：
```bash
git remote add origin https://github.com/<你的帳號>/kids-english.git
git push -u origin main
```

**方法 B：用 GitHub CLI（若已安裝 gh）**
```bash
gh repo create kids-english --public --source=. --remote=origin --push
```

### 3. 開啟 GitHub Pages（只做一次）
到 repo 的 **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。

### 4. 等待部署
到 repo 的 **Actions** 分頁，看到「Deploy to GitHub Pages」跑完（約 1–2 分鐘）✅
完成後網址就是 `https://<你的帳號>.github.io/kids-english/`，傳給任何人即可在電腦/手機/平板打開。

---

## 之後要更新內容
改完檔案（例如新增課程 JSON）後：
```bash
git add .
git commit -m "新增課程"
git push
```
推上去後會**自動重新部署**，大家重新整理就會看到新版本。

## 小提醒
- 用 **Public** repo 最單純（程式內沒有任何密碼或私密資料）。
- 網站是 HTTPS → 手機麥克風（口說錄音）、加到主畫面、離線都可用。
- 各裝置進度仍是各自獨立；要搬進度用 App 內「設定 → 下載備份 / 匯入」。
