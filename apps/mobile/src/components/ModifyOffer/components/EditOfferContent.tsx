import {Stack, Text, XStack} from 'tamagui'
import Button from '../../Button'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useContent from '../useContent'
import {ActivityIndicator, Modal, ScrollView, StyleSheet} from 'react-native'
import ScreenTitle from '../../ScreenTitle'
import IconButton from '../../IconButton'
import pauseSvg from '../images/pauseSvg'
import playSvg from '../images/playSvg'
import closeSvg from '../../images/closeSvg'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import OfferInProgress from './OfferInProgress'
import {useMolecule} from 'jotai-molecules'
import {pipe} from 'fp-ts/function'
import * as T from 'fp-ts/Task'
import OfferForm from '../../OfferForm'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import trashSvg from '../images/trashSvg'

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
    deletingOfferAtom,
  } = useMolecule(offerFormMolecule)
  const offerActive = useAtomValue(offerActiveAtom)
  const loading = useAtomValue(loadingAtom)
  const editingOffer = useAtomValue(editingOfferAtom)
  const toggleOfferActivePress = useSetAtom(toggleOfferActiveAtom)
  const editOffer = useSetAtom(editOfferAtom)
  const deleteOffer = useSetAtom(deleteOfferActionAtom)
  const [deletingOffer, setDeletingOffer] = useAtom(deletingOfferAtom)

  const content = useContent()

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
                  setDeletingOffer(true)
                  void pipe(
                    deleteOffer(),
                    T.map((success) => {
                      if (success) {
                        navigateBack()
                      }
                      setDeletingOffer(false)
                    })
                  )()
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
      {deletingOffer && (
        <Modal animationType="fade" transparent visible={deletingOffer}>
          <Stack f={1} ai={'center'} jc={'center'} bc={'$black'} gap={'$4'}>
            <ActivityIndicator size={'large'} />
            <Text ff={'$body600'} fos={18} col={'$white'}>
              {t('editOffer.deletingYourOffer')}
            </Text>
          </Stack>
        </Modal>
      )}
    </>
  )
}

export default EditOfferContent
