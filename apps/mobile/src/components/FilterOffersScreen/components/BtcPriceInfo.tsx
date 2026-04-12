import {useAtomValue} from 'jotai'
import React from 'react'
import SharedBtcPriceInfo from '../../BtcPriceInfo'
import {btcPriceForFilterCurrencyAtom, currencyAtom} from '../atom'

function BtcPriceInfo(): React.ReactElement | null {
  const btcPriceData = useAtomValue(btcPriceForFilterCurrencyAtom)
  const currency = useAtomValue(currencyAtom)

  if (!currency) return null

  return <SharedBtcPriceInfo btcPriceData={btcPriceData} currency={currency} />
}

export default BtcPriceInfo
