import {readFileSync} from 'node:fs'
import path from 'node:path'

const readComponentSource = (relativePath: string): string =>
  readFileSync(path.join(__dirname, relativePath), 'utf8')

const requestScreenSource = readComponentSource('RequestScreen.tsx')
const acceptDeclineButtonsSource = readComponentSource(
  'AcceptDeclineButtons.tsx'
)
const requestScreenChatHeaderSource = readComponentSource(
  'RequestScreenChatHeader.tsx'
)
const rerequestOrCancelButtonSource = readComponentSource(
  'RerequestOrCancelButton.tsx'
)
const infoSquareSource = readComponentSource('../../InfoSquare.tsx')
const offerRequestTextInputSource = readComponentSource(
  '../../OfferRequestTextInput.tsx'
)

describe('RequestScreen component source', () => {
  test('uses shared ui primitives and shared buttons in the screen composition', () => {
    expect(requestScreenSource).toMatch(
      /import\s*\{[^}]*Button[^}]*ScrollView[^}]*Stack[^}]*YStack[^}]*\}\s*from '@vexl-next\/ui'/
    )
    expect(requestScreenSource).not.toContain(
      "import {ScrollView} from 'tamagui'"
    )
    expect(requestScreenSource).not.toContain(
      "import Button from '../../Button'"
    )
  })

  test('keeps child actions on redesigned ui components', () => {
    expect(acceptDeclineButtonsSource).toMatch(
      /import\s*\{[^}]*Button[^}]*XStack[^}]*\}\s*from '@vexl-next\/ui'/
    )
    expect(acceptDeclineButtonsSource).not.toContain(
      "import {XStack, type XStackProps} from 'tamagui'"
    )
    expect(acceptDeclineButtonsSource).not.toContain(
      "import Button from '../../Button'"
    )

    expect(rerequestOrCancelButtonSource).toMatch(
      /import\s*\{[^}]*Button[^}]*XStack[^}]*\}\s*from '@vexl-next\/ui'/
    )
    expect(rerequestOrCancelButtonSource).not.toContain("from 'tamagui'")
    expect(rerequestOrCancelButtonSource).not.toContain(
      "import Button from '../../Button'"
    )
  })

  test('uses redesigned primitives and semantic colors for helper content', () => {
    expect(infoSquareSource).toMatch(
      /import\s*\{[^}]*InfoCircle[^}]*Typography[^}]*XStack[^}]*\}\s*from '@vexl-next\/ui'/
    )
    expect(infoSquareSource).not.toContain("import Image from './Image'")
    expect(infoSquareSource).not.toContain('infoSvg')
    expect(infoSquareSource).not.toMatch(/getTokens/)
    expect(infoSquareSource).toMatch(
      /\$backgroundTertiary|\$redBackground|\$foregroundPrimary|\$redForeground/
    )
    expect(infoSquareSource).not.toContain("'$grey'")
    expect(infoSquareSource).not.toContain("'$white'")
    expect(infoSquareSource).not.toContain("'$red'")
    expect(infoSquareSource).not.toContain("'$darkRed'")

    expect(offerRequestTextInputSource).toMatch(
      /import\s*\{[^}]*TextArea[^}]*tokens[^}]*\}\s*from '@vexl-next\/ui'/
    )
    expect(offerRequestTextInputSource).not.toContain(
      "import TextInput from './Input'"
    )
    expect(offerRequestTextInputSource).not.toContain(
      "import {StyleSheet} from 'react-native'"
    )
    expect(offerRequestTextInputSource).not.toMatch(/getTokens/)
  })

  test('keeps the request header on shared redesigned primitives', () => {
    expect(requestScreenChatHeaderSource).toMatch(
      /import\s*\{[^}]*NavButton[^}]*Typography[^}]*XStack[^}]*\}\s*from '@vexl-next\/ui'/
    )
    expect(requestScreenChatHeaderSource).not.toMatch(
      /import\s*\{[^}]*Text[^}]*\}\s*from 'tamagui'/
    )
    expect(requestScreenChatHeaderSource).not.toContain("'$grey'")
    expect(requestScreenChatHeaderSource).not.toContain("'$black'")
    expect(requestScreenChatHeaderSource).not.toContain("'$darkRed'")
  })
})
