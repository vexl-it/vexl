import {useFocusEffect} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/function'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {Stack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import Button from '../../Button'
import IconButton from '../../IconButton'
import KeyboardAvoidingView from '../../KeyboardAvoidingView'
import OfferForm from '../../OfferForm'
import ListingType from '../../OfferForm/components/ListingType'
import OfferType from '../../OfferForm/components/OfferType'
import Screen from '../../Screen'
import ScreenTitle from '../../ScreenTitle'
import Section from '../../Section'
import closeSvg from '../../images/closeSvg'
import listingTypeSvg from '../../images/listingTypeSvg'
import userSvg from '../../images/userSvg'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import useBtcOfferContent from '../useBtcOfferContent'
import useOtherOfferContent from '../useOtherOfferContent'
import useProductOfferContent from '../useProductOfferContent'

const styles = StyleSheet.create({
  contentStyles: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
})

function CreateOfferScreen(): JSX.Element {
  const safeGoBack = useSafeGoBack()
  const {t} = useTranslation()

  const {
    createOfferActionAtom,
    listingTypeAtom,
    resetOfferFormActionAtom,
    offerTypeAtom,
    showBuySellFieldAtom,
    showRestOfTheFieldsAtom,
    updateListingTypeActionAtom,
  } = useMolecule(offerFormMolecule)
  const btcOfferContent = useBtcOfferContent()
  const productOfferContent = useProductOfferContent()
  const otherOfferContent = useOtherOfferContent()
  const listingType = useAtomValue(listingTypeAtom)
  const showBuySellField = useAtomValue(showBuySellFieldAtom)
  const showRestOfTheFields = useAtomValue(showRestOfTheFieldsAtom)
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
        <ScrollView contentContainerStyle={styles.contentStyles}>
          <ScreenTitle text={t('offerForm.myNewOffer')} withBottomBorder>
            <IconButton variant="dark" icon={closeSvg} onPress={safeGoBack} />
          </ScreenTitle>
          <Section title={t('offerForm.listingType')} image={listingTypeSvg}>
            <ListingType
              listingTypeAtom={listingTypeAtom}
              updateListingTypeActionAtom={updateListingTypeActionAtom}
            />
          </Section>
          {!!showBuySellField && (
            <Section title={t('offerForm.iWantTo')} image={userSvg}>
              <OfferType
                listingTypeAtom={listingTypeAtom}
                offerTypeAtom={offerTypeAtom}
              />
            </Section>
          )}
          {!!showRestOfTheFields && (
            <OfferForm
              content={
                listingType === 'BITCOIN'
                  ? btcOfferContent
                  : listingType === 'PRODUCT'
                  ? productOfferContent
                  : otherOfferContent
              }
            />
          )}
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
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default CreateOfferScreen
