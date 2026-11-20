import {Either} from 'effect'
import {describe, expect, it} from 'vitest'
import {inlineCopyToPlainText, parseInlineCopy} from './inlineCopy'

const problem = (source: string): string | undefined =>
  Either.match(parseInlineCopy(source), {
    onLeft: (error) => error.message,
    onRight: () => undefined,
  })

describe('parseInlineCopy', () => {
  it('parses bold, italic, links and line breaks', () => {
    expect(
      parseInlineCopy('**Hi** *there*\n[**site**](https://vexl.foundation)')
    ).toEqual(
      Either.right([
        {type: 'strong', children: [{type: 'text', text: 'Hi'}]},
        {type: 'text', text: ' '},
        {type: 'em', children: [{type: 'text', text: 'there'}]},
        {type: 'break'},
        {
          type: 'link',
          href: 'https://vexl.foundation',
          children: [
            {type: 'strong', children: [{type: 'text', text: 'site'}]},
          ],
        },
      ])
    )
  })

  it.each(['mailto:contact@vexl.foundation', '/', 'http://example.com'])(
    'accepts %s links',
    (href) => {
      expect(problem(`[x](${href})`)).toBeUndefined()
    }
  )

  it.each([
    ['empty copy', ' '],
    ['HTML', '<script>alert(1)</script>'],
    ['HTML', 'Hi <b>there</b>'],
    ['a javascript: link', '[x](javascript:alert(1))'],
    ['a data: link', '[x](data:text/html,hi)'],
    ['a protocol-relative link', '[x](//evil.example)'],
    ['an unclosed bold', '**bold'],
    ['an unclosed italic', '*italic'],
    ['an unclosed link', '[text](https://vexl.foundation'],
    ['a link in a link', '[a [b](/x)](/y)'],
  ])('rejects %s', (_, source) => {
    expect(problem(source)).toBeDefined()
  })

  it('strips markup for plain text', () => {
    expect(
      inlineCopyToPlainText(
        '**Open** source on [**GitHub**](https://github.com)**.**'
      )
    ).toBe('Open source on GitHub.')
  })
})
