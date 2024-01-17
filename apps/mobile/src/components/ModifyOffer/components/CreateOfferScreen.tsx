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
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useContent from '../useContent'
import {useMolecule} from 'bunshi/dist/react'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import {useAtomValue, useSetAtom} from 'jotai'
import {useFocusEffect} from '@react-navigation/native'
import userSvg from '../../images/userSvg'
import Section from '../../Section'
import OfferType from '../../OfferForm/components/OfferType'

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

  const {
    createOfferActionAtom,
    resetOfferFormActionAtom,
    offerTypeAtom,
    showAllFieldsAtom,
  } = useMolecule(offerFormMolecule)
  const showAllFields = useAtomValue(showAllFieldsAtom)
  const createOffer = useSetAtom(createOfferActionAtom)
  const resetForm = useSetAtom(resetOfferFormActionAtom)

  useFocusEffect(
    useCallback(() => {
      resetForm()
    }, [resetForm])
  )

  return (
    <Screen>
      <KeyboardAvoidingView>
        <>
          <ScrollView contentContainerStyle={styles.contentStyles}>
            <ScreenTitle text={t('offerForm.myNewOffer')} withBottomBorder>
              <IconButton variant="dark" icon={closeSvg} onPress={safeGoBack} />
            </ScreenTitle>
            <Section title={t('offerForm.iWantTo')} image={userSvg}>
              <OfferType offerTypeAtom={offerTypeAtom} />
            </Section>
            {showAllFields && <OfferForm content={content} />}
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
        </>
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default CreateOfferScreen
