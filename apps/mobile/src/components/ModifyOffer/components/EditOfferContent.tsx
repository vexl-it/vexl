import {Stack, Text, XStack} from 'tamagui'
import Button from '../../Button'
import React, {useCallback} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useContent from '../useContent'
import {ScrollView, StyleSheet} from 'react-native'
import ScreenTitle from '../../ScreenTitle'
import IconButton from '../../IconButton'
import pauseSvg from '../images/pauseSvg'
import playSvg from '../images/playSvg'
import closeSvg from '../../images/closeSvg'
import {useAtomValue, useSetAtom} from 'jotai'
import OfferInProgress from './OfferInProgress'
import {useMolecule} from 'jotai-molecules'
import {pipe} from 'fp-ts/function'
import * as T from 'fp-ts/Task'
import OfferForm from '../../OfferForm'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import trashSvg from '../images/trashSvg'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import * as TE from 'fp-ts/TaskEither'
import {useShowLoadingOverlay} from '../../LoadingOverlayProvider'

const styles = StyleSheet.create({
  contentStyles: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
})

interface Props {
  navigateBack: () => void
}

function EditOfferContent({navigateBack}: Props): JSX.Element {
  const {t} = useTranslation()
  const {
    loadingAtom,
    editingOfferAtom,
    toggleOfferActiveAtom,
    editOfferAtom,
    offerActiveAtom,
    deleteOfferActionAtom,
  } = useMolecule(offerFormMolecule)
  const offerActive = useAtomValue(offerActiveAtom)
  const loading = useAtomValue(loadingAtom)
  const editingOffer = useAtomValue(editingOfferAtom)
  const toggleOfferActivePress = useSetAtom(toggleOfferActiveAtom)
  const editOffer = useSetAtom(editOfferAtom)
  const deleteOffer = useSetAtom(deleteOfferActionAtom)
  const showAreYouSure = useSetAtom(askAreYouSureActionAtom)
  const loadingOverlay = useShowLoadingOverlay()

  const content = useContent()

  const deleteOfferWithAreYouSure = useCallback(async () => {
    await pipe(
      showAreYouSure({
        variant: 'danger',
        steps: [
          {
            title: t('editOffer.deleteOffer'),
            description: t('editOffer.deleteOfferDescription'),
            positiveButtonText: t('common.yesDelete'),
            negativeButtonText: t('common.nope'),
          },
        ],
      }),
      TE.match(
        () => {},
        () => {
          loadingOverlay.show()
          void pipe(
            deleteOffer(),
            T.map((success) => {
              loadingOverlay.hide()
              if (success) {
                navigateBack()
              }
            })
          )()
        }
      )
    )()
  }, [deleteOffer, loadingOverlay, navigateBack, showAreYouSure, t])

  return (
    <>
      <ScrollView contentContainerStyle={styles.contentStyles}>
        <ScreenTitle text={t('editOffer.editOffer')}>
          <Stack>
            <XStack space={'$2'} mb={'$4'}>
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
              <IconButton
                variant="dark"
                icon={closeSvg}
                onPress={() => {
                  navigateBack()
                }}
              />
            </XStack>
            <XStack space={'$2'} ai={'center'} jc={'flex-end'}>
              <Stack
                h={12}
                w={12}
                br={12}
                bc={offerActive ? '$green' : '$red'}
              />
              <Text
                col={offerActive ? '$green' : '$red'}
                fos={18}
                ff={'$body500'}
              >
                {offerActive ? t('editOffer.active') : t('editOffer.inactive')}
              </Text>
            </XStack>
          </Stack>
        </ScreenTitle>
        <OfferForm content={content} />
      </ScrollView>
      <Stack px="$4" py="$4" bc="transparent">
        <Button
          text={t('editOffer.saveChanges')}
          onPress={() => {
            void pipe(
              editOffer(),
              T.map((success) => {
                if (success) {
                  navigateBack()
                }
              })
            )()
          }}
          variant="secondary"
        />
      </Stack>
      {editingOffer && (
        <OfferInProgress
          loading={loading}
          title={
            loading
              ? t('editOffer.editingYourOffer')
              : t('editOffer.offerEditSuccess')
          }
          subtitle={
            loading
              ? t('editOffer.pleaseWait')
              : t('editOffer.youCanCheckYourOffer')
          }
          visible={editingOffer}
        />
      )}
    </>
  )
}

export default EditOfferContent
