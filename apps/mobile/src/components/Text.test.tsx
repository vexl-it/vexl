import {render, screen} from 'testUtils'
import Text from './Text'

test('Text is rendered', () => {
  const text = 'text'

  render(<Text colorStyle="white">{text}</Text>)
  expect(screen.getByText(text)).toBeVisible()
})
