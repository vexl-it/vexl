import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {type YStackProps} from 'tamagui'
import {areThereMissingOffersOnServerAtom} from '../../state/marketplace/atoms/offersMissingOnServer'
import {useTranslation} from '../../utils/localization/I18nProvider'
import MarketplaceSuggestion from '../MarketplaceSuggestion'
import {reencryptOffersWithModalActionAtom} from './atoms'

export default function ReencryptOffersSuggestion(
  props: YStackProps
): JSX.Element | null {
  const {t} = useTranslation()
  const areThereMissingOffersOnServer = useAtomValue(
    areThereMissingOffersOnServerAtom
  )
  const reencryptMissingOffers = useSetAtom(reencryptOffersWithModalActionAtom)

  if (!areThereMissingOffersOnServer) return null

  return (
    <MarketplaceSuggestion
      buttonText={t('reuploadOffers.suggestionCell.button')}
      onButtonPress={() => {
        void Effect.runPromise(reencryptMissingOffers())
      }}
      type="warning"
      text={t('reuploadOffers.suggestionCell.title')}
      {...props}
    />
  )
}
