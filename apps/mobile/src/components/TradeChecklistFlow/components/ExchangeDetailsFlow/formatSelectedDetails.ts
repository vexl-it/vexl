import {Array, pipe} from 'effect/index'
import {
  selectedKeys,
  type ExchangeDetailKey,
  type ExchangeDetailsSelection,
} from '../../../../state/tradeChecklist/utils/exchangeDetails'
import {type TFunction} from '../../../../utils/localization/I18nProvider'

const LABEL_KEY = {
  nickname: 'tradeChecklist.exchangeDetails.nickname',
  phoneNumber: 'tradeChecklist.exchangeDetails.phoneNumber',
  photo: 'tradeChecklist.exchangeDetails.photo',
} as const satisfies Record<ExchangeDetailKey, string>

export function formatSelectedDetails(
  t: TFunction,
  selection: ExchangeDetailsSelection
): string {
  return pipe(
    selectedKeys(selection),
    Array.map((key) => t(LABEL_KEY[key])),
    Array.join(', ')
  )
}
