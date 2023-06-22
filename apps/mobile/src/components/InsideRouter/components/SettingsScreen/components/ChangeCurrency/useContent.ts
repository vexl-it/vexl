import {type Currency} from '@vexl-next/domain/dist/general/offers'

import {useMemo} from 'react'

export default function useContent(): Array<{
  title: string
  currency: Currency
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
