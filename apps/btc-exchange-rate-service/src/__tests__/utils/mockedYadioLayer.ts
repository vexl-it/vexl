import {jest} from '@jest/globals'
import {UnixMilliseconds0} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {GetExchangeRateResponse} from '@vexl-next/rest-api/src/services/btcExchangeRate/contracts'
import {Effect, Layer, Option} from 'effect'
import {YadioService, type YadioOperations} from '../../utils/yadio'

export const getExhangeRatePriceMocked = jest.fn<
  YadioOperations['getExchangeRatePrice']
>(() =>
  Effect.succeed(
    new GetExchangeRateResponse({
      BTC: 20,
      lastUpdatedAt: Option.some(UnixMilliseconds0),
    })
  )
)

export const mockedYadioLayer = Layer.effect(
  YadioService,
  Effect.succeed({getExchangeRatePrice: getExhangeRatePriceMocked})
)
