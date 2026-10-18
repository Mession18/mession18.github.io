import { test, expect, type Page, type TestInfo } from '@playwright/test'

const siteTitle = '风铃岛通信'
const sections = [
  ['posts', '文章'], ['museum', '博物馆'], ['recipes', '菜谱'],
  ['crafts', '手工'], ['travel', '旅游'], ['planting', '种植'], ['passport', '护照'],
] as const

async function open(page: Page, route = '/') {
  const readyStarted = Date.now()
  await page.goto(`/#${route}`, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('#root main')).toBeVisible()
  await expect(page.locator('header.topbar .brand')).toBeVisible()
  await expect(page.locator('.route-transition')).not.toBeEmpty()
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  if (route === '/') {
    await page.waitForLoadState('load', { timeout: 45_000 })
    await expect(page.locator('.island-scene-3d canvas')).toBeVisible({ timeout: 45_000 })
    await page.evaluate(async () => {
      await document.fonts.ready
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    })
    test.info().annotations.push({ type: 'home-readiness-ms', description: String(Date.now() - readyStarted) })
  }
}

async function photo(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.jpg`)
  await page.screenshot({ path, type: 'jpeg', quality: 65, fullPage: false })
  await info.attach(name, { path, contentType: 'image/jpeg' })
}

test.beforeEach(async ({ page }) => {
  const health = { pageErrors: [] as string[], consoleErrors: [] as string[], externalFailures: [] as string[] }
  page.on('pageerror', error => health.pageErrors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') health.consoleErrors.push(message.text())
  })
  page.on('requestfailed', request => {
    if (!request.url().startsWith('http://127.0.0.1:4173')) {
      health.externalFailures.push(`${request.url()}: ${request.failure()?.errorText}`)
    }
  })
  ;(page as Page & { qaHealth?: typeof health }).qaHealth = health
})

test.afterEach(async ({ page }, info) => {
  const health = (page as Page & { qaHealth?: { pageErrors: string[], consoleErrors: string[], externalFailures: string[] } }).qaHealth
  if (!health) return
  await info.attach('console-health', { body: JSON.stringify(health, null, 2), contentType: 'application/json' })
  expect(health.pageErrors, 'uncaught application runtime errors').toEqual([])
  // Network service errors are recorded separately; code/runtime/WebGL errors remain failures.
  const codeErrors = health.consoleErrors.filter(message => !/Failed to load resource:|net::ERR_|weather|天气|geolocation/i.test(message))
  expect(codeErrors, 'application or WebGL console errors').toEqual([])
})

test('sandbox launch, first meaningful screen and original font', async ({ page, browser }, info) => {
  await info.attach('runtime', {
    body: JSON.stringify({ browser: browser.version(), node: process.version, chromiumSandbox: true }),
    contentType: 'application/json',
  })
  await open(page)
  await expect(page).toHaveTitle(siteTitle)
  await expect(page.getByRole('link', { name: '去岛上逛逛' })).toBeVisible()
  const font = await page.locator('body').evaluate(element => getComputedStyle(element).fontFamily)
  expect(font).toContain('ZCOOL KuaiLe')
  await expect(page.getByRole('button', { name: /唤醒小猫/ })).toHaveAttribute('aria-pressed', 'false')
  expect(await page.locator('.island-cat').count()).toBe(0)
  await photo(page, info, 'home')
})

test('Hero initial and repeated hash scroll', async ({ page }, info) => {
  await open(page)
  const cta = page.getByRole('link', { name: '去岛上逛逛' })
  await cta.click({ noWaitAfter: true })
  await expect(page).toHaveURL(/#\/#journal$/)
  const journal = page.locator('#journal')
  await expect.poll(async () => Math.abs(await journal.evaluate(element => element.getBoundingClientRect().top) - 94)).toBeLessThan(8)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await cta.click({ noWaitAfter: true })
  await expect.poll(async () => Math.abs(await journal.evaluate(element => element.getBoundingClientRect().top) - 94)).toBeLessThan(8)
  await photo(page, info, 'journal-after-repeat')
})

test('seven routes, navigation history, detail title and metadata reset', async ({ page }, info) => {
  await open(page)
  for (const [slug, label] of sections) {
    if (info.project.name === 'mobile' && ['crafts', 'travel', 'planting', 'passport'].includes(slug)) {
      await page.getByRole('button', { name: '更多' }).click()
      await page.getByRole('navigation', { name: '更多栏目' }).getByRole('link', { name: label, exact: true }).click({ noWaitAfter: true })
    } else {
      await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: label, exact: true }).click({ noWaitAfter: true })
    }
    await expect(page).toHaveURL(new RegExp(`#/${slug}$`))
    await expect(page).toHaveTitle(`${label} · ${siteTitle}`)
    await expect(page.locator('.route-transition')).not.toBeEmpty()
    await expect(page.locator('.opening-loading-overlay')).toHaveCount(0)
    expect(await page.locator('.route-transition').innerText()).not.toMatch(/^正在打开内容…$/)
  }
  await page.goBack()
  await expect(page).toHaveTitle(`种植 · ${siteTitle}`)
  await page.goForward()
  await expect(page).toHaveTitle(`护照 · ${siteTitle}`)
  await page.locator('header.topbar .brand').click()
  await expect(page).toHaveTitle(siteTitle)
  await open(page, '/crafts/bottle-lamp')
  await expect(page).toHaveTitle(`星光玻璃瓶 · ${siteTitle}`)
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
  await expect(page.locator('meta[name="description"]')).not.toHaveAttribute('content', /十15字/)
  await page.locator('header.topbar .brand').click()
  await expect(page).toHaveTitle(siteTitle)
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')
  await photo(page, info, 'home-title-reset')
})

