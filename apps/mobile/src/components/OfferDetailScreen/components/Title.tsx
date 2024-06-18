import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import React from 'react'
import {XStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import IconButton from '../../IconButton'
import ScreenTitle from '../../ScreenTitle'
import {useReportOfferHandleUI} from '../api'
import flagSvg from '../images/flagSvg'

interface Props {
  offer: OneOfferInState
}

function Title({offer}: Props): JSX.Element {
  const {t} = useTranslation()
  const reportOffer = useReportOfferHandleUI()

  return (
    <ScreenTitle
      text={t('offer.title')}
      bc="$black"
      py="$2"
      px={
        !offer.offerInfo.publicPart.locationState.includes('IN_PERSON')
          ? '$0'
          : '$2'
      }
      withBackButton
    >
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
      </XStack>
    </ScreenTitle>
  )
}

export default Title
