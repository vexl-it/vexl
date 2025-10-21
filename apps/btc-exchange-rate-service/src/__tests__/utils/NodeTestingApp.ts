import {BtcExchangeRateApiSpecification} from '@vexl-next/rest-api/src/services/btcExchangeRate/specification'
import {createNodeTestingApp} from '@vexl-next/server-utils/src/tests/nodeTestingApp'

export const NodeTestingApp = createNodeTestingApp(
  BtcExchangeRateApiSpecification
)