test('mobile More disclosure keyboard, outside click, links and width', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile-only disclosure')
  await open(page, '/posts')
  const nav = page.getByRole('navigation', { name: '主导航' })
  const more = nav.getByRole('button', { name: '更多' })
  await expect(nav.locator('a:visible')).toHaveCount(3)
  await more.focus()
  await page.keyboard.press('Enter')
  await expect(more).toHaveAttribute('aria-expanded', 'true')
  const panel = page.getByRole('navigation', { name: '更多栏目' })
  await expect(panel.getByRole('link')).toHaveCount(4)
  await page.keyboard.press('Tab')
  await expect(panel.getByRole('link', { name: '手工', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(panel.getByRole('link', { name: '旅游', exact: true })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(panel.getByRole('link', { name: '手工', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(more).toHaveAttribute('aria-expanded', 'false')
  await expect(more).toBeFocused()
  await page.keyboard.press('Space')
  await expect(more).toHaveAttribute('aria-expanded', 'true')
  await photo(page, info, 'mobile-more-keyboard')
  const box = await panel.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(390)
  await page.mouse.click(5, 150)
  await expect(more).toHaveAttribute('aria-expanded', 'false')
  await more.click()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/crafts$/)
  await expect(more).toHaveAttribute('aria-expanded', 'false')
  await expect(more).toBeFocused()
  for (const width of [320, 375, 390, 850]) {
    await page.setViewportSize({ width, height: 844 })
    const dimensions = await nav.evaluate(element => ({ client: element.clientWidth, scroll: element.scrollWidth }))
    expect(dimensions.scroll, `nav overflow at ${width}px`).toBeLessThanOrEqual(dimensions.client + 1)
  }
})

test('compressed images decode with correct dimensions', async ({ page }, info) => {
  await open(page, '/passport')
  const dimensions = await page.evaluate(async () => {
    const result = []
    for (const path of ['/images/common/icons/cooking-recipe-84.webp', '/images/passport/avatar-480.webp']) {
      const image = new Image()
      image.src = path
      await image.decode()
      result.push({ path, width: image.naturalWidth, height: image.naturalHeight })
    }
    return result
  })
  expect(dimensions.map(image => [image.width, image.height])).toEqual([[66, 84], [480, 480]])
  await photo(page, info, 'passport-images')
})

test('cat model is requested only after opt-in and WebGL renders', async ({ page }, info) => {
  const models: string[] = []
  page.on('request', request => {
    if (request.url().includes('/models/jinzi-rigged.glb')) models.push(request.url())
  })
  await open(page, '/posts')
  await expect(page.getByRole('button', { name: /唤醒小猫/ })).toHaveAttribute('aria-pressed', 'false')
  expect(models).toHaveLength(0)
  const loaded = page.waitForResponse(response => response.url().includes('/models/jinzi-rigged.glb') && response.ok())
  await page.getByRole('button', { name: /唤醒小猫/ }).click()
  await loaded
  await expect(page.locator('.island-cat canvas')).toBeVisible()
  await expect.poll(async () => page.locator('.island-cat-3d-loading').count()).toBe(0)
  const drawingBuffer = await page.locator('.island-cat canvas').evaluate(element => {
    const canvas = element as HTMLCanvasElement
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!gl) return null
    return { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight, lost: gl.isContextLost() }
  })
  expect(drawingBuffer).not.toBeNull()
  expect(drawingBuffer!.lost).toBe(false)
  expect(drawingBuffer!.width).toBeGreaterThan(0)
  await photo(page, info, 'cat-webgl')
  await page.getByRole('button', { name: /切换轻量模式/ }).click()
  await expect(page.locator('.island-cat')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /唤醒小猫/ })).toHaveAttribute('aria-pressed', 'false')
})

test('reduced motion disables route animation and cat opt-in', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const models: string[] = []
  page.on('request', request => {
    if (request.url().includes('/models/jinzi-rigged.glb')) models.push(request.url())
  })
  await open(page)
  await expect(page.getByRole('button', { name: /轻量陪伴/ })).toBeDisabled()
  expect(await page.locator('.route-transition').evaluate(element => getComputedStyle(element).animationName)).toBe('none')
  expect(await page.locator('html').evaluate(element => getComputedStyle(element).scrollBehavior)).toBe('auto')
  await page.getByRole('link', { name: '去岛上逛逛' }).click()
  await expect(page).toHaveURL(/#\/#journal$/)
  await expect.poll(async () => Math.abs(await page.locator('#journal').evaluate(element => element.getBoundingClientRect().top) - 94)).toBeLessThan(8)
  expect(models).toHaveLength(0)
  await photo(page, info, 'reduced-motion')
})
