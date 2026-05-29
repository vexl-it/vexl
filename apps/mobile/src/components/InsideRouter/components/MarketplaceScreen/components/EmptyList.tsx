import {useNavigation} from '@react-navigation/native'
import {
  Button,
  FaqStayAnonymous,
  MarketplaceEmptyLoader,
  Stack,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Effect, Option} from 'effect/index'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useState} from 'react'
import {
  fistAndSecondLevelConnectionsReachAtom,
  reachNumberAtom,
} from '../../../../../state/connections/atom/connectionStateAtom'
import {importedContactsCountAtom} from '../../../../../state/contacts/atom/contactsStore'
import {useAreOffersLoading} from '../../../../../state/marketplace'
import {hasPostedFirstOfferActionStepAtom} from '../../../../../state/marketplace/atoms/myOffers'
import {refreshOffersActionAtom} from '../../../../../state/marketplace/atoms/refreshOffersActionAtom'
import {shouldShowLoadingOffersAtom} from '../../../../../state/marketplace/atoms/shouldShowLoadingOffersAtom'
import {REACH_NUMBER_THRESHOLD} from '../../../../../state/marketplace/domain'
import {notificationsEnabledAtom} from '../../../../../state/notifications/areNotificationsEnabledAtom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import useAddContactsFromMarketplaceAction from './useAddContactsFromMarketplaceAction'
import useEnableNotificationsFromMarketplaceAction from './useEnableNotificationsFromMarketplaceAction'

const EMPTY_MARKETPLACE_REFRESH_INTERVAL_MS = 5000
const LOADING_OFFERS_EMPTY_STATE_TIMEOUT_MS = 15_000

interface EmptyListAction {
  readonly description: string
  readonly buttonText: string
  readonly onButtonPress: () => void
}

interface EmptyListVariant {
  readonly primaryAction: EmptyListAction
  readonly secondaryAction?: EmptyListAction | undefined
}

const CONNECTIONS_COUNT_HEADING_THRESHOLD = 50

function useEmptyListHeading(): string {
  const {t} = useTranslation()
  const connectionsCount = useAtomValue(fistAndSecondLevelConnectionsReachAtom)
  const areNotificationsEnabled = useAtomValue(notificationsEnabledAtom)

  if (
    Option.isNone(areNotificationsEnabled) ||
    !areNotificationsEnabled.value.notifications
  ) {
    return t('emptyMarketplace.youAreEarly')
  }

  if (connectionsCount < CONNECTIONS_COUNT_HEADING_THRESHOLD) {
    return t('emptyMarketplace.friendsCanSeeYourOffers', {
      count: connectionsCount,
    })
  }

  return t('emptyMarketplace.noOffersYet')
}

function useEmptyListVariants(): EmptyListVariant {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const addContacts = useAddContactsFromMarketplaceAction()
  const enableNotifications = useEnableNotificationsFromMarketplaceAction()
  const reachNumber = useAtomValue(reachNumberAtom)
  const importedContactsCount = useAtomValue(importedContactsCountAtom)
  const areNotificationsEnabled = useAtomValue(notificationsEnabledAtom)
  const hasPostedFirstOffer = useAtomValue(hasPostedFirstOfferActionStepAtom)

  const navigateToCommunity = useCallback(() => {
    navigation.navigate('InsideTabs', {
      screen: 'Community',
    })
  }, [navigation])

  const navigateToCreateOffer = useCallback(() => {
    navigation.navigate('CRUDOfferFlow')
  }, [navigation])

  const navigateToContactPreferences = useCallback(() => {
    navigation.navigate('ContactPreferences')
  }, [navigation])

  const createOfferOrAddContactsAction = {
    buttonText: hasPostedFirstOffer
      ? t('emptyMarketplace.addMoreContacts')
      : t('emptyMarketplace.postNewOffer'),
    onButtonPress: hasPostedFirstOffer
      ? navigateToContactPreferences
      : navigateToCreateOffer,
  }

  if (importedContactsCount === 0) {
    return {
      primaryAction: {
        description: t(
          'emptyMarketplace.vexlConnectsYouWithPeopleYouKnowAndTrust'
        ),
        buttonText: t('common.addContacts'),
        onButtonPress: addContacts,
      },
    }
  }

  if (
    reachNumber === 0 &&
    Option.isSome(areNotificationsEnabled) &&
    !areNotificationsEnabled.value.notifications
  ) {
    return {
      primaryAction: {
        description: t('emptyMarketplace.weWillLetYouKnowOnceYourFriends'),
        buttonText: t('common.enableNotifications'),
        onButtonPress: enableNotifications,
      },
      secondaryAction: {
        description: t('emptyMarketplace.exploreTheCommunity'),
        buttonText: t('emptyMarketplace.goToCommunity'),
        onButtonPress: navigateToCommunity,
      },
    }
  }

  if (reachNumber < REACH_NUMBER_THRESHOLD) {
    return {
      primaryAction: {
        description: t('emptyMarketplace.noOnePostedYet'),
        ...createOfferOrAddContactsAction,
      },
      secondaryAction: {
        description: t('emptyMarketplace.exploreTheCommunity'),
        buttonText: t('emptyMarketplace.goToCommunity'),
        onButtonPress: navigateToCommunity,
      },
    }
  }

  if (
    Option.isSome(areNotificationsEnabled) &&
    !areNotificationsEnabled.value.notifications
  ) {
    return {
      primaryAction: {
        description: t('emptyMarketplace.turnOnNotificationsSoYouDontMiss'),
        buttonText: t('emptyMarketplace.turnOnNotifications'),
        onButtonPress: enableNotifications,
      },
    }
  }

  return {
    primaryAction: {
      description: t('emptyMarketplace.noOnePostedYet'),
      ...createOfferOrAddContactsAction,
    },
    secondaryAction: {
      description: t('emptyMarketplace.exploreTheCommunity'),
      buttonText: t('emptyMarketplace.goToCommunity'),
      onButtonPress: navigateToCommunity,
    },
  }
}

