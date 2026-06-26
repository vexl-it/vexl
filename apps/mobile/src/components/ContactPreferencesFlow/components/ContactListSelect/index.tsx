import {
  Banner,
  Button,
  KeyboardStickyView,
  Stack,
  Typography,
  useTheme,
  XStack,
  type TabItem,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {Pressable, type LayoutChangeEvent} from 'react-native'
import {type ContactsFilter} from '../../../../state/contacts/domain'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {useKeyboardAwareFooterListPadding} from '../../../../utils/useKeyboardAwareFooterListPadding'
import NormalizeContactsWithLoadingScreen from '../../../NormalizeContactsWithLoadingScreen'
import PreparingContactsOverlay from '../PreparingContactsOverlay'
import {contactSelectMolecule} from './atom'
import ContactsAccessPrivilegesInfoBanner from './components/ContactsAccessPrivilegesInfoBanner'
import ContactsFilterBar from './components/ContactsFilterBar'
import ContactsListEmpty from './components/ContactsListEmpty'
import FilteredContacts from './components/FilteredContactsWithProvider'
import SearchBar from './components/SearchBar'
import useContactListSelectLifecycle from './hooks/useContactListSelectLifecycle'
import usePreparedContactsFilter from './hooks/usePreparedContactsFilter'
import useSubmitSelectedContacts from './hooks/useSubmitSelectedContacts'

function ContactsListSelect({
  addContactRequestId,
  filter,
}: {
  readonly addContactRequestId: number
  readonly filter?: ContactsFilter
}): React.ReactElement {
  const {t} = useTranslation()
  const {
    areThereAnyContactsToDisplayForSelectedTabAtom,
    areAllContactsToDisplaySelectedAtom,
    contactsToDisplayCountAtom,
    isContactsPreparingAtom,
    newContactsToDisplayCountAtom,
    toggleAllContactsToDisplayActionAtom,
  } = useMolecule(contactSelectMolecule)
  const theme = useTheme()
  const normalizedContacts = useContactListSelectLifecycle()
  const isContactsPreparing = useAtomValue(isContactsPreparingAtom)
  const newContactsToDisplayCount = useAtomValue(newContactsToDisplayCountAtom)
  const contactsToDisplayCount = useAtomValue(contactsToDisplayCountAtom)
  const areAllContactsToDisplaySelected = useAtomValue(
    areAllContactsToDisplaySelectedAtom
  )
  const areThereAnyContactsToDisplayForSelectedTab = useAtomValue(
    areThereAnyContactsToDisplayForSelectedTabAtom
  )
  const toggleAllContactsToDisplay = useSetAtom(
    toggleAllContactsToDisplayActionAtom
  )
  const {selectedFilter, setSelectedFilter} = usePreparedContactsFilter(filter)
  const {isSubmittingContacts, submitSelectedContacts} =
    useSubmitSelectedContacts()
  const submitBarHeightRef = React.useRef(0)
  const [submitBarHeight, setSubmitBarHeight] = React.useState(0)
  const [
    newContactsBannerDismissedForCurrentScreen,
    setNewContactsBannerDismissedForCurrentScreen,
  ] = React.useState(false)
  const handleSubmitBarLayout = React.useCallback((e: LayoutChangeEvent) => {
    const measuredSubmitBarHeight = e.nativeEvent.layout.height
    if (submitBarHeightRef.current === measuredSubmitBarHeight) return

    submitBarHeightRef.current = measuredSubmitBarHeight
    setSubmitBarHeight(measuredSubmitBarHeight)
  }, [])
  const keyboardBottomSpacerHeight = useKeyboardAwareFooterListPadding({
    footerHeight: 0,
    footerHeightFallback: 0,
    keyboardHeightOffset: submitBarHeight,
  })

  const shouldShowEmptyContactsState =
    !Array.isNonEmptyArray(normalizedContacts) && addContactRequestId === 0

  const contactsFilterItems = useMemo(
    (): ReadonlyArray<TabItem<ContactsFilter>> => [
      {
        label: t('postLoginFlow.contactsList.all'),
        value: 'all',
      },
      {
        label: t('postLoginFlow.contactsList.new'),
        value: 'new',
        badge: newContactsToDisplayCount > 0,
      },
      {
        label: t('postLoginFlow.contactsList.active'),
        value: 'submitted',
      },
      {
        label: t('postLoginFlow.contactsList.hidden'),
        value: 'nonSubmitted',
      },
    ],
    [newContactsToDisplayCount, t]
  )

  if (shouldShowEmptyContactsState) {
    return <ContactsListEmpty variant="emptyContacts" />
  }

  const isActivateAllButtonDisabled =
    !areThereAnyContactsToDisplayForSelectedTab || isContactsPreparing
  const shouldShowNewContactsBanner =
    selectedFilter === 'all' &&
    newContactsToDisplayCount > 0 &&
    !newContactsBannerDismissedForCurrentScreen
  const bulkToggleLabel = t(
    areAllContactsToDisplaySelected
      ? 'postLoginFlow.contactsList.deactivateAll'
      : 'postLoginFlow.contactsList.activateAll'
  )

  return (
    <Stack f={1} pos="relative">
      <Stack f={1} pb={submitBarHeight}>
        <ContactsFilterBar
          items={contactsFilterItems}
          selectedFilter={selectedFilter}
          onSelectedFilterChange={setSelectedFilter}
        />
        <Stack px="$5" pb="$3" gap="$3">
          <XStack alignItems="center" gap="$3">
            <Stack flex={1}>
              <SearchBar addContactRequestId={addContactRequestId} />
            </Stack>
          </XStack>
          <XStack alignItems="center" justifyContent="space-between" px="$1">
            <Typography variant="description" color="$foregroundSecondary">
              {t('account.contactsCount', {count: contactsToDisplayCount})}
            </Typography>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={bulkToggleLabel}
              disabled={isActivateAllButtonDisabled}
              onPress={toggleAllContactsToDisplay}
            >
              <Typography
                variant="descriptionBold"
                color={theme.accentHighlightPrimary.get()}
                opacity={isActivateAllButtonDisabled ? 0.45 : 1}
              >
                {bulkToggleLabel}
              </Typography>
            </Pressable>
          </XStack>
          {shouldShowNewContactsBanner ? (
            <Banner
              color="pink"
              title={t('marketplace.importNewContactsSuggestion.title')}
              description={t(
                'marketplace.importNewContactsSuggestion.description'
              )}
              primaryButton={{
                label: t('marketplace.importNewContactsSuggestion.button'),
                onPress: () => {
                  setNewContactsBannerDismissedForCurrentScreen(true)
                  setSelectedFilter('new')
                },
              }}
              secondaryButton={{
                label: t('marketplace.importNewContactsSuggestion.dismiss'),
                onPress: () => {
                  setNewContactsBannerDismissedForCurrentScreen(true)
                },
              }}
            />
          ) : null}
          <ContactsAccessPrivilegesInfoBanner />
        </Stack>
        <Stack f={1} pos="relative">
          <FilteredContacts
            keyboardBottomSpacerHeight={keyboardBottomSpacerHeight}
          />
          <PreparingContactsOverlay visible={isContactsPreparing} zIndex={10} />
        </Stack>
      </Stack>
      <KeyboardStickyView
        style={{position: 'absolute', left: 0, right: 0, bottom: 0}}
      >
        <Stack px="$5" py="$4" onLayout={handleSubmitBarLayout}>
          <Button
            disabled={isSubmittingContacts}
            onPress={submitSelectedContacts}
          >
            {t('common.submit')}
          </Button>
        </Stack>
      </KeyboardStickyView>
      <PreparingContactsOverlay
        labelKey="contacts.processingContacts"
        visible={isSubmittingContacts}
        zIndex={20}
      />
    </Stack>
  )
}

export default function ContactListWithLoadStep({
  addContactRequestId,
  filter,
}: {
  readonly addContactRequestId: number
  readonly filter?: ContactsFilter
}): React.ReactElement {
  return (
    <NormalizeContactsWithLoadingScreen>
      <ContactsListSelect
        addContactRequestId={addContactRequestId}
        filter={filter}
      />
    </NormalizeContactsWithLoadingScreen>
  )
}
