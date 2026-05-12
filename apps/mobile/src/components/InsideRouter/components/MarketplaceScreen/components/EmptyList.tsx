import {useNavigation} from '@react-navigation/native'
import {
  FaqStayAnonymous,
  MarketplaceEmptyLoader,
  Typography,
} from '@vexl-next/ui'
import {Option} from 'effect/index'
import {useAtomValue} from 'jotai'
import React, {useCallback} from 'react'
import {Stack, XStack, YStack} from 'tamagui'
import {reachNumberAtom} from '../../../../../state/connections/atom/connectionStateAtom'
import {importedContactsCountAtom} from '../../../../../state/contacts/atom/contactsStore'
import {shouldShowLoadingOffersAtom} from '../../../../../state/marketplace/atoms/shouldShowLoadingOffersAtom'
import {REACH_NUMBER_THRESHOLD} from '../../../../../state/marketplace/domain'
import {notificationsEnabledAtom} from '../../../../../state/notifications/areNotificationsEnabledAtom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import useAddContactsFromMarketplaceAction from './useAddContactsFromMarketplaceAction'
import useEnableNotificationsFromMarketplaceAction from './useEnableNotificationsFromMarketplaceAction'

interface EmptyListAction {
  readonly description: string
  readonly buttonText: string
  readonly onButtonPress: () => void
}

interface EmptyListVariant {
  readonly title: string
  readonly primaryAction: EmptyListAction
  readonly secondaryAction?: EmptyListAction | undefined
}

function useEmptyListVariants(): EmptyListVariant {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const addContacts = useAddContactsFromMarketplaceAction()
  const enableNotifications = useEnableNotificationsFromMarketplaceAction()
  const reachNumber = useAtomValue(reachNumberAtom)
  const importedContactsCount = useAtomValue(importedContactsCountAtom)
  const areNotificationsEnabled = useAtomValue(notificationsEnabledAtom)

  const navigateToCommunity = useCallback(() => {
    navigation.navigate('InsideTabs', {
      screen: 'Community',
    })
  }, [navigation])

  const navigateToCreateOffer = useCallback(() => {
    navigation.navigate('CRUDOfferFlow')
  }, [navigation])

  if (importedContactsCount === 0) {
    return {
      title: t('emptyMarketplace.yourMarketStartsWithYourContacts'),
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
      title: t('emptyMarketplace.youAreTheFirstOneInYourNetwork'),
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
      title: t('emptyMarketplace.friendsCanSeeYourOffers', {
        count: reachNumber,
      }),
      primaryAction: {
        description: t('emptyMarketplace.noOnePostedYet'),
        buttonText: t('emptyMarketplace.postNewOffer'),
        onButtonPress: navigateToCreateOffer,
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
      title: t('emptyMarketplace.youAreEarly'),
      primaryAction: {
        description: t('emptyMarketplace.turnOnNotificationsSoYouDontMiss'),
        buttonText: t('emptyMarketplace.turnOnNotifications'),
        onButtonPress: enableNotifications,
      },
    }
  }

  return {
    title: t('emptyMarketplace.noOffersHere'),
    primaryAction: {
      description: t('emptyMarketplace.beTheFirstToCreateOne'),
      buttonText: t('emptyMarketplace.postNewOffer'),
      onButtonPress: navigateToCreateOffer,
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
  const emptyListVariant = useEmptyListVariants()
  const shouldShowLoadingOffers = useAtomValue(shouldShowLoadingOffersAtom)

  if (shouldShowLoadingOffers) {
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
        fontWeight="700"
        color="$white"
        ta="center"
        py="$2"
      >
        {emptyListVariant.title}
      </Typography>
      <YStack gap="$4" ai="center" w="100%">
        <Typography variant="description" color="$greyOnWhite" ta="center">
          {emptyListVariant.primaryAction.description}
        </Typography>
        <Button
          variant="secondary"
          size="small"
          text={emptyListVariant.primaryAction.buttonText}
          onPress={emptyListVariant.primaryAction.onButtonPress}
          fullWidth
        />
      </YStack>
      {!!emptyListVariant.secondaryAction && (
        <>
          <XStack ai="center" gap="$2" w="100%">
            <Stack f={1} h={1} bc="$greyOnWhite" />
            <Typography variant="description" color="$greyOnWhite">
              {t('common.or')}
            </Typography>
            <Stack f={1} h={1} bc="$greyOnWhite" />
          </XStack>
          <YStack gap="$4" ai="center" w="100%">
            <Typography variant="description" color="$greyOnWhite" ta="center">
              {emptyListVariant.secondaryAction.description}
            </Typography>
            <Button
              variant="primary"
              size="small"
              text={emptyListVariant.secondaryAction.buttonText}
              onPress={emptyListVariant.secondaryAction.onButtonPress}
              fullWidth
            />
          </YStack>
        </>
      )}
    </YStack>
  )
}

export default EmptyList
