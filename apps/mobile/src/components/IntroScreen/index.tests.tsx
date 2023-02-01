import Intro from './index'
import {render, screen, fireEvent} from 'testUtils'

test('pages are switching properly', () => {
  render(<Intro />)
  const nextButton = screen.getByText('common.next')

  expect(screen.getByText('intro.title1')).toBeTruthy()
  fireEvent.press(nextButton, {})
  expect(screen.getByText('intro.title2')).toBeTruthy()
  fireEvent.press(nextButton, {})
  expect(screen.getByText('intro.title3')).toBeTruthy()
})

xtest('skip button goes to login screen', () => {
  // TODO
})

xtest('finish button goes to login screen', () => {
  // TODO
})
