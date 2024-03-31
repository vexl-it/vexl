import {SATOSHIS_IN_BTC} from '../state/currentBtcPriceAtoms'

function calculatePriceInFiatFromSats({
  satsNumber,
  currentBtcPrice,
}: {
  satsNumber: number
  currentBtcPrice: number
}): number {
  return Math.round(currentBtcPrice * (satsNumber / SATOSHIS_IN_BTC))
}

export default calculatePriceInFiatFromSats