function EmptyList(): React.ReactElement {
  const {t} = useTranslation()
  const emptyListHeading = useEmptyListHeading()
  const emptyListVariant = useEmptyListVariants()
  const shouldShowLoadingOffers = useAtomValue(shouldShowLoadingOffersAtom)
  const refreshOffers = useSetAtom(refreshOffersActionAtom)
  const loading = useAreOffersLoading()
  const [loadingOffersTimedOut, setLoadingOffersTimedOut] = useState(false)

  useEffect(() => {
    if (!shouldShowLoadingOffers || loadingOffersTimedOut || loading) {
      return undefined
    }

    const intervalId = setInterval(() => {
      Effect.runFork(refreshOffers())
    }, EMPTY_MARKETPLACE_REFRESH_INTERVAL_MS)

    return () => {
      clearInterval(intervalId)
    }
  }, [loading, loadingOffersTimedOut, refreshOffers, shouldShowLoadingOffers])

  useEffect(() => {
    if (!shouldShowLoadingOffers) {
      setLoadingOffersTimedOut(false)
      return undefined
    }

    const timeoutId = setTimeout(() => {
      setLoadingOffersTimedOut(true)
    }, LOADING_OFFERS_EMPTY_STATE_TIMEOUT_MS)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [shouldShowLoadingOffers])

  if (shouldShowLoadingOffers && (!loadingOffersTimedOut || loading)) {
    return (
      <MarketplaceEmptyLoader label={t('emptyMarketplace.loadingOffers')} />
    )
  }

  return (
    <YStack gap="$6" ai="center" paddingHorizontal="$5">
      <Stack ai="center" jc="center">
        <FaqStayAnonymous variant="dark" width={253} height={179} />
      </Stack>
      <Typography
        variant="heading3"
        color="$foregroundPrimary"
        ta="center"
        py="$2"
      >
        {emptyListHeading}
      </Typography>
      <YStack gap="$4" ai="center" w="100%">
        <Typography
          variant="description"
          color="$foregroundSecondary"
          ta="center"
        >
          {emptyListVariant.primaryAction.description}
        </Typography>
        <Button
          variant="primary"
          size="small"
          onPress={emptyListVariant.primaryAction.onButtonPress}
          width="100%"
        >
          {emptyListVariant.primaryAction.buttonText}
        </Button>
      </YStack>
      {!!emptyListVariant.secondaryAction && (
        <>
          <XStack ai="center" gap="$2" w="100%">
            <Stack f={1} h={1} bc="$foregroundSecondary" />
            <Typography variant="description" color="$foregroundSecondary">
              {t('common.or')}
            </Typography>
            <Stack f={1} h={1} bc="$foregroundSecondary" />
          </XStack>
          <YStack gap="$4" ai="center" w="100%">
            <Typography
              variant="description"
              color="$foregroundSecondary"
              ta="center"
            >
              {emptyListVariant.secondaryAction.description}
            </Typography>
            <Button
              variant="secondary"
              size="small"
              onPress={emptyListVariant.secondaryAction.onButtonPress}
              width="100%"
            >
              {emptyListVariant.secondaryAction.buttonText}
            </Button>
          </YStack>
        </>
      )}
    </YStack>
  )
}

export default EmptyList
