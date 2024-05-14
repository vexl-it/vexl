import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {useMolecule} from 'bunshi/dist/react'
import {pipe} from 'fp-ts/function'
import {isSome, type Option} from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import pauseSvg from '../../../images/pauseSvg'
import {isOfferExpired} from '../../../utils/isOfferExpired'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import IconButton from '../../IconButton'
import Image from '../../Image'
import clockSvg from '../../images/clockSvg'
import closeSvg from '../../images/closeSvg'
import {useShowLoadingOverlay} from '../../LoadingOverlayProvider'
import ScreenTitle from '../../ScreenTitle'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import playSvg from '../images/playSvg'

interface Props {
  offer: Option<OneOfferInState>
}

function EditOfferHeader({offer}: Props): JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()

  const {toggleOfferActiveAtom, offerActiveAtom, deleteOfferActionAtom} =
    useMolecule(offerFormMolecule)
  const deleteOffer = useSetAtom(deleteOfferActionAtom)
  const showAreYouSure = useSetAtom(askAreYouSureActionAtom)
  const loadingOverlay = useShowLoadingOverlay()
  const offerActive = useAtomValue(offerActiveAtom)
  const toggleOfferActivePress = useSetAtom(toggleOfferActiveAtom)

  const deleteOfferWithAreYouSure = useCallback(async () => {
    await pipe(
      showAreYouSure({
        variant: 'danger',
        steps: [
          {
            type: 'StepWithText',
            title: t('editOffer.deleteOffer'),
            description: t('editOffer.deleteOfferDescription'),
            positiveButtonText: t('common.yesDelete'),
            negativeButtonText: t('common.nope'),
          },
        ],
      }),
      TE.chainTaskK(() => {
        loadingOverlay.show()
        return deleteOffer()
      }),
      TE.map((success) => {
        loadingOverlay.hide()
        if (success) safeGoBack()
      })
    )()
  }, [deleteOffer, loadingOverlay, safeGoBack, showAreYouSure, t])

  return (
    <Stack f={1} space="$4">
      <ScreenTitle text={t('editOffer.editOffer')}>
        <XStack space="$2" mb="$4">
          {isSome(offer) && (
            <XStack ai="center" space="$2">
              {isOfferExpired(
                offer.value.offerInfo?.publicPart?.expirationDate
              ) && (
                <Image source={clockSvg} stroke={getTokens().color.red.val} />
              )}
              <IconButton
                variant="dark"
                icon={require('../images/trashIcon.png')}
                onPress={() => {
                  void deleteOfferWithAreYouSure()
                }}
              />
              <IconButton
                iconWidth={25}
                iconHeight={25}
                variant="dark"
                icon={offerActive ? pauseSvg : playSvg}
                onPress={() => {
                  void toggleOfferActivePress()().then((success) => {
                    if (success) safeGoBack()
                  })
                }}
              />
            </XStack>
          )}
          <IconButton
            iconWidth={25}
            iconHeight={25}
            variant="dark"
            icon={closeSvg}
            onPress={safeGoBack}
          />
        </XStack>
      </ScreenTitle>
      {!!offer && (
        <XStack space="$2" ai="center" jc="flex-end" als="flex-start">
          <Stack h={12} w={12} br={12} bc={offerActive ? '$green' : '$red'} />
          <Text col={offerActive ? '$green' : '$red'} fos={18} ff="$body500">
            {offerActive ? t('editOffer.active') : t('editOffer.inactive')}
          </Text>
        </XStack>
      )}
    </Stack>
  )
}

export default EditOfferHeader
