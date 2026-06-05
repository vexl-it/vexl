import {useFocusEffect} from '@react-navigation/native'
import {
  Button,
  EditRow,
  NavigationBar,
  Pause,
  Play,
  Screen,
  TextTag,
  TrashBin,
  Typography,
} from '@vexl-next/ui'
import {
  BoxProduct,
  ChatBubbles,
  ChevronLeft,
  ConferenceClub,
  ListWriteDocument,
  MoneyBankNotes,
  OfferHandCash,
  PeopleUsers,
  PinGeolocation,
} from '@vexl-next/ui/src/icons'
import {useMolecule} from 'bunshi/dist/react'
import {Effect, Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useLayoutEffect} from 'react'
import {BackHandler} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {getTokens, ScrollView, XStack, YStack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {
  clubsWithMembersAtom,
  useGetAllClubsNamesForIds,
} from '../../state/clubs/atom/clubsWithMembersAtom'
import {useSingleOffer} from '../../state/marketplace'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {formatInteger} from '../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../utils/localization/formattingLocaleAtom'
import useSafeGoBack from '../../utils/useSafeGoBack'
import numberOfFriendsAtom from '../CRUDOfferFlow/atoms/numberOfFriendsAtom'
import {offerFormMolecule} from '../CRUDOfferFlow/atoms/offerFormStateAtoms'
import AmountStep from '../CRUDOfferFlow/components/AmountStep'
import DescribeStep from '../CRUDOfferFlow/components/DescribeStep'
import LanguageStep from '../CRUDOfferFlow/components/LanguageStep'
import LocationStep from '../CRUDOfferFlow/components/LocationStep'
import NetworkStep from '../CRUDOfferFlow/components/NetworkStep'
import PriceUpToStep from '../CRUDOfferFlow/components/PriceUpToStep'
import ProductCategoryStep from '../CRUDOfferFlow/components/ProductCategoryStep'
import {type EditableOfferField} from '../CRUDOfferFlow/offerSetupSteps'

type Props = RootStackScreenProps<'MyOfferDetail'>

function MyOfferDetailScreen({
  route: {
    params: {offerId},
  },
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const safeGoBack = useSafeGoBack()
  const insets = useSafeAreaInsets()
  const offerOption = useSingleOffer(offerId)

  const {
    setOfferFormActionAtom,
    offerActiveAtom,
    pauseOrResumeOfferActionAtom,
    deleteOfferWithConfirmationActionAtom,
    hasUnsavedChangesAtom,
    editOfferActionAtom,
    showUnpublishedChangesDialogActionAtom,
    listingTypeAtom,
    offerTitleAtom,
    intendedConnectionLevelAtom,
    selectedClubsUuidsAtom,
  } = useMolecule(offerFormMolecule)
  const setOfferForm = useSetAtom(setOfferFormActionAtom)
  const offerActive = useAtomValue(offerActiveAtom)
  const pauseOrResumeOffer = useSetAtom(pauseOrResumeOfferActionAtom)
  const deleteOfferWithConfirmation = useSetAtom(
    deleteOfferWithConfirmationActionAtom
  )
  const hasUnsavedChanges = useAtomValue(hasUnsavedChangesAtom)
  const publishChanges = useSetAtom(editOfferActionAtom)
  const showUnpublishedChangesDialog = useSetAtom(
    showUnpublishedChangesDialogActionAtom
  )
  const listingType = useAtomValue(listingTypeAtom)
  const offerTitle = useAtomValue(offerTitleAtom)
  const intendedConnectionLevel = useAtomValue(intendedConnectionLevelAtom)
  const selectedClubsUuids = useAtomValue(selectedClubsUuidsAtom)
  const numberOfFriends = useAtomValue(numberOfFriendsAtom)
  const selectedClubNames = useGetAllClubsNamesForIds(selectedClubsUuids)
  const allClubsWithMembers = useAtomValue(clubsWithMembersAtom)

  useLayoutEffect(() => {
    setOfferForm(offerId)
  }, [offerId, setOfferForm])

  const handleBackPress = useCallback((): void => {
    if (hasUnsavedChanges) {
      void Effect.runPromise(
        Effect.andThen(showUnpublishedChangesDialog(), (success) => {
          if (success) safeGoBack()
        })
      )
    } else {
      safeGoBack()
    }
  }, [hasUnsavedChanges, safeGoBack, showUnpublishedChangesDialog])

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          handleBackPress()
          return true
        }
      )
      return () => {
        subscription.remove()
      }
    }, [handleBackPress])
  )

  const navigateToEdit = useCallback(
    (field: EditableOfferField) => {
      navigation.navigate('EditOfferField', {offerId, field})
    },
    [navigation, offerId]
  )

  const friendLevelHeadline = (() => {
    const level = intendedConnectionLevel ?? 'FIRST'
    const base =
      level === 'FIRST'
        ? t('offerForm.friendLevel.firstDegree')
        : t('offerForm.friendLevel.secondDegree')
    if (numberOfFriends.state !== 'success') return base
    const reach =
      level === 'FIRST'
        ? numberOfFriends.firstLevelFriendsCount
        : numberOfFriends.firstAndSecondLevelFriendsCount
    return `${base} (${t('offerForm.friendLevel.reachPeopleInlineFormatted', {
      localizedString: formatInteger(reach, locale),
    })})`
  })()

  const clubsHeadline = (() => {
    if (selectedClubNames.length === 0) return t('editOffer.noClubsSelected')
    const reach = allClubsWithMembers
      .filter((c) => selectedClubsUuids.includes(c.club.uuid))
      .reduce((sum, c) => sum + c.members.length, 0)
    return `${selectedClubNames.join(', ')} (${t(
      'offerForm.friendLevel.reachPeopleInlineFormatted',
      {
        localizedString: formatInteger(reach, locale),
      }
    )})`
  })()

  if (Option.isNone(offerOption)) {
    return (
      <Screen
        navigationBar={
          <NavigationBar
            style="back"
            title={t('editOffer.offerDetail')}
            leftAction={{icon: ChevronLeft, onPress: handleBackPress}}
          />
        }
      >
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$5">
          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            textAlign="center"
          >
            {t('offer.offerNotFound')}
          </Typography>
          <Button variant="primary" onPress={safeGoBack} width="100%">
            {t('common.back')}
          </Button>
        </YStack>
      </Screen>
    )
  }

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('editOffer.offerDetail')}
          leftAction={{icon: ChevronLeft, onPress: handleBackPress}}
          rightActions={[
            {
              icon: offerActive ? Pause : Play,
              disabled: hasUnsavedChanges,
              onPress: () => {
                void Effect.runPromise(pauseOrResumeOffer())
              },
            },
            {
              icon: TrashBin,
              variant: 'destructive',
              onPress: () => {
                void Effect.runPromise(
                  Effect.andThen(deleteOfferWithConfirmation(), (success) => {
                    if (success) safeGoBack()
                  })
                )
              },
            },
          ]}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + getTokens().space.$5.val,
        }}
      >
        <YStack gap="$5">
          <XStack alignItems="center" gap="$5" paddingVertical="$4">
            <Typography
              variant="paragraphDemibold"
              color="$foregroundPrimary"
              flex={1}
            >
              {offerTitle}
            </Typography>
            <TextTag
              variant={offerActive ? 'approved' : 'waiting'}
              label={
                offerActive
                  ? t('editOffer.activeOffer')
                  : t('editOffer.pausedOffer')
              }
            />
          </XStack>

          {listingType === 'PRODUCT' ? (
            <ProductCategoryStep
              active={false}
              icon={BoxProduct}
              overline={t('editOffer.detail.productCategory')}
              onEdit={() => {
                navigateToEdit('productCategory')
              }}
              onComplete={() => {}}
            />
          ) : null}
          {listingType === 'BITCOIN' ? (
            <AmountStep
              active={false}
              icon={MoneyBankNotes}
              overline={t('editOffer.detail.amount')}
              onEdit={() => {
                navigateToEdit('amount')
              }}
              onComplete={() => {}}
            />
          ) : (
            <PriceUpToStep
              active={false}
              icon={MoneyBankNotes}
              overline={t('editOffer.detail.amount')}
              onEdit={() => {
                navigateToEdit('amount')
              }}
              onComplete={() => {}}
            />
          )}
          <LocationStep
            active={false}
            icon={PinGeolocation}
            overline={t('editOffer.detail.location')}
            onEdit={() => {
              navigateToEdit('location')
            }}
            onComplete={() => {}}
          />
          <NetworkStep
            active={false}
            icon={OfferHandCash}
            overline={t('editOffer.detail.paymentDetails')}
            onEdit={() => {
              navigateToEdit('network')
            }}
            onComplete={() => {}}
          />
          <DescribeStep
            active={false}
            icon={ListWriteDocument}
            overline={t('editOffer.detail.offerDescription')}
            onEdit={() => {
              navigateToEdit('describe')
            }}
            onComplete={() => {}}
          />
          <LanguageStep
            active={false}
            icon={ChatBubbles}
            overline={t('editOffer.detail.offerLanguage')}
            onEdit={() => {
              navigateToEdit('language')
            }}
            onComplete={() => {}}
          />
          <EditRow
            state="completed"
            icon={PeopleUsers}
            overline={t('editOffer.detail.whoCanSeeYourOffer')}
            headline={friendLevelHeadline}
            onPress={() => {
              navigateToEdit('friendLevel')
            }}
          />
          <EditRow
            state="completed"
            icon={ConferenceClub}
            overline={t('editOffer.detail.publishToVexlClub')}
            headline={clubsHeadline}
            onPress={() => {
              navigateToEdit('clubs')
            }}
          />
          {hasUnsavedChanges ? (
            <Button
              variant="primary"
              size="medium"
              onPress={() => {
                void Effect.runPromise(
                  Effect.andThen(publishChanges(), (success) => {
                    if (success) safeGoBack()
                  })
                )
              }}
            >
              {t('editOffer.publishChanges')}
            </Button>
          ) : null}
        </YStack>
      </ScrollView>
    </Screen>
  )
}

export default MyOfferDetailScreen
