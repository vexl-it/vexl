import {
  Button,
  EditRow,
  NavigationBar,
  Screen,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React, {useCallback} from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {getTokens, ScrollView, YStack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {clubsWithMembersAtomsAtom} from '../../state/clubs/atom/clubsWithMembersAtom'
import atomKeyExtractor from '../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {offerFormMolecule} from '../CRUDOfferFlow/atoms/offerFormStateAtoms'
import AmountStep from '../CRUDOfferFlow/components/AmountStep'
import ClubItem from '../CRUDOfferFlow/components/ClubItem'
import DescribeStep from '../CRUDOfferFlow/components/DescribeStep'
import LanguageStep from '../CRUDOfferFlow/components/LanguageStep'
import LocationStep from '../CRUDOfferFlow/components/LocationStep'
import NetworkStep from '../CRUDOfferFlow/components/NetworkStep'
import PriceUpToStep from '../CRUDOfferFlow/components/PriceUpToStep'
import ProductCategoryStep from '../CRUDOfferFlow/components/ProductCategoryStep'
import FriendLevel from '../OfferForm/components/FriendLevel'

type Props = RootStackScreenProps<'EditOfferField'>

const fieldToTitleKey = {
  amount: 'editOffer.editAmount',
  location: 'editOffer.editLocation',
  network: 'editOffer.editPaymentDetails',
  describe: 'editOffer.editOfferDescription',
  language: 'editOffer.editOfferLanguage',
  productCategory: 'editOffer.editProductCategory',
  friendLevel: 'editOffer.editFriendLevel',
  clubs: 'editOffer.editClubs',
} as const

function EditOfferFieldScreen({
  route: {
    params: {field},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const insets = useSafeAreaInsets()

  const {listingTypeAtom, intendedConnectionLevelAtom, createSelectClubAtom} =
    useMolecule(offerFormMolecule)
  const listingType = useAtomValue(listingTypeAtom)
  const clubsWithMembersAtoms = useAtomValue(clubsWithMembersAtomsAtom)

  const handleComplete = useCallback((): void => {
    safeGoBack()
  }, [safeGoBack])

  const saveLabel = t('common.save')
  const noop = useCallback(() => {}, [])

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t(fieldToTitleKey[field])}
          rightActions={[{icon: XmarkCancelClose, onPress: safeGoBack}]}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: insets.bottom + getTokens().space.$5.val,
        }}
      >
        <YStack>
          {field === 'amount' ? (
            listingType === 'BITCOIN' ? (
              <AmountStep
                active
                onEdit={noop}
                onComplete={handleComplete}
                ctaLabel={saveLabel}
              />
            ) : (
              <PriceUpToStep
                active
                onEdit={noop}
                onComplete={handleComplete}
                ctaLabel={saveLabel}
              />
            )
          ) : null}
          {field === 'location' ? (
            <LocationStep
              active
              onEdit={noop}
              onComplete={handleComplete}
              ctaLabel={saveLabel}
            />
          ) : null}
          {field === 'network' ? (
            <NetworkStep
              active
              onEdit={noop}
              onComplete={handleComplete}
              ctaLabel={saveLabel}
            />
          ) : null}
          {field === 'describe' ? (
            <DescribeStep
              active
              onEdit={noop}
              onComplete={handleComplete}
              ctaLabel={saveLabel}
            />
          ) : null}
          {field === 'language' ? (
            <LanguageStep
              active
              onEdit={noop}
              onComplete={handleComplete}
              ctaLabel={saveLabel}
            />
          ) : null}
          {field === 'productCategory' ? (
            <ProductCategoryStep
              active
              onEdit={noop}
              onComplete={handleComplete}
              ctaLabel={saveLabel}
            />
          ) : null}
          {field === 'friendLevel' ? (
            <YStack>
              <EditRow
                state="initial"
                headline={t('offerForm.whoCanSeeYourOffer')}
              />
              <YStack gap="$5" paddingVertical="$5">
                <FriendLevel
                  intendedConnectionLevelAtom={intendedConnectionLevelAtom}
                />
                <Button variant="primary" size="large" onPress={handleComplete}>
                  {t('common.save')}
                </Button>
              </YStack>
            </YStack>
          ) : null}
          {field === 'clubs' ? (
            <YStack>
              <EditRow
                state="initial"
                headline={t('offerForm.publishToVexlClub')}
              />
              <YStack gap="$5" paddingVertical="$5">
                <YStack gap="$3">
                  {clubsWithMembersAtoms.map((clubWithMembersAtom) => (
                    <ClubItem
                      key={atomKeyExtractor(clubWithMembersAtom)}
                      clubWithMembersAtom={clubWithMembersAtom}
                      createSelectClubAtom={createSelectClubAtom}
                    />
                  ))}
                </YStack>
                <Button variant="primary" size="large" onPress={handleComplete}>
                  {t('common.save')}
                </Button>
              </YStack>
            </YStack>
          ) : null}
        </YStack>
      </ScrollView>
    </Screen>
  )
}

export default EditOfferFieldScreen
