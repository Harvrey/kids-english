import { test, expect, type Page } from '@playwright/test'

// 建立一個星航員並進入星河地圖（dashboard）
async function createAndEnter(page: Page, name: string) {
  await page.goto('/')
  await expect(page.getByText('選擇你的星航員，開始英文冒險！')).toBeVisible()
  await page.getByText('新增星航員').click()
  await page.getByPlaceholder('例如：小宇').fill(name)
  await page.getByRole('button', { name: '建立' }).click()
  // 回到列表後，點剛建立的星航員卡片進入
  await page.getByText(name, { exact: false }).click()
  await expect(page.getByText('星河地圖')).toBeVisible()
}

// 進入第 1 課並走完學習階段，抵達第一題
async function enterFirstLessonExercises(page: Page) {
  await page.getByRole('button', { name: /打招呼 Greetings/ }).click()
  await expect(page.getByText('學習新內容')).toBeVisible()
  const start = page.getByRole('button', { name: /開始練習/ })
  const next = page.getByRole('button', { name: /下一個/ })
  for (let i = 0; i < 15; i++) {
    if (await start.isVisible()) break
    await next.click()
  }
  await start.click()
}

test('建立星航員 → 進入星河地圖，看到第一個單元與課程', async ({ page }) => {
  await createAndEnter(page, '小測試A')
  await expect(page.getByText('Hello, Friends!')).toBeVisible()
  await expect(page.getByRole('button', { name: /打招呼 Greetings/ })).toBeVisible()
})

test('重新整理後自動接回進度（IndexedDB 持久化）', async ({ page }) => {
  await createAndEnter(page, '小測試B')
  await page.reload()
  await expect(page.getByText('星河地圖')).toBeVisible()
  await expect(page.getByText('小測試B')).toBeVisible()
})

test('進入課程 → 走完學習階段 → 抵達練習題', async ({ page }) => {
  await createAndEnter(page, '小測試C')
  await enterFirstLessonExercises(page)
  // 第一題是引導配對題，應看到「送出」按鈕
  await expect(page.getByRole('button', { name: '送出' })).toBeVisible()
})

test('完成配對題 → 自動批改 → 出現「繼續」回饋', async ({ page }) => {
  await createAndEnter(page, '小測試D')
  await enterFirstLessonExercises(page)

  // 完成配對：點左欄英文，再點右欄中文
  const pairs: [RegExp, string][] = [
    [/hello/, '你好'],
    [/goodbye/, '再見'],
    [/thank you/, '謝謝'],
  ]
  for (const [left, right] of pairs) {
    await page.getByRole('button', { name: left }).first().click()
    await page.getByRole('button', { name: right, exact: true }).first().click()
  }

  await page.getByRole('button', { name: '送出' }).click()
  // 批改後應出現「繼續」按鈕（代表 grade() 與回饋流程正常）
  await expect(page.getByRole('button', { name: /繼續/ })).toBeVisible()
})
