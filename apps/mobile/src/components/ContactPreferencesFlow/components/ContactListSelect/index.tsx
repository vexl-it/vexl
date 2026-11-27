import {
  Button,
  KeyboardStickyView,
  Stack,
  Typography,
  XStack,
  type TabItem,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import React, {useMemo} from 'react'
import {type LayoutChangeEvent} from 'react-native'
import {type ContactsFilter} from '../../../../state/contacts/domain'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {useKeyboardAwareFooterListPadding} from '../../../../utils/useKeyboardAwareFooterListPadding'
import PreparingContactsOverlay from '../PreparingContactsOverlay'
import {contactSelectMolecule} from './atom'
import BulkSelectionButton, {
  BulkSelectionProvider,
} from './components/BulkSelectionButton'
import ContactLossSummary from './components/ContactLossSummary'
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
}: {
  readonly addContactRequestId: number
}): React.ReactElement {
  const {t} = useTranslation()
  const {
    areThereAnyContactsToDisplayForSelectedTabAtom,
    contactsToDisplayCountAtom,
    searchTextAtom,
    isBulkSelectionPreparingAtom,
    isContactsSearchPreparingAtom,
    newContactsToDisplayCountAtom,
    shouldShowContactImportProgressDialogAtom,
  } = useMolecule(contactSelectMolecule)
  const normalizedContacts = useContactListSelectLifecycle()
  const isBulkSelectionPreparing = useAtomValue(isBulkSelectionPreparingAtom)
  const isContactsSearchPreparing = useAtomValue(isContactsSearchPreparingAtom)
  const newContactsToDisplayCount = useAtomValue(newContactsToDisplayCountAtom)
  const contactsToDisplayCount = useAtomValue(contactsToDisplayCountAtom)
  const searchText = useAtomValue(searchTextAtom)
  const shouldShowContactImportProgressDialog = useAtomValue(
    shouldShowContactImportProgressDialogAtom
  )
  const areThereAnyContactsToDisplayForSelectedTab = useAtomValue(
    areThereAnyContactsToDisplayForSelectedTabAtom
  )
  const {selectedFilter, setSelectedFilter} = usePreparedContactsFilter()
  const {isSubmittingContacts, submitSelectedContacts} =
    useSubmitSelectedContacts()
  const submitBarHeightRef = React.useRef(0)
  const [submitBarHeight, setSubmitBarHeight] = React.useState(0)
  const handleSubmitBarLayout = React.useCallback((e: LayoutChangeEvent) => {
    const measuredSubmitBarHeight = e.nativeEvent.layout.height
    if (submitBarHeightRef.current === measuredSubmitBarHeight) return

    submitBarHeightRef.current = measuredSubmitBarHeight
    setSubmitBarHeight(measuredSubmitBarHeight)
  }, [])
  const shouldShowSubmitBar = areThereAnyContactsToDisplayForSelectedTab
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
        label: t('postLoginFlow.contactsList.unused'),
        value: 'nonSubmitted',
      },
    ],
    [newContactsToDisplayCount, t]
  )
  const contactsFilters = useMemo(
    () =>
      pipe(
        contactsFilterItems,
        Array.map((item) => item.value)
      ),
    [contactsFilterItems]
  )

  if (shouldShowEmptyContactsState) {
    return <ContactsListEmpty variant="emptyContacts" />
  }

  const shouldShowSubmittingContactsOverlay =
    isSubmittingContacts && !shouldShowContactImportProgressDialog
  const showUsageMeter = selectedFilter === 'all' && searchText.length === 0

  return (
    <BulkSelectionProvider>
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
            {!showUsageMeter ? (
              <XStack
                alignItems="center"
                justifyContent="space-between"
                px="$1"
              >
                <Typography variant="description" color="$foregroundSecondary">
                  {t('account.contactsCount', {count: contactsToDisplayCount})}
                </Typography>
                <BulkSelectionButton />
              </XStack>
            ) : null}
            <ContactsAccessPrivilegesInfoBanner />
          </Stack>
          {/* Deliberately NOT wrapped in DismissKeyboardOnPressOutside: the
            TouchableWithoutFeedback injects JS-responder handlers into the
            list's parent, and on RN 0.86/Fabric the responder handoff blocks
            the ScrollView's drag gesture entirely (list refuses to scroll).
            Keyboard dismissal is handled by the FlashList itself via
            keyboardDismissMode/keyboardShouldPersistTaps in ContactsList. */}
          <Stack f={1} pos="relative">
            <FilteredContacts
              filters={contactsFilters}
              onFilterChange={setSelectedFilter}
              keyboardBottomSpacerHeight={keyboardBottomSpacerHeight}
            />
            <PreparingContactsOverlay
              visible={isContactsSearchPreparing || isBulkSelectionPreparing}
              zIndex={10}
            />
          </Stack>
        </Stack>
        {/* Keep the footer measured and list viewports stable across empty tabs. */}
        <KeyboardStickyView
          style={{position: 'absolute', left: 0, right: 0, bottom: 0}}
        >
          <Stack
            px="$5"
            py="$4"
            gap="$3"
            onLayout={handleSubmitBarLayout}
            opacity={shouldShowSubmitBar ? 1 : 0}
            pointerEvents={shouldShowSubmitBar ? 'auto' : 'none'}
            aria-hidden={!shouldShowSubmitBar}
            importantForAccessibility={
              shouldShowSubmitBar ? 'auto' : 'no-hide-descendants'
            }
          >
            <ContactLossSummary />
            <Button
              disabled={isSubmittingContacts || isBulkSelectionPreparing}
              onPress={submitSelectedContacts}
            >
              {t('common.submit')}
            </Button>
          </Stack>
        </KeyboardStickyView>
        <PreparingContactsOverlay
          labelKey="contacts.processingContacts"
          visible={shouldShowSubmittingContactsOverlay}
          zIndex={20}
        />
      </Stack>
    </BulkSelectionProvider>
  )
}

export default function ContactListWithLoadStep({
  addContactRequestId,
}: {
  readonly addContactRequestId: number
}): React.ReactElement {
  return <ContactsListSelect addContactRequestId={addContactRequestId} />
}
