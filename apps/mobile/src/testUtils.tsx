/* eslint-disable */

import {render, type RenderOptions} from '@testing-library/react-native'
import React, {type FC, type ReactElement} from 'react'
import ThemeProvider from './utils/ThemeProvider'
// import I18nProvider from './utils/localization/I18nProvider'

const AllTheProviders: FC<{children: React.ReactNode}> = ({children}) => {
  return <ThemeProvider>{children}</ThemeProvider>
}

// @ts-ignore
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, {wrapper: AllTheProviders, ...options})

export * from '@testing-library/react-native'
export {customRender as render}
