import {useFocusEffect} from '@react-navigation/native'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {isSome} from 'fp-ts/Option'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import pauseSvg from '../../images/pauseSvg'
import {useSingleOffer} from '../../state/marketplace'
import {isOfferExpired} from '../../utils/isOfferExpired'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import IconButton from '../IconButton'
import Image from '../Image'
import ScreenTitle from '../ScreenTitle'
import clockSvg from '../images/clockSvg'
import {offerFormMolecule} from './atoms/offerFormStateAtoms'
import playSvg from './images/playSvg'

interface Props {
  offerId: OfferId | undefined
}

function EditOfferHeader({offerId}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()

  const {
    toggleOfferActiveAtom,
    offerActiveAtom,
    deleteOfferWithAreYouSureActionAtom,
    setOfferFormActionAtom,
  } = useMolecule(offerFormMolecule)
  const deleteOffer = useSetAtom(deleteOfferWithAreYouSureActionAtom)
  const offerActive = useAtomValue(offerActiveAtom)
  const toggleOfferActivePress = useSetAtom(toggleOfferActiveAtom)
  const offer = useSingleOffer(offerId)
  const setOfferForm = useSetAtom(setOfferFormActionAtom)

  useFocusEffect(
    useCallback(() => {
      setOfferForm(offerId)
    }, [offerId, setOfferForm])
  )

  return (
    <Stack gap="$4">
      <ScreenTitle
        text={t('editOffer.editOffer')}
        withBackButton
        withBottomBorder
      >
        <Stack>
          <XStack gap="$2" mb="$4">
            {isSome(offer) && (
              <XStack ai="center" gap="$2">
                {isOfferExpired(
                  offer.value.offerInfo?.publicPart?.expirationDate
                ) && (
                  <Image source={clockSvg} stroke={getTokens().color.red.val} />
                )}
                <IconButton
                  testID="@editOfferHeader/deleteOfferButton"
                  variant="dark"
                  icon={require('./images/trashIcon.png')}
                  onPress={() => {
                    void Effect.runPromise(deleteOffer()).then((success) => {
                      if (success) safeGoBack()
                    })
                  }}
                />
                <IconButton
                  iconWidth={25}
                  iconHeight={25}
                  variant="dark"
                  icon={offerActive ? pauseSvg : playSvg}
                  onPress={() => {
                    void Effect.runPromise(toggleOfferActivePress()).then(
                      (success) => {
                        if (success) safeGoBack()
                      }
                    )
                  }}
                />
              </XStack>
            )}
          </XStack>
          {!!offer && (
            <XStack gap="$2" ai="center" jc="flex-end" als="flex-end">
              <Stack
                h={12}
                w={12}
                br={12}
                bc={offerActive ? '$green' : '$red'}
              />
              <Text
                col={offerActive ? '$green' : '$red'}
                fos={18}
                ff="$body500"
              >
                {offerActive ? t('editOffer.active') : t('editOffer.inactive')}
              </Text>
            </XStack>
          )}
        </Stack>
      </ScreenTitle>
    </Stack>
  )
}

export default EditOfferHeader
