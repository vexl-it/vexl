import {useNavigation} from '@react-navigation/native'
import {FaqStayAnonymous, Typography} from '@vexl-next/ui'
import {Option} from 'effect/index'
import {useAtomValue} from 'jotai'
import React from 'react'
import {Stack, XStack, YStack} from 'tamagui'
import {reachNumberAtom} from '../../../../../state/connections/atom/connectionStateAtom'
import {importedContactsCountAtom} from '../../../../../state/contacts/atom/contactsStore'
import {notificationsEnabledAtom} from '../../../../../state/notifications/areNotificationsEnabledAtom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'

const REACH_NUMBER_THRESHOLD = 30

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
  const reachNumber = useAtomValue(reachNumberAtom)
  const importedContactsCount = useAtomValue(importedContactsCountAtom)
  const areNotificationsEnabled = useAtomValue(notificationsEnabledAtom)

  if (importedContactsCount === 0) {
    return {
      title: t('emptyMarketplace.yourMarketStartsWithYourContacts'),
      primaryAction: {
        description: t(
          'emptyMarketplace.vexlConnectsYouWithPeopleYouKnowAndTrust'
        ),
        buttonText: t('common.addContacts'),
        onButtonPress: () => {},
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
        onButtonPress: () => {},
      },
      secondaryAction: {
        description: t('emptyMarketplace.exploreTheCommunity'),
        buttonText: t('emptyMarketplace.goToCommunity'),
        onButtonPress: () => {},
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
        onButtonPress: () => {},
      },
      secondaryAction: {
        description: t('emptyMarketplace.exploreTheCommunity'),
        buttonText: t('emptyMarketplace.goToCommunity'),
        onButtonPress: () => {},
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
        onButtonPress: () => {},
      },
    }
  }

  return {
    title: t('emptyMarketplace.noOffersHere'),
    primaryAction: {
      description: t('emptyMarketplace.beTheFirstToCreateOne'),
      buttonText: t('emptyMarketplace.postNewOffer'),
      onButtonPress: () => {},
    },
    secondaryAction: {
      description: t('emptyMarketplace.exploreTheCommunity'),
      buttonText: t('emptyMarketplace.goToCommunity'),
      onButtonPress: () => {},
    },
  }
}

function EmptyList(): React.ReactElement {
  const {t} = useTranslation()
  const emptyListVariant = useEmptyListVariants()

  return (
    <YStack gap="$6" ai="center" px="$4">
      <Stack ai="center" jc="center">
        <FaqStayAnonymous variant="dark" width={253} height={179} />
      </Stack>
      <Typography
        variant="heading3"
        fontWeight="700"
        col="$white"
        ta="center"
        py="$2"
      >
        {emptyListVariant.title}
      </Typography>
      <YStack gap="$4" ai="center" px="$4" w="100%">
        <Typography variant="description" col="$greyOnWhite" ta="center">
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
          <XStack ai="center" gap="$2" w="100%" px="$4">
            <Stack f={1} h={1} bc="$greyOnWhite" />
            <Typography variant="description" col="$greyOnWhite">
              {t('common.or')}
            </Typography>
            <Stack f={1} h={1} bc="$greyOnWhite" />
          </XStack>
          <YStack gap="$4" ai="center" px="$4" w="100%">
            <Typography variant="description" col="$greyOnWhite" ta="center">
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
