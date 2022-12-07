import React, {FC, ReactElement} from 'react'
import {render, RenderOptions} from '@testing-library/react-native'
import ThemeProvider from './utils/ThemeProvider'
// import I18nProvider from './utils/localization/I18nProvider'

const AllTheProviders: FC<{children: React.ReactNode}> = ({children}) => {
  return <ThemeProvider>{children}</ThemeProvider>
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, {wrapper: AllTheProviders, ...options})

export * from '@testing-library/react-native'
export {customRender as render}
