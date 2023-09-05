import ScreenTitle from '../../ScreenTitle'
import {Stack, Text, XStack} from 'tamagui'
import IconButton from '../../IconButton'
import trashSvg from '../images/trashSvg'
import playSvg from '../images/playSvg'
import closeSvg from '../../images/closeSvg'
import React, {useCallback} from 'react'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {useAtomValue, useSetAtom} from 'jotai'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import {useShowLoadingOverlay} from '../../LoadingOverlayProvider'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useMolecule} from 'jotai-molecules'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {type OneOfferInState} from '@vexl-next/domain/dist/general/offers'
import pauseSvg from '../../../images/pauseSvg'

interface Props {
  offer: OneOfferInState | undefined
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
    <ScreenTitle text={t('editOffer.editOffer')}>
      <Stack>
        <XStack space={'$2'} mb={'$4'}>
          {offer && (
            <XStack space={'$2'}>
              <IconButton
                variant="dark"
                icon={trashSvg}
                onPress={() => {
                  void deleteOfferWithAreYouSure()
                }}
              />
              <IconButton
                variant="dark"
                icon={offerActive ? pauseSvg : playSvg}
                onPress={() => {
                  void toggleOfferActivePress()()
                }}
              />
            </XStack>
          )}
          <IconButton variant="dark" icon={closeSvg} onPress={safeGoBack} />
        </XStack>
        {offer && (
          <XStack space={'$2'} ai={'center'} jc={'flex-end'}>
            <Stack h={12} w={12} br={12} bc={offerActive ? '$green' : '$red'} />
            <Text
              col={offerActive ? '$green' : '$red'}
              fos={18}
              ff={'$body500'}
            >
              {offerActive ? t('editOffer.active') : t('editOffer.inactive')}
            </Text>
          </XStack>
        )}
      </Stack>
    </ScreenTitle>
  )
}

export default EditOfferHeader
