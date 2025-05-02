import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {XStack} from 'tamagui'
import {andThenExpectBooleanNoErrors} from '../../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import IconButton from '../../IconButton'
import ScreenTitle from '../../ScreenTitle'
import {reportOfferActionAtom} from '../atoms'
import flagSvg from '../images/flagSvg'

interface Props {
  offer: OneOfferInState
}

function Title({offer}: Props): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const reportOffer = useSetAtom(reportOfferActionAtom)

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
      <XStack ai="center" gap="$2">
        {!offer.flags.reported && (
          <IconButton
            variant="dark"
            icon={flagSvg}
            onPress={() => {
              void Effect.runPromise(
                andThenExpectBooleanNoErrors((success) => {
                  if (success) goBack()
                })(reportOffer(offer))
              )
            }}
          />
        )}
      </XStack>
    </ScreenTitle>
  )
}

export default Title
