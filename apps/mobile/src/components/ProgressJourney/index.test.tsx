import React from 'react'
import ProgressJourney, {type Props} from './index'
import {fireEvent, render, screen} from 'testUtils'
import {View} from 'react-native'

const defaultProps: Omit<Props, 'children'> = {
  onSkip: () => undefined,
  onPageChange: () => undefined,
  onFinish: () => undefined,
  numberOfPages: 3,
  currentPage: 0,
}

function renderElement(props: Partial<Props>): void {
  const toUse = {...defaultProps, ...props}
  render(
    <ProgressJourney {...toUse}>
      <View testID="content" />
    </ProgressJourney>
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

test('onPageChange is called after next button is clicked', async () => {
  const onPageChange = jest.fn()
  renderElement({onPageChange})

  const nextButton = screen.getByText('common.next')
  fireEvent.press(nextButton, {})
  expect(onPageChange).toBeCalledWith(1)
})

test('onPageChange is called after back button is clicked', async () => {
  const onPageChange = jest.fn()
  renderElement({onPageChange, withBackButton: true})

  const backButton = screen.getByText('common.back')
  fireEvent.press(backButton, {})
  expect(onPageChange).toBeCalledWith(1)
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
