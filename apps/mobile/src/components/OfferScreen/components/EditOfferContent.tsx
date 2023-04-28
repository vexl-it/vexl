import OfferContent from './OfferContent'
import {Stack, Text, XStack} from 'tamagui'
import Button from '../../Button'
import React from 'react'
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
import {offerFormStateMolecule} from '../atoms/offerFormStateAtoms'
import {pipe} from 'fp-ts/function'
import * as T from 'fp-ts/Task'

const styles = StyleSheet.create({
  contentStyles: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
})

interface Props {
  navigateToMyOffers: () => void
}

function EditOfferContent({navigateToMyOffers}: Props): JSX.Element {
  const {t} = useTranslation()
  const {
    offerActiveAtom,
    loadingAtom,
    editingOfferAtom,
    toggleOfferActiveAtom,
    editOfferAtom,
  } = useMolecule(offerFormStateMolecule)
  const offerActive = useAtomValue(offerActiveAtom)
  const loading = useAtomValue(loadingAtom)
  const editingOffer = useAtomValue(editingOfferAtom)
  const toggleOfferActivePress = useSetAtom(toggleOfferActiveAtom)
  const editOffer = useSetAtom(editOfferAtom)

  const content = useContent()

  return (
    <>
      <ScrollView contentContainerStyle={styles.contentStyles}>
        <ScreenTitle text={t('editOffer.editOffer')}>
          <Stack>
            <XStack space={'$2'} mb={'$4'}>
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
                  navigateToMyOffers()
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
        <OfferContent content={content} />
      </ScrollView>
      <Stack px="$4" py="$4" bc="transparent">
        <Button
          text={t('editOffer.saveChanges')}
          onPress={() => {
            void pipe(
              editOffer(),
              T.map((success) => {
                if (success) {
                  navigateToMyOffers()
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
