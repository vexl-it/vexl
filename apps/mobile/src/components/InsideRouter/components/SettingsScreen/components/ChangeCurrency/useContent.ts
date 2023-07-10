import {type CurrencyCode} from '@vexl-next/domain/dist/general/offers'

import {useMemo} from 'react'

export default function useContent(): Array<{
  title: string
  currency: CurrencyCode
}> {
  return useMemo(
    () => [
      {
        title: 'CZK',
        currency: 'CZK',
      },
      {
        title: 'EUR',
        currency: 'EUR',
      },
      {
        title: 'USD',
        currency: 'USD',
      },
    ],
    []
  )
}
