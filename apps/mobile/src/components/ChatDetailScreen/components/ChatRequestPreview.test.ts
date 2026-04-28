import {readFileSync} from 'node:fs'
import path from 'node:path'

const componentSource = readFileSync(
  path.join(__dirname, 'ChatRequestPreview.tsx'),
  'utf8'
)

describe('ChatRequestPreview source', () => {
  test('uses shared ui primitives instead of legacy local primitives', () => {
    expect(componentSource).toMatch(/Typography/)
    expect(componentSource).toMatch(/FlagReport/)
    expect(componentSource).not.toContain("import Image from '../../Image'")
    expect(componentSource).not.toContain('flagSvg')
    expect(componentSource).not.toMatch(
      /import\s*\{[^}]*\bText\b[^}]*\}\s*from 'tamagui'/
    )
    expect(componentSource).not.toMatch(/getTokens/)
  })

  test('uses shared tokens and semantic theme colors', () => {
    expect(componentSource).toMatch(/tokens/)
    expect(componentSource).not.toContain('"$greyOnWhite"')
    expect(componentSource).not.toContain('"$black"')
    expect(componentSource).not.toContain('"$darkRed"')
    expect(componentSource).not.toContain('"$red"')
    expect(componentSource).not.toContain('"$greyAccent5"')
    expect(componentSource).toMatch(
      /\$foregroundPrimary|\$foregroundSecondary|\$backgroundTertiary|\$redBackground|\$redForeground/
    )
  })
})
