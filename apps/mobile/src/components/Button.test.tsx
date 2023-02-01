import Button from './Button'
import {render, screen, fireEvent} from 'testUtils'

test('onPress call function', () => {
  const text = 'text'
  const onPress = jest.fn()
  render(<Button variant="primary" text="text" onPress={onPress} />)

  fireEvent.press(screen.getByText(text), {})
  expect(onPress).toBeCalledTimes(1)
})
