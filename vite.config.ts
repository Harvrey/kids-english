/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base 設定：
// - GitHub Actions 自動部署 GitHub Pages 時，自動帶入 `/<repo名>/`（讀內建 GITHUB_REPOSITORY）
// - 其他情況（本機、Netlify、Vercel、Cloudflare）用相對路徑 './'，到處都能跑
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.GITHUB_ACTIONS && repo ? `/${repo}/` : './'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.svg'],
      manifest: {
        name: '星河探險 · 英文學習',
        short_name: '星河探險',
        description: '給小孩的英文自學樂園（108 課綱 + CEFR）',
        theme_color: '#0b1026',
        background_color: '#0b1026',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: 'icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,svg,png,webmanifest,mp3,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // 課程內容與音檔：離線可用
            urlPattern: ({ url }) => url.pathname.includes('/content/') || url.pathname.includes('/audio/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'lesson-content' },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
