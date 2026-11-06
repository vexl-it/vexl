import {toHtml} from 'hast-util-to-html'
import {describe, expect, it} from 'vitest'
import {sanitizePostHtml} from './sanitizePostHtml'

const sanitize = (html: string): string => toHtml(sanitizePostHtml(html))

describe('sanitizePostHtml', () => {
  it('strips everything a hostile editor could inject', () => {
    const hostile = [
      '<script>alert(1)</script>',
      '<style>body{display:none}</style>',
      '<p onclick="alert(1)" style="position:fixed" class="x">Hi <em>there</em></p>',
      '<img src="https://resources.vexl.it/content/cms/a.png" onerror="alert(1)">',
      '<img src="https://evil.example/tracker.png">',
      '<a href="javascript:alert(1)">bad</a>',
      '<a href="https://example.com" target="_blank" onmouseover="alert(1)">ext</a>',
      '<a href="mailto:hello@vexl.it">mail</a>',
      '<iframe src="https://evil.example/embed"></iframe>',
      '<iframe src="https://www.youtube.com/embed/K2HGlA5SoEc" title="Vexl" onload="alert(1)"></iframe>',
      '<form action="https://evil.example"><input name="seed"></form>',
      '<svg><a href="javascript:alert(1)">svg</a></svg>',
    ].join('')

    expect(sanitize(hostile)).toBe(
      [
        '<p>Hi <em>there</em></p>',
        '<img src="https://resources.vexl.it/content/cms/a.png">',
        '<a>bad</a>',
        '<a href="https://example.com" target="_blank" rel="noopener noreferrer">ext</a>',
        '<a href="mailto:hello@vexl.it">mail</a>',
        '<iframe src="https://www.youtube-nocookie.com/embed/K2HGlA5SoEc" title="Vexl"></iframe>',
        '<a>svg</a>',
      ].join('')
    )
  })

  it("keeps Webflow's figure markup", () => {
    const figure =
      '<figure style="max-width:80%" class="w-richtext-figure-type-image w-richtext-align-center" data-rt-type="image"><div><img src="https://resources.vexl.it/content/cms/a.png" loading="lazy"></div><figcaption>Caption</figcaption></figure>'

    expect(sanitize(figure)).toBe(
      '<figure style="max-width:80%" class="w-richtext-figure-type-image w-richtext-align-center"><div><img src="https://resources.vexl.it/content/cms/a.png"></div><figcaption>Caption</figcaption></figure>'
    )
  })

  it('leaves links to vexl.it without rel', () => {
    expect(sanitize('<a href="https://vexl.it/faq">FAQ</a>')).toBe(
      '<a href="https://vexl.it/faq">FAQ</a>'
    )
  })
})
