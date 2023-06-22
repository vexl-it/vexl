import {type Currency} from '@vexl-next/domain/dist/general/offers'
import {type TabProps} from '../../../Tabs'
import {useMemo} from 'react'

export default function useContent(): Array<TabProps<Currency>> {
  return useMemo(
    () => [
      {
        title: 'CZK',
        type: 'CZK',
      },
      {
        title: 'EUR',
        type: 'EUR',
      },
      {
        title: 'USD',
        type: 'USD',
      },
    ],
    []
  )
}
