import React from 'react'
import ProgressPopup, {Props} from './index'
import {fireEvent, render, screen} from 'testUtils'
import {View} from 'react-native'

const defaultProps: Omit<Props, 'children'> = {
  onSkip: () => undefined,
  onNext: () => undefined,
  onFinish: () => undefined,
  numberOfPages: 3,
  currentPage: 0,
}

function renderElement(props: Partial<Props>): void {
  const toUse = {...defaultProps, ...props}
  render(
    <ProgressPopup {...toUse}>
      <View testID="content" />
    </ProgressPopup>
  )
}

test('renders the content', () => {
  renderElement({})
  expect(screen.getByTestId('content')).toBeTruthy()
})

test('renders the correct number of breadcrumbs', () => {
  const numberOfPages = 10
  const currentPage = 7
  renderElement({numberOfPages, currentPage})
  screen.getAllByTestId('breadcrumb').forEach((breadcrumb, index) => {
    expect(breadcrumb).toHaveStyle({
      opacity: index <= currentPage ? 1 : 0.2,
    })
  })
})

test('onNext is called after next button is clicked', async () => {
  const onNext = jest.fn()
  renderElement({onNext})

  const nextButton = screen.getByText('common.next')
  fireEvent.press(nextButton, {})
  expect(onNext).toBeCalledWith(1)
})

test('onSkip is called after skip button is clicked', async () => {
  const onSkip = jest.fn()
  renderElement({onSkip})

  const skipButton = screen.getByText('common.skip')
  fireEvent.press(skipButton, {})
  expect(onSkip).toBeCalled()
})

test('finish button is displayed when on the last page, onFinish is called when finish button is pressed', async () => {
  const onFinish = jest.fn()
  renderElement({onFinish, numberOfPages: 3, currentPage: 2})

  const finishButton = screen.getByText('common.finish')
  fireEvent.press(finishButton, {})
  expect(onFinish).toBeCalled()
})
