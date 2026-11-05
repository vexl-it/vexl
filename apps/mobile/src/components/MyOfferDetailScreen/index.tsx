import {useFocusEffect} from '@react-navigation/native'
import {
  BoxProduct,
  Button,
  ChatBubbles,
  ChevronLeft,
  ConferenceClub,
  EditRow,
  EmptyState,
  ListWriteDocument,
  MoneyBankNotes,
  NavigationBar,
  OfferHandCash,
  Pause,
  PeopleUsers,
  PinGeolocation,
  Play,
  Screen,
  TextTag,
  TrashBin,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Effect, Number, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useLayoutEffect, useMemo} from 'react'
import {BackHandler} from 'react-native'
import {type RootStackScreenProps} from '../../navigationTypes'
import {
  clubsWithMembersAtom,
  useGetAllClubsNamesForIds,
} from '../../state/clubs/atom/clubsWithMembersAtom'
import {getClubReach} from '../../state/clubs/utils'
import {useSingleOffer} from '../../state/marketplace'
import {isOfferMissingProductCategoryAtom} from '../../state/marketplace/atoms/offersState'
import {isOfferExpired} from '../../utils/isOfferExpired'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {formatInteger} from '../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../utils/localization/formattingLocaleAtom'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {offerFormMolecule} from '../CRUDOfferFlow/atoms/offerFormStateAtoms'
import AmountStep from '../CRUDOfferFlow/components/AmountStep'
import DescribeStep from '../CRUDOfferFlow/components/DescribeStep'
import FriendLevelStep from '../CRUDOfferFlow/components/FriendLevelStep'
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
  const selectedClubsUuids = useAtomValue(selectedClubsUuidsAtom)
  const selectedClubNames = useGetAllClubsNamesForIds(selectedClubsUuids)
  const allClubsWithMembers = useAtomValue(clubsWithMembersAtom)
  const isMissingProductCategory = useAtomValue(
    useMemo(() => isOfferMissingProductCategoryAtom(offerId), [offerId])
  )

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

  const hasSelectedClubs = Array.isNonEmptyArray(selectedClubNames)
  const clubsReach = pipe(
    allClubsWithMembers,
    Array.filter((c) => selectedClubsUuids.includes(c.club.uuid)),
    Array.map(getClubReach),
    Number.sumAll
  )
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
        <EmptyState
          fullscreen
          title={t('offer.offerNotFound')}
          action={{
            label: t('common.back'),
            onPress: safeGoBack,
            variant: 'primary',
          }}
        />
      </Screen>
    )
  }

  const isExpiredOffer = isOfferExpired(
    offerOption.value.offerInfo.publicPart.expirationDate
  )
  const offerStatusLabel =
    isExpiredOffer && !offerActive
      ? t('editOffer.expiredAndPausedOffer')
      : isExpiredOffer
        ? t('editOffer.expiredOffer')
        : offerActive
          ? t('editOffer.activeOffer')
          : t('editOffer.pausedOffer')
  const offerStatusVariant = isExpiredOffer
    ? 'warning'
    : offerActive
      ? 'approved'
      : 'waiting'

  return (
    <Screen
      scrollable
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
                void Effect.runPromise(pauseOrResumeOffer()).then((success) => {
                  if (success) {
                    navigation.popTo('InsideTabs', {
                      screen: 'Marketplace',
                      params: {
                        initialTab: 'myOffers',
                        tabSwitchRequestId: String(Date.now()),
                      },
                    })
                  }
                })
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
      <YStack gap="$5" paddingBottom="$5">
        <XStack alignItems="center" gap="$5" paddingVertical="$4">
          <Typography
            variant="paragraphDemibold"
            color="$foregroundPrimary"
            flex={1}
          >
            {offerTitle}
          </Typography>
          <TextTag variant={offerStatusVariant} label={offerStatusLabel} />
        </XStack>

        {listingType === 'PRODUCT' ? (
          <ProductCategoryStep
            active={false}
            icon={BoxProduct}
            missing={isMissingProductCategory}
            missingHeadline={t('editOffer.categoryRequired')}
            overline={t('editOffer.detail.productCategory')}
            onEdit={() => {
              navigateToEdit('productCategory')
            }}
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
          />
        ) : (
          <PriceUpToStep
            active={false}
            icon={MoneyBankNotes}
            overline={t('editOffer.detail.amount')}
            onEdit={() => {
              navigateToEdit('amount')
            }}
          />
        )}
        <LocationStep
          active={false}
          icon={PinGeolocation}
          overline={t('editOffer.detail.location')}
          onEdit={() => {
            navigateToEdit('location')
          }}
        />
        <NetworkStep
          active={false}
          icon={OfferHandCash}
          overline={t('editOffer.detail.paymentDetails')}
          onEdit={() => {
            navigateToEdit('network')
          }}
        />
        <DescribeStep
          active={false}
          icon={ListWriteDocument}
          overline={t('editOffer.detail.offerDescription')}
          onEdit={() => {
            navigateToEdit('describe')
          }}
        />
        <LanguageStep
          active={false}
          icon={ChatBubbles}
          overline={t('editOffer.detail.offerLanguage')}
          onEdit={() => {
            navigateToEdit('language')
          }}
        />
        <FriendLevelStep
          active={false}
          icon={PeopleUsers}
          overline={t('editOffer.detail.whoCanSeeYourOffer')}
          onEdit={() => {
            navigateToEdit('friendLevel')
          }}
        />
        {allClubsWithMembers.length > 0 ? (
          <EditRow
            state="completed"
            icon={ConferenceClub}
            overline={t('editOffer.detail.publishToVexlClub')}
            headline={
              hasSelectedClubs
                ? selectedClubNames.join(', ')
                : t('editOffer.noClubsSelected')
            }
            subheadline={
              hasSelectedClubs
                ? t('offerForm.friendLevel.reachPeopleFormatted', {
                    localizedString: formatInteger(clubsReach, locale),
                  })
                : undefined
            }
            onPress={() => {
              navigateToEdit('clubs')
            }}
          />
        ) : null}
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
    </Screen>
  )
}

export default MyOfferDetailScreen
