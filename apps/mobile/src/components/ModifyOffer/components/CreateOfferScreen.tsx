import Screen from '../../Screen'
import React, {useCallback} from 'react'
import KeyboardAvoidingView from '../../KeyboardAvoidingView'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {ScrollView, StyleSheet} from 'react-native'
import ScreenTitle from '../../ScreenTitle'
import IconButton from '../../IconButton'
import closeSvg from '../../images/closeSvg'
import OfferForm from '../../OfferForm'
import {Stack} from 'tamagui'
import Button from '../../Button'
import {pipe} from 'fp-ts/function'
import * as T from 'fp-ts/Task'
import OfferInProgress from './OfferInProgress'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useContent from '../useContent'
import {useMolecule} from 'jotai-molecules'
import {dummyOffer, offerFormMolecule} from '../atoms/offerFormStateAtoms'
import {useSetAtom} from 'jotai'
import {useFocusEffect} from '@react-navigation/native'

const styles = StyleSheet.create({
  contentStyles: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
})

function CreateOfferScreen(): JSX.Element {
  const safeGoBack = useSafeGoBack()
  const {t} = useTranslation()
  const content = useContent()

  const {createOfferActionAtom, offerAtom} = useMolecule(offerFormMolecule)
  const createOffer = useSetAtom(createOfferActionAtom)
  const setOffer = useSetAtom(offerAtom)

  useFocusEffect(
    useCallback(() => {
      setOffer(dummyOffer)
    }, [setOffer])
  )

  return (
    <Screen>
      <KeyboardAvoidingView>
        <>
          <ScrollView contentContainerStyle={styles.contentStyles}>
            <ScreenTitle text={t('offerForm.myNewOffer')} withBottomBorder>
              <IconButton variant="dark" icon={closeSvg} onPress={safeGoBack} />
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
                      safeGoBack()
                    }
                  })
                )()
              }}
              variant="secondary"
            />
          </Stack>
          <OfferInProgress
            loadingTitle={t('offerForm.offerEncryption.encryptingYourOffer')}
            loadingDoneTitle={t('offerForm.offerEncryption.doneOfferPoster')}
            loadingSubtitle={t('offerForm.offerEncryption.dontShutDownTheApp')}
            loadingDoneSubtitle={t(
              'offerForm.offerEncryption.yourFriendsAndFriendsOfFriends'
            )}
          />
        </>
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default CreateOfferScreen
