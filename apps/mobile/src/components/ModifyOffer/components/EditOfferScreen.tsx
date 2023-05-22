import {type RootStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Screen from '../../Screen'
import KeyboardAvoidingView from '../../KeyboardAvoidingView'
import ScreenTitle from '../../ScreenTitle'
import EditOfferContent from './EditOfferContent'
import IconButton from '../../IconButton'
import closeSvg from '../../images/closeSvg'
import React, {useMemo} from 'react'
import {singleOfferAtom} from '../../../state/marketplace/atom'
import {useAtomValue} from 'jotai'
import {Text} from 'tamagui'
import ModifyOfferScopeProvider from './ModifyOfferScopeProvider'

type Props = RootStackScreenProps<'EditOffer'>

function EditOfferScreen({
  route: {
    params: {offerId},
  },
  navigation,
}: Props): JSX.Element {
  const {t} = useTranslation()

  const offer = useAtomValue(useMemo(() => singleOfferAtom(offerId), [offerId]))

  return (
    <Screen customHorizontalPadding={0} customVerticalPadding={32}>
      <KeyboardAvoidingView>
        {offer ? (
          <ModifyOfferScopeProvider
            modifyOfferScopeValue={offer}
            offerFormScopeValue={offer.offerInfo.publicPart}
          >
            <EditOfferContent
              navigateBack={() => {
                navigation.goBack()
              }}
            />
          </ModifyOfferScopeProvider>
        ) : (
          <>
            <ScreenTitle text={t('editOffer.editOffer')}>
              <IconButton
                variant="dark"
                icon={closeSvg}
                onPress={() => {
                  navigation.navigate('MyOffers')
                }}
              />
            </ScreenTitle>
            <Text>{t('editOffer.errorOfferNotFound')}</Text>
          </>
        )}
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default EditOfferScreen
