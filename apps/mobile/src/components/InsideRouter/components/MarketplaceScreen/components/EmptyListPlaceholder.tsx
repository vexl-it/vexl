import {Text, YStack} from 'tamagui'
import Button from '../../../../Button'
import {DateTime} from 'luxon'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import Image from '../../../../Image'
import anonymousAvatarSvg from '../../../../images/anonymousAvatarSvg'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {reachNumberAtom} from '../../../../../state/connections/atom/connectionStateAtom'
import {
  importedContactsCountAtom,
  lastImportOfContactsAtom,
} from '../../../../../state/contacts'
import {
  addMoreContactsSuggestionVisibleAtom,
  createOfferSuggestionVisibleAtom,
  resetFilterSuggestionVisibleAtom,
} from '../../../../../state/marketplace/atom'
import {
  isFilterActiveAtom,
  resetFilterInStorageActionAtom,
} from '../../../../../state/marketplace/filterAtoms'
import EmptyMarketplaceSuggestions from './EmptyMarketplaceSuggestions'
import MarketplaceSuggestion from './MarketplaceSuggestion'
import {useCallback, useMemo, useState} from 'react'
import {triggerOffersRefreshAtom} from '../../../../../state/marketplace'
import {ScrollView} from 'react-native'
import usePixelsFromBottomWhereTabsEnd from '../../../utils'

// time in minutes
const TIME_SINCE_CONTACTS_IMPORT_THRESHOLD = 60

const REACH_NUMBER_THRESHOLD = 30

interface EmptyListWrapperProps {
  buttonText: string
  children: React.ReactNode
  onButtonPress: () => void
}

function EmptyListWrapper({
  buttonText,
  children,
  onButtonPress,
}: EmptyListWrapperProps): JSX.Element {
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()

  return (
    <ScrollView contentContainerStyle={{paddingBottom: tabBarEndsAt + 25}}>
      <YStack f={1} ai={'center'} jc={'center'} py="$4" space="$4">
        <Image source={anonymousAvatarSvg} />
        {children}
        <Button
          text={buttonText}
          variant={'primary'}
          size={'small'}
          onPress={onButtonPress}
        />
      </YStack>
    </ScrollView>
  )
}

function EmptyListPlaceholder(): JSX.Element {
  const navigation = useNavigation()
  const {t} = useTranslation()
  const refreshOffers = useSetAtom(triggerOffersRefreshAtom)
  const importedContactsCount = useAtomValue(importedContactsCountAtom)
  const filterActive = useAtomValue(isFilterActiveAtom)
  const reachNumber = useAtomValue(reachNumberAtom)
  const lastImportOfContacts = useAtomValue(lastImportOfContactsAtom)
  const resetFilterInStorage = useSetAtom(resetFilterInStorageActionAtom)
  const createOfferSuggestionVisible = useAtomValue(
    createOfferSuggestionVisibleAtom
  )
  const addMoreContactsSuggestionVisible = useAtomValue(
    addMoreContactsSuggestionVisibleAtom
  )
  const [resetFilterSuggestionVisible, setResetFilterSuggestionVisible] =
    useAtom(resetFilterSuggestionVisibleAtom)

  const timeDifferenceSinceLastImport = useMemo(
    () =>
      Math.round(
        DateTime.now().diff(
          DateTime.fromISO(lastImportOfContacts ?? new Date().toISOString()),
          'minutes'
        ).minutes
      ),
    [lastImportOfContacts]
  )

  const [minutesTillOffersAreLoaded, setMinutesTillOffersAreLoaded] =
    useState<number>(
      TIME_SINCE_CONTACTS_IMPORT_THRESHOLD - timeDifferenceSinceLastImport
    )

  function resetFilterAndSaveIt(): void {
    resetFilterInStorage()
    setResetFilterSuggestionVisible(true)
  }

  useFocusEffect(
    useCallback(() => {
      if (reachNumber >= REACH_NUMBER_THRESHOLD && lastImportOfContacts) {
        const interval = setInterval(() => {
          if (minutesTillOffersAreLoaded > 1) {
            setMinutesTillOffersAreLoaded(minutesTillOffersAreLoaded - 1)
          }
          void refreshOffers()
        }, 60000)

        return () => {
          clearInterval(interval)
        }
      }
    }, [
      lastImportOfContacts,
      minutesTillOffersAreLoaded,
      reachNumber,
      refreshOffers,
    ])
  )

  if (filterActive) {
    return resetFilterSuggestionVisible ? (
      <MarketplaceSuggestion
        mt={'$4'}
        buttonText={t('offer.resetFilter')}
        onButtonPress={resetFilterAndSaveIt}
        onClosePress={() => {
          setResetFilterSuggestionVisible(false)
        }}
        text={t('offer.noOffersToMatchFilter')}
      />
    ) : (
      <EmptyListWrapper
        buttonText={t('offer.resetFilter')}
        onButtonPress={resetFilterAndSaveIt}
      >
        <Text
          textAlign={'center'}
          col={'$greyOnWhite'}
          fos={20}
          ff={'$body600'}
          adjustsFontSizeToFit
          numberOfLines={4}
        >
          {t('offer.createOfferNudge')}
        </Text>
        <Button
          text={t('myOffers.addNewOffer')}
          variant={'secondary'}
          size={'small'}
          onPress={() => {
            navigation.navigate('CreateOffer')
          }}
        />
      </EmptyListWrapper>
    )
  }

  if (importedContactsCount === 0 || reachNumber < REACH_NUMBER_THRESHOLD) {
    return addMoreContactsSuggestionVisible || createOfferSuggestionVisible ? (
      <EmptyMarketplaceSuggestions />
    ) : (
      <EmptyListWrapper
        buttonText={t('suggestion.addMoreContacts')}
        onButtonPress={() => {
          navigation.navigate('SetContacts', {})
        }}
      >
        <Text
          textAlign={'center'}
          col={'$greyOnWhite'}
          fos={20}
          ff={'$body600'}
        >
          {importedContactsCount === 0
            ? t('offer.notImportedAnyContacts')
            : t('offer.socialNetworkTooSmall')}
        </Text>
      </EmptyListWrapper>
    )
  }

  if (reachNumber >= REACH_NUMBER_THRESHOLD && lastImportOfContacts) {
    const diffIsLessThenHour =
      timeDifferenceSinceLastImport < TIME_SINCE_CONTACTS_IMPORT_THRESHOLD
    return (
      <EmptyListWrapper
        buttonText={t('offer.emptyAction')}
        onButtonPress={() => {
          navigation.navigate('CreateOffer')
        }}
      >
        {diffIsLessThenHour ? (
          <Text
            textAlign={'center'}
            col={'$greyOnWhite'}
            fos={20}
            ff={'$body600'}
          >
            {t('offer.offersAreLoadingAndShouldBeReady', {
              minutes: minutesTillOffersAreLoaded,
            })}
          </Text>
        ) : (
          <Text
            textAlign={'center'}
            col={'$greyOnWhite'}
            fos={20}
            ff={'$body600'}
          >
            {t('offer.marketplaceEmpty')}
          </Text>
        )}
      </EmptyListWrapper>
    )
  }

  return <></>
}

export default EmptyListPlaceholder
