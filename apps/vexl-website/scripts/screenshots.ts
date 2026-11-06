// Usage: pnpm --filter vexl-website screenshots <before|after> <name> <path> [css selector]
// Saves .screenshots/<name>/<before|after>-{desktop,mobile}.png from the
// running dev server (WEBSITE_URL, default http://localhost:3000). With a
// selector it captures that element, otherwise the whole page.
import path from 'node:path'
import {chromium, devices} from 'playwright'

const [label, name, pagePath, selector] = process.argv.slice(2)
if (
  (label !== 'before' && label !== 'after') ||
  name === undefined ||
  pagePath === undefined
) {
  console.error(
    'Usage: screenshots <before|after> <name> <path> [css selector]'
  )
  process.exit(1)
}

const baseUrl = process.env.WEBSITE_URL ?? 'http://localhost:3000'
const outDir = path.join(import.meta.dirname, '..', '.screenshots', name)
const viewports = {
  desktop: {viewport: {width: 1440, height: 900}},
  mobile: devices['iPhone 13'],
}
// The copy editor and Next's dev indicator only exist under next dev
const hideDevTools =
  '.vexl-copy-editor, nextjs-portal { display: none !important; }'

const browser = await chromium.launch()
for (const [viewportName, options] of Object.entries(viewports)) {
  const page = await browser.newPage(options)
  await page.goto(new URL(pagePath, baseUrl).href, {waitUntil: 'networkidle'})
  await page.addStyleTag({content: hideDevTools})
  // Scroll through once so lazy images load and scroll animations finish
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 60))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(1000)

  const file = path.join(outDir, `${label}-${viewportName}.png`)
  const shot = {path: file, animations: 'disabled'} as const
  if (selector === undefined) await page.screenshot({...shot, fullPage: true})
  else await page.locator(selector).first().screenshot(shot)
  console.log(file)
  await page.close()
}
await browser.close()
