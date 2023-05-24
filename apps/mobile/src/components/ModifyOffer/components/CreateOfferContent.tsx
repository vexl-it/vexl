import OfferInProgress from './OfferInProgress'
import React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import ScreenTitle from '../../ScreenTitle'
import IconButton from '../../IconButton'
import closeSvg from '../../images/closeSvg'
import {Stack} from 'tamagui'
import Button from '../../Button'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useContent from '../useContent'
import {useMolecule} from 'jotai-molecules'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import {useAtomValue, useSetAtom} from 'jotai'
import {pipe} from 'fp-ts/function'
import * as T from 'fp-ts/Task'
import OfferForm from '../../OfferForm'

const styles = StyleSheet.create({
  contentStyles: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
})

interface Props {
  navigateBack: () => void
}

function CreateOfferContent({navigateBack}: Props): JSX.Element {
  const {t} = useTranslation()
  const content = useContent()

  const {createOfferActionAtom, encryptingOfferAtom, loadingAtom} =
    useMolecule(offerFormMolecule)
  const loading = useAtomValue(loadingAtom)
  const encryptingOffer = useAtomValue(encryptingOfferAtom)
  const createOffer = useSetAtom(createOfferActionAtom)

  return (
    <>
      <ScrollView contentContainerStyle={styles.contentStyles}>
        <ScreenTitle text={t('offerForm.myNewOffer')} withBottomBorder>
          <IconButton variant="dark" icon={closeSvg} onPress={navigateBack} />
        </ScreenTitle>
        <OfferForm content={content} />
      </ScrollView>
      <Stack px="$4" py="$4" bc="transparent">
        <Button
          text={t('offerForm.publishOffer')}
          onPress={() => {
            void pipe(
              createOffer(),
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
      {encryptingOffer && (
        <OfferInProgress
          title={
            loading
              ? t('offerForm.offerEncryption.encryptingYourOffer')
              : t('offerForm.offerEncryption.doneOfferPoster')
          }
          subtitle={
            loading
              ? t('offerForm.offerEncryption.dontShutDownTheApp')
              : t('offerForm.offerEncryption.yourFriendsAndFriendsOfFriends')
          }
          loading={loading}
          visible={encryptingOffer}
        />
      )}
    </>
  )
}

export default CreateOfferContent
