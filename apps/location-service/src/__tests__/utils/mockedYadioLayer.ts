import {jest} from '@jest/globals'
import {GetExchangeRateResponse} from '@vexl-next/rest-api/src/services/location/contracts'
import {Effect, Layer} from 'effect'
import {type YadioOperations, YadioService} from '../../utils/yadio'

export const getExhangeRatePriceMocked = jest.fn<
  YadioOperations['getExchangeRatePrice']
>(() => Effect.succeed(new GetExchangeRateResponse({BTC: 20})))

export const mockedYadioLayer = Layer.effect(
  YadioService,
  Effect.succeed({getExchangeRatePrice: getExhangeRatePriceMocked})
)
