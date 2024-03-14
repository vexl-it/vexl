import {useFocusEffect} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {isSome} from 'fp-ts/Option'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/function'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {Stack, Text} from 'tamagui'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {useSingleOffer} from '../../../state/marketplace'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import Button from '../../Button'
import KeyboardAvoidingView from '../../KeyboardAvoidingView'
import OfferForm from '../../OfferForm'
import ListingType from '../../OfferForm/components/ListingType'
import OfferType from '../../OfferForm/components/OfferType'
import Screen from '../../Screen'
import Section from '../../Section'
import listingTypeSvg from '../../images/listingTypeSvg'
import userSvg from '../../images/userSvg'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import useBtcOfferContent from '../useBtcOfferContent'
import useOtherOfferContent from '../useOtherOfferContent'
import useProductOfferContent from '../useProductOfferContent'
import EditOfferHeader from './EditOfferHeader'

const styles = StyleSheet.create({
  contentStyles: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
})

type Props = RootStackScreenProps<'EditOffer'>

function EditOfferScreen({
  route: {
    params: {offerId},
  },
}: Props): JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const btcOfferContent = useBtcOfferContent()
  const productOfferContent = useProductOfferContent()
  const otherOfferContent = useOtherOfferContent()

  const {
    editOfferAtom,
    listingTypeAtom,
    offerTypeAtom,
    setOfferFormActionAtom,
  } = useMolecule(offerFormMolecule)
  const listingType = useAtomValue(listingTypeAtom)
  const editOffer = useSetAtom(editOfferAtom)
  const offer = useSingleOffer(offerId)
  const setOfferForm = useSetAtom(setOfferFormActionAtom)

  useFocusEffect(
    useCallback(() => {
      setOfferForm(offerId)
    }, [offerId, setOfferForm])
  )

  return (
    <Screen customHorizontalPadding={0} customVerticalPadding={32}>
      <KeyboardAvoidingView>
        <>
          <ScrollView contentContainerStyle={styles.contentStyles}>
            <EditOfferHeader offer={offer} />
            {isSome(offer) ? (
              <>
                <Section
                  title={t('offerForm.listingType')}
                  image={listingTypeSvg}
                >
                  <ListingType listingTypeAtom={listingTypeAtom} />
                </Section>
                {listingType !== 'OTHER' && (
                  <Section title={t('offerForm.iWantTo')} image={userSvg}>
                    <OfferType offerTypeAtom={offerTypeAtom} />
                  </Section>
                )}
                <OfferForm
                  content={
                    listingType === 'BITCOIN'
                      ? btcOfferContent
                      : listingType === 'PRODUCT'
                      ? productOfferContent
                      : otherOfferContent
                  }
                />
              </>
            ) : (
              <Stack f={1} ai="center">
                <Text ff="$heading" fos={16} col="$white">
                  {t('editOffer.errorOfferNotFound')}
                </Text>
              </Stack>
            )}
          </ScrollView>
          {isSome(offer) && (
            <Stack px="$4" py="$4" bc="transparent">
              <Button
                text={t('editOffer.saveChanges')}
                onPress={() => {
                  void pipe(
                    editOffer(),
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
          )}
        </>
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default EditOfferScreen
