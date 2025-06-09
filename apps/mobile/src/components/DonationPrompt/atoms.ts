import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, Schema} from 'effect'
import {atom} from 'jotai'
import {DateTime} from 'luxon'
import {apiAtom} from '../../api'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {lastDisplayOfDonationPromptTimestampAtom} from '../../utils/preferences'
import {askAreYouSureActionAtom} from '../AreYouSureDialog'
import DonationAmount from './components/DonationAmount'
import DonationPrompt from './components/DonationPrompt'
import DonationQrCode from './components/DonationQrCode'

export const DONATION_PROMPT_DAYS_THRESHOLD_COUNT = 2
export const DONATION_PROMPT_CHAT_MESSAGES_THRESHOLD_COUNT = 10

export const donationAmountAtom = atom<string | undefined>(undefined)

export const showDonationPromptActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  const api = get(apiAtom).content
  const lastDisplayOfDonationPromptTimestamp = get(
    lastDisplayOfDonationPromptTimestampAtom
  )

  if (
    lastDisplayOfDonationPromptTimestamp &&
    DateTime.now().diff(
      DateTime.fromMillis(lastDisplayOfDonationPromptTimestamp),
      'days'
    ).days < DONATION_PROMPT_DAYS_THRESHOLD_COUNT
  )
    return Effect.succeed(Effect.void)

  return Effect.gen(function* (_) {
    yield* _(
      set(askAreYouSureActionAtom, {
        variant: 'info',
        steps: [
          {
            type: 'StepWithChildren',
            MainSectionComponent: DonationPrompt,
            positiveButtonText: t('donationPrompt.donate'),
            negativeButtonText: t('common.back'),
          },
          {
            type: 'StepWithChildren',
            MainSectionComponent: DonationAmount,
            positiveButtonText: t('common.confirm'),
            negativeButtonText: t(`common.cancel`),
          },
        ],
      })
    )

    const donationAmount = get(donationAmountAtom)
    const resp = yield* _(
      api.createInvoice({
        amount: donationAmount ? Number(donationAmount) : 0,
        currency: 'EUR',
      })
    )

    yield* _(
      set(askAreYouSureActionAtom, {
        variant: 'info',
        steps: [
          {
            type: 'StepWithChildren',
            MainSectionComponent: () =>
              DonationQrCode({
                invoiceId: resp.invoiceId,
                storeId: resp.storeId,
                btcAmount: Schema.decodeSync(Schema.NumberFromString)(
                  resp.btcAmount
                ),
                fiatAmount: Schema.decodeSync(Schema.NumberFromString)(
                  resp.fiatAmount
                ),
                currency: resp.currency,
                paymentLink: resp.paymentLink,
                exchangeRate: Schema.decodeSync(Schema.NumberFromString)(
                  resp.exchangeRate
                ),
              }),
            positiveButtonText: t('common.close'),
          },
        ],
      })
    )

    set(
      lastDisplayOfDonationPromptTimestampAtom,
      Schema.decodeSync(UnixMillisecondsE)(DateTime.now().toMillis())
    )
  })
})
