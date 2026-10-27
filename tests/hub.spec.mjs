import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// The family code lives only in private/ (gitignored), never in the public repo.
const FAMILY_CODE = process.env.HUB_CODE ?? readFileSync(new URL('../private/family-code.txt', import.meta.url), 'utf8').trim()

// Waits until the offline helper is installed and in charge of the page.
async function readyOffline(page) {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
}

const cacheNames = (page) => page.evaluate(() => caches.keys())

test('launchpad lists the games and fits the screen', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'GameHub', exact: true })).toBeVisible()
  await expect(page.locator('.game')).toHaveCount(5)
  await expect(page.getByRole('link', { name: 'Play Melody Garden' })).toHaveAttribute('href', '/games/melody-garden/')
  await expect(page.getByRole('link', { name: 'Play Calm Bubbles' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Play Quiet Words' })).toHaveAttribute('href', '/quiet_words/')
  await expect(page.locator('.game-soon')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Play Love To Color' })).toHaveAttribute('href', '/love-to-color/')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('manifest makes one app covering the whole site', async ({ request }) => {
  const manifest = await (await request.get('/manifest.json')).json()
  expect(manifest).toMatchObject({ name: 'GameHub', scope: '/', start_url: '/', orientation: 'any', display: 'standalone' })
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true)
})

test('play, tap to start, pop a bubble, exit to the hub', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Play Calm Bubbles' }).click()
  await expect(page).toHaveURL(/\/games\/bubbles\/$/)
  await page.getByRole('button', { name: 'Tap to Start' }).click()
  await expect(page.locator('.hub-start')).toHaveCount(0)

  // Tap across the screen until a bubble pops.
  const before = Number(await page.locator('#popped').textContent())
  for (let i = 0; i < 40 && Number(await page.locator('#popped').textContent()) === before; i++) {
    const box = await page.locator('#pond').boundingBox()
    await page.mouse.click(box.width * ((i % 8) + 0.5) / 8, box.height * (Math.floor(i / 8) + 0.5) / 5)
  }
  expect(Number(await page.locator('#popped').textContent())).toBeGreaterThan(before)
  expect(await page.evaluate(() => localStorage.getItem('bubbles:progress'))).toContain('popped')

  await page.getByRole('button', { name: 'Exit to GameHub' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'GameHub', exact: true })).toBeVisible()
})

test('works offline after one visit, and Free up space keeps progress', async ({ page, context }) => {
  await readyOffline(page)
  await page.goto('/games/bubbles/')
  await page.getByRole('button', { name: 'Tap to Start' }).click()
  await page.evaluate(() => localStorage.setItem('bubbles:progress', JSON.stringify({ popped: 7 })))
  await expect.poll(async () => (await cacheNames(page)).sort()).toEqual(expect.arrayContaining(['game-bubbles', 'hub-shared']))

  await context.setOffline(true)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'GameHub', exact: true })).toBeVisible()
  await page.goto('/games/bubbles/')
  await expect(page.getByRole('button', { name: 'Tap to Start' })).toBeVisible()
  await expect(page.locator('#popped')).toHaveText('7')
  await context.setOffline(false)

  await page.goto('/')
  await expect(page.locator('.game').first()).toContainText('Saved for offline')
  await page.getByRole('button', { name: 'Free up space' }).click()
  await page.getByRole('button', { name: 'Free up space' }).last().click()
  await expect(page.locator('.game').first()).toContainText('Not saved for offline yet')
  expect(await cacheNames(page)).not.toContain('game-bubbles')
  expect(await page.evaluate(() => localStorage.getItem('bubbles:progress'))).toBe('{"popped":7}')
})

test('leaves addresses that are not GameHub games alone', async ({ page }) => {
  await readyOffline(page)
  await page.evaluate(() => fetch('/not-a-game/').catch(() => {}))
  const names = await cacheNames(page)
  expect(names.some((n) => n.includes('not-a-game'))).toBe(false)
  for (const name of names) {
    const urls = await page.evaluate(async (n) => (await (await caches.open(n)).keys()).map((r) => r.url), name)
    expect(urls.some((u) => u.includes('/not-a-game/'))).toBe(false)
  }
})

test('never-played game offline shows a friendly page', async ({ page, context }) => {
  await readyOffline(page)
  await context.setOffline(true)
  await page.goto('/games/bubbles/')
  await expect(page.getByText("This game isn't saved for offline yet")).toBeVisible()
  await context.setOffline(false)
})

