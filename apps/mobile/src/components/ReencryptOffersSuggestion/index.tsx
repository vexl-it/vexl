import {useAtomValue, useSetAtom} from 'jotai'
import MarketplaceSuggestion from '../InsideRouter/components/MarketplaceScreen/components/MarketplaceSuggestion'
import {areThereMissingOffersOnServerAtom} from '../../state/marketplace/atoms/offersMissingOnServer'
import {type YStackProps} from 'tamagui'
import {reencryptOffersWithModalActionAtom} from './atoms'
import {useTranslation} from '../../utils/localization/I18nProvider'

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
        void reencryptMissingOffers()()
      }}
      type="warning"
      text={t('reuploadOffers.suggestionCell.title')}
      {...props}
    />
  )
}
