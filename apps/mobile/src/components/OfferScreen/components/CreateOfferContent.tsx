import OfferInProgress from './OfferInProgress'
import React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import ScreenTitle from '../../ScreenTitle'
import IconButton from '../../IconButton'
import closeSvg from '../../images/closeSvg'
import OfferContent from './OfferContent'
import {Stack} from 'tamagui'
import Button from '../../Button'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useContent from '../useContent'
import {useMolecule} from 'jotai-molecules'
import {offerFormStateMolecule} from '../atoms/offerFormStateAtoms'
import {useAtomValue, useSetAtom} from 'jotai'
import {pipe} from 'fp-ts/function'
import * as T from 'fp-ts/Task'

const styles = StyleSheet.create({
  contentStyles: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
})

interface Props {
  navigateBack: () => void
  navigateToMarketplace: () => void
}

function CreateOfferContent({
  navigateBack,
  navigateToMarketplace,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const content = useContent()

  const {createOfferActionAtom, encryptingOfferAtom, loadingAtom} = useMolecule(
    offerFormStateMolecule
  )
  const loading = useAtomValue(loadingAtom)
  const encryptingOffer = useAtomValue(encryptingOfferAtom)
  const createOffer = useSetAtom(createOfferActionAtom)

  return (
    <>
      <ScrollView contentContainerStyle={styles.contentStyles}>
        <ScreenTitle
          px="$4"
          text={t('createOffer.myNewOffer')}
          withBottomBorder
        >
          <IconButton variant="dark" icon={closeSvg} onPress={navigateBack} />
        </ScreenTitle>
        <OfferContent content={content} />
      </ScrollView>
      <Stack px="$4" py="$4" bc="transparent">
        <Button
          text={t('createOffer.publishOffer')}
          onPress={() => {
            void pipe(
              createOffer(),
              T.map((success) => {
                if (success) {
                  navigateToMarketplace()
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
              ? t('createOffer.offerEncryption.encryptingYourOffer')
              : t('createOffer.offerEncryption.doneOfferPoster')
          }
          subtitle={
            loading
              ? t('createOffer.offerEncryption.dontShutDownTheApp')
              : t('createOffer.offerEncryption.yourFriendsAndFriendsOfFriends')
          }
          loading={loading}
          visible={encryptingOffer}
        />
      )}
    </>
  )
}

export default CreateOfferContent
