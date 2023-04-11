import {pipe} from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import {stringifyToPrettyJson} from '@vexl-next/resources-utils/dist/utils/parsing'

const dummyOffer = {
  'active': 'true',
  'activePriceCurrency': 'CZK',
  'activePriceState': 'NONE',
  'activePriceValue': '0',
  'amountBottomLimit': '0.0',
  'amountTopLimit': '250000.0',
  'btcNetwork': ['LIGHTING'],
  'currency': 'CZK',
  'feeAmount': '1.0',
  'feeState': 'WITHOUT_FEE',
  'groupUuids': [],
  'location': [
    {
      'longitude': '14.4212535000000006135678631835617125034332275390625',
      'latitude': '50.0874653999999992493030731566250324249267578125',
      'city': 'Prague',
    },
  ],
  'locationState': 'ONLINE',
  'offerDescription': 'test',
  'offerType': 'SELL',
  'paymentMethod': ['CASH'],
}

export default function getDummyOffer() {
  return pipe(dummyOffer, E.right, E.chainW(stringifyToPrettyJson))
}
