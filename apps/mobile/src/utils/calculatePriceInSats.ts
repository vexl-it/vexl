import {SATOSHIS_IN_BTC} from '../state/currentBtcPriceAtoms'

function calculatePriceInSats({
  price,
  currentBtcPrice,
}: {
  price: number
  currentBtcPrice: number
}): number | null {
  return currentBtcPrice !== 0
    ? Math.round((price / currentBtcPrice) * SATOSHIS_IN_BTC)
    : null
}

export default calculatePriceInSats
