import {FlashList, type ListRenderItemInfo} from '@shopify/flash-list'
import {InfoBox, Separator, Stack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, pipe} from 'effect'
import {
  atom,
  useAtomValue,
  useSetAtom,
  type Atom,
  type PrimitiveAtom,
} from 'jotai'
import React from 'react'
import {getTokens} from 'tamagui'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'
import ContactItem from './ContactItem'
import ContactReachBanner from './ContactReachBanner'
import ContactsListEmpty, {
  type ContactsListEmptyVariant,
} from './ContactsListEmpty'
import ContactUsageMeter from './ContactUsageMeter'

interface Props {
  readonly contacts: ReadonlyArray<Atom<StoredContactWithComputedValues>>
  readonly keyboardBottomSpacerHeight: number
  readonly showUsageMeter: boolean
  readonly showUnusedExplainer: boolean
  readonly onReviewUnused: () => void
  readonly emptyVariant: ContactsListEmptyVariant
}

type ListItem =
  | {readonly type: 'banner'}
  | {readonly type: 'meter'}
  | {
      readonly type: 'contact'
      readonly contactAtom: Atom<StoredContactWithComputedValues>
    }

function keyExtractor(item: ListItem): string {
  return item.type === 'contact'
    ? atomKeyExtractor(item.contactAtom)
    : item.type
}

function ItemSeparatorComponent({
  leadingItem,
}: {
  readonly leadingItem: ListItem
}): React.ReactElement | null {
  if (leadingItem.type === 'banner') return null
  return <Separator borderColor="$backgroundTertiary" />
}

interface UsageMeterProps {
  readonly isStuckAtom: PrimitiveAtom<boolean>
  readonly onReviewUnused: () => void
}

// FlashList 2.0 keeps the sticky row in the list and draws a copy over it while
// stuck. The copy marks the meter as stuck so the list row hides from
// assistive tech, leaving one meter to read.
function StickyUsageMeter({
  isStuckAtom,
  onReviewUnused,
}: UsageMeterProps): React.ReactElement {
  const setIsStuck = useSetAtom(isStuckAtom)
  React.useEffect(() => {
    setIsStuck(true)
    return () => {
      setIsStuck(false)
    }
  }, [setIsStuck])
  return <ContactUsageMeter onReviewUnused={onReviewUnused} />
}

function ListUsageMeter({
  isStuckAtom,
  onReviewUnused,
}: UsageMeterProps): React.ReactElement {
  const isStuck = useAtomValue(isStuckAtom)
  return (
    <Stack
      aria-hidden={isStuck}
      importantForAccessibility={isStuck ? 'no-hide-descendants' : 'auto'}
    >
      <ContactUsageMeter onReviewUnused={onReviewUnused} />
    </Stack>
  )
}

function ContactsList({
  contacts,
  emptyVariant,
  keyboardBottomSpacerHeight,
  showUsageMeter,
  showUnusedExplainer,
  onReviewUnused,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const hasUsageMeter =
    showUsageMeter && Array.isNonEmptyReadonlyArray(contacts)
  const {nonSubmittedContactsToDisplayCountAtom, offerStatsAtom} = useMolecule(
    contactSelectMolecule
  )
  const nonSubmittedCount = useAtomValue(nonSubmittedContactsToDisplayCountAtom)
  const stats = useAtomValue(offerStatsAtom)
  const hasReachBanner =
    hasUsageMeter && nonSubmittedCount > 0 && stats !== undefined
  const footerSpace = getTokens().space.$5.val
  const data = React.useMemo((): readonly ListItem[] => {
    const items = pipe(
      contacts,
      Array.map((contactAtom): ListItem => ({type: 'contact', contactAtom}))
    )
    if (hasReachBanner) return [{type: 'banner'}, {type: 'meter'}, ...items]
    return hasUsageMeter ? [{type: 'meter'}, ...items] : items
  }, [contacts, hasReachBanner, hasUsageMeter])
  const [isMeterStuckAtom] = React.useState(() => atom(false))
  const renderItem = React.useCallback(
    ({item, target}: ListRenderItemInfo<ListItem>) =>
      item.type === 'banner' ? (
        <ContactReachBanner />
      ) : item.type === 'meter' ? (
        target === 'StickyHeader' ? (
          <StickyUsageMeter
            isStuckAtom={isMeterStuckAtom}
            onReviewUnused={onReviewUnused}
          />
        ) : (
          <ListUsageMeter
            isStuckAtom={isMeterStuckAtom}
            onReviewUnused={onReviewUnused}
          />
        )
      ) : (
        <ContactItem contactAtom={item.contactAtom} />
      ),
    [isMeterStuckAtom, onReviewUnused]
  )
  const listHeaderComponent =
    showUnusedExplainer && Array.isNonEmptyReadonlyArray(contacts) ? (
      <Stack pb="$3">
        <InfoBox>{t('contactPreferences.unusedExplainer')}</InfoBox>
      </Stack>
    ) : null
  const listFooterComponent = React.useCallback(
    () => <Stack h={keyboardBottomSpacerHeight + footerSpace} />,
    [footerSpace, keyboardBottomSpacerHeight]
  )
  const listEmptyComponent = React.useCallback(
    () => <ContactsListEmpty variant={emptyVariant} />,
    [emptyVariant]
  )

  return (
    <Stack f={1}>
      <FlashList
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={listEmptyComponent}
        ListFooterComponent={listFooterComponent}
        ListHeaderComponent={listHeaderComponent}
        // The reach banner is a data row rather than ListHeaderComponent:
        // FlashList measures the header height only when the list re-renders,
        // so a header that resizes by itself would make the meter stick at
        // the wrong scroll position.
        stickyHeaderIndices={
          hasUsageMeter ? [hasReachBanner ? 1 : 0] : undefined
        }
        data={data}
        getItemType={(item) => item.type}
        ItemSeparatorComponent={ItemSeparatorComponent}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        // FlashList v2 enables maintainVisibleContentPosition (scroll
        // anchoring) by default — a documented source of stuck scrolling.
        // This list has no chat-like prepending, so anchoring adds nothing.
        maintainVisibleContentPosition={{disabled: true}}
        // Keyboard dismissal without a touchable wrapper around the list:
        // wrapping scrollables in TouchableWithoutFeedback blocks the drag
        // gesture on RN 0.86/Fabric (JS responder never hands off to the
        // native scroll). Dragging dismisses the keyboard; taps handled by
        // rows go through, taps on empty list area dismiss.
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      />
    </Stack>
  )
}

export default React.memo(ContactsList)
