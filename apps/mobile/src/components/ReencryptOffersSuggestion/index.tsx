import {InfoBox} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {areThereMissingOffersOnServerAtom} from '../../state/marketplace/atoms/offersMissingOnServer'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {reencryptOffersWithModalActionAtom} from './atoms'

export default function ReencryptOffersSuggestion(): React.ReactElement | null {
  const {t} = useTranslation()
  const areThereMissingOffersOnServer = useAtomValue(
    areThereMissingOffersOnServerAtom
  )
  const reencryptMissingOffers = useSetAtom(reencryptOffersWithModalActionAtom)

  if (!areThereMissingOffersOnServer) return null

  return (
    <InfoBox
      variant="error"
      action={{
        label: t('reuploadOffers.suggestionCell.button'),
        onPress: () => {
          Effect.runFork(reencryptMissingOffers())
        },
      }}
    >
      {t('reuploadOffers.suggestionCell.title')}
    </InfoBox>
  )
}
