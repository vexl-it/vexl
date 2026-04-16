import {View} from 'react-native'
import {fireEvent, render, screen} from 'testUtils'
import Button from './Button'

test('onPress call function', () => {
  const text = 'text'
  const onPress = jest.fn()
  render(<Button variant="primary" text="text" onPress={onPress} />)

  fireEvent.press(screen.getByText(text), {})
  expect(onPress).toHaveBeenCalledTimes(1)
})

test('renders icon element before text', () => {
  render(
    <Button
      variant="primary"
      text="text"
      onPress={jest.fn()}
      icon={<View testID="button-icon-element" />}
    />
  )

  expect(screen.getByTestId('button-icon-element')).toBeOnTheScreen()
})
