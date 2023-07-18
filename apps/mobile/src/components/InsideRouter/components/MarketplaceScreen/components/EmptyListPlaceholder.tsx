import {Stack, Text, YStack} from 'tamagui'
import Button from '../../../../Button'
import {DateTime} from 'luxon'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useNavigation} from '@react-navigation/native'
import Image from '../../../../Image'
import emptyMarketplaceAnonymousAvatarSvg from '../images/emptyMarketplaceAnonymousAvatarSvg'
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
  resetFilterAtom,
  saveFilterActionAtom,
} from '../../../../FilterOffersScreen/atom'
import EmptyMarketplaceSuggestions from './EmptyMarketplaceSuggestions'
import MarketplaceSuggestion from './MarketplaceSuggestion'
import {useEffect, useMemo, useState} from 'react'
import {useTriggerOffersRefresh} from '../../../../../state/marketplace'

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
  return (
    <Stack pos={'absolute'} t={0} b={0} l={0} r={0} zIndex={-1}>
      <YStack f={1} ai={'center'} jc={'center'} py="$4" space="$4">
        <Image source={emptyMarketplaceAnonymousAvatarSvg} />
        {children}
        <Button
          text={buttonText}
          variant={'primary'}
          size={'small'}
          onPress={onButtonPress}
        />
      </YStack>
    </Stack>
  )
}

function EmptyListPlaceholder(): JSX.Element {
  const navigation = useNavigation()
  const {t} = useTranslation()
  const refreshOffers = useTriggerOffersRefresh()
  const importedContactsCount = useAtomValue(importedContactsCountAtom)
  const filterActive = useAtomValue(isFilterActiveAtom)
  const reachNumber = useAtomValue(reachNumberAtom)
  const lastImportOfContacts = useAtomValue(lastImportOfContactsAtom)
  const saveFilter = useSetAtom(saveFilterActionAtom)
  const resetFilter = useSetAtom(resetFilterAtom)
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
    resetFilter()
    saveFilter()
    setResetFilterSuggestionVisible(true)
  }

  useEffect(() => {
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
    timeDifferenceSinceLastImport,
  ])

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
        >
          {t('offer.noOffersToMatchFilter')}
        </Text>
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
          navigation.navigate('SetContacts')
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