test('progress moves by transfer code and by hand', async ({ page }) => {
  await page.goto('/games/bubbles/')
  await page.getByRole('button', { name: 'Tap to Start' }).click()
  await page.getByRole('button', { name: 'Settings' }).click()

  // Setting progress by hand is hidden: 5 taps on the heading, then the family code.
  await expect(page.getByLabel('Bubbles popped')).toBeHidden()
  const heading = page.getByRole('heading', { name: 'Settings' })
  for (let i = 0; i < 5; i++) await heading.click()
  await page.getByLabel('Code').fill('0000')
  await page.getByRole('button', { name: 'OK' }).click()
  await expect(page.getByLabel('Code')).toHaveAttribute('placeholder', 'Not quite. Try again')
  await expect(page.getByLabel('Bubbles popped')).toBeHidden()
  await page.getByLabel('Code').fill(FAMILY_CODE)
  await page.getByRole('button', { name: 'OK' }).click()
  await expect(page.getByLabel('Bubbles popped')).toBeVisible()

  await page.getByLabel('Bubbles popped').fill('42')
  await page.getByRole('button', { name: 'Set', exact: true }).click()
  await expect(page.locator('#popped')).toHaveText('42')

  await page.getByRole('button', { name: 'Get transfer code' }).click()
  const code = await page.locator('#code').inputValue()
  expect(code).toMatch(/^GH1\.bubbles\./)

  // A fresh phone: clear everything, then paste the code.
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: 'Tap to Start' }).click()
  await expect(page.locator('#popped')).toHaveText('0')
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Enter a code' }).click()
  await page.locator('#code').fill(code.slice(0, -3))
  await page.getByRole('button', { name: 'Use this code' }).click()
  await expect(page.locator('#message')).toContainText('missing')
  await page.locator('#code').fill(code)
  await page.getByRole('button', { name: 'Use this code' }).click()
  await expect(page.locator('#message')).toHaveText('Progress restored.')
  await expect(page.locator('#popped')).toHaveText('42')
})

test('sound starts after the tap with no errors', async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto('/games/bubbles/')
  await page.getByRole('button', { name: 'Tap to Start' }).click()
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByLabel('Music').check()
  await page.getByRole('button', { name: 'Rain' }).click()
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
})

test('melody garden plays a style, and the dials, players and pause work', async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto('/games/melody-garden/')
  await page.getByRole('button', { name: 'Tap to Start' }).click()
  const state = () =>
    page.evaluate(() => {
      const { sound } = window.melodyGarden
      return { style: sound.style?.id, playing: sound.composer?.playing, muted: [...sound.composer.muted], dials: { ...sound.composer.dials } }
    })
  await expect.poll(async () => (await state()).playing).toBe(true)
  await page.getByRole('radio', { name: /Canyon Flute/ }).click()
  expect((await state()).style).toBe('canyon')
  await page.getByRole('button', { name: 'Heartbeat drum' }).click()
  expect((await state()).muted).toContain('drum')
  await page.getByLabel('Speed').fill('0.9')
  expect((await state()).dials.speed).toBe(0.9)
  // Each style keeps its own settings.
  await page.getByRole('radio', { name: /Rainy Café/ }).click()
  expect((await state()).muted).toEqual([])
  await page.getByRole('radio', { name: /Canyon Flute/ }).click()
  expect((await state()).muted).toContain('drum')
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect.poll(async () => (await state()).playing).toBe(false)
  await page.waitForTimeout(500)
  expect(errors).toEqual([])
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('every music style makes sound, without clipping', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-size', 'checked once')
  await page.goto('/games/melody-garden/')
  const levels = await page.evaluate(async () => {
    const { Composer } = await import('/shared/v1/sound/composer.js')
    const { STYLES } = await import('/shared/v1/sound/styles.js')
    const out = {}
    for (const style of STYLES) {
      const ctx = new OfflineAudioContext(1, 44100 * 8, 44100)
      const c = new Composer(ctx, ctx.destination)
      c.setStyle(style)
      c.setDials(style.dials)
      c.start()
      for (let t = 0; t < 8; t += 0.25) c.schedule(t, t + 1.5)
      const d = (await ctx.startRendering()).getChannelData(0)
      let sum = 0
      let peak = 0
      for (let i = 44100; i < d.length; i++) {
        sum += d[i] * d[i]
        peak = Math.max(peak, Math.abs(d[i]))
      }
      out[style.id] = { rms: 20 * Math.log10(Math.sqrt(sum / (d.length - 44100))), peak }
    }
    return out
  })
  for (const [id, { rms, peak }] of Object.entries(levels)) {
    expect(rms, id).toBeGreaterThan(-30)
    expect(peak, id).toBeLessThan(1)
  }
})
