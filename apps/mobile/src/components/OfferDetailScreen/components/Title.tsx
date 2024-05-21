import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import React from 'react'
import {XStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import IconButton from '../../IconButton'
import ScreenTitle from '../../ScreenTitle'
import closeSvg from '../../images/closeSvg'
import {useReportOfferHandleUI} from '../api'
import flagSvg from '../images/flagSvg'

interface Props {
  offer: OneOfferInState
}

function Title({offer}: Props): JSX.Element {
  const safeGoBack = useSafeGoBack()
  const {t} = useTranslation()
  const reportOffer = useReportOfferHandleUI()

  return (
    <ScreenTitle text={t('offer.title')} bc="$black" pt="$2">
      <XStack ai="center" space="$2">
        {!offer.flags.reported && (
          <IconButton
            variant="dark"
            icon={flagSvg}
            onPress={() => {
              void reportOffer(offer.offerInfo.offerId)()
            }}
          />
        )}
        <IconButton variant="dark" icon={closeSvg} onPress={safeGoBack} />
      </XStack>
    </ScreenTitle>
  )
}

export default Title
