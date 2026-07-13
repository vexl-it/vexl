import {FlashList} from '@shopify/flash-list'
import {
  Button,
  ChevronLeft,
  NavigationBar,
  Screen,
  Separator,
  Stack,
  Typography,
} from '@vexl-next/ui'
import {Array, Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {exportVexlOnlyContactsActionAtom} from '../../state/contacts/atom/exportVexlOnlyContactsActionAtom'
import {
  refreshDeviceContactsSnapshotActionAtom,
  vexlOnlyContactsAtom,
} from '../../state/contacts/atom/vexlOnlyContactsAtoms'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {useOnFocusAndAppState} from '../../utils/useFocusAndAppState'
import useSafeGoBack from '../../utils/useSafeGoBack'
import VexlOnlyContactItem from './components/VexlOnlyContactItem'

function renderItem({
  item,
}: {
  item: StoredContactWithComputedValues
}): React.ReactElement {
  return <VexlOnlyContactItem contact={item} />
}

function keyExtractor(item: StoredContactWithComputedValues): string {
  return item.computedValues.normalizedNumber
}

function ItemSeparatorComponent(): React.ReactElement {
  return <Separator borderColor="$backgroundTertiary" />
}

export default function VexlOnlyContactsScreen(): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const vexlOnlyContacts = useAtomValue(vexlOnlyContactsAtom)
  const exportVexlOnlyContacts = useSetAtom(exportVexlOnlyContactsActionAtom)
  const refreshDeviceContactsSnapshot = useSetAtom(
    refreshDeviceContactsSnapshotActionAtom
  )

  useOnFocusAndAppState(
    useCallback(() => {
      Effect.runFork(refreshDeviceContactsSnapshot())
    }, [refreshDeviceContactsSnapshot])
  )

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('vexlOnlyContacts.title')}
          leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
        />
      }
    >
      {Array.isNonEmptyArray(vexlOnlyContacts) ? (
        <Stack f={1} gap="$3">
          <Typography variant="description" color="$foregroundSecondary">
            {t('vexlOnlyContacts.description')}
          </Typography>
          <Typography
            variant="description"
            color="$foregroundSecondary"
            px="$1"
            pt="$2"
          >
            {t('account.contactsCount', {count: vexlOnlyContacts.length})}
          </Typography>
          <Stack f={1}>
            <FlashList
              data={vexlOnlyContacts}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              ItemSeparatorComponent={ItemSeparatorComponent}
              showsVerticalScrollIndicator={false}
            />
          </Stack>
          <Stack py="$4">
            <Button
              onPress={() => {
                Effect.runFork(exportVexlOnlyContacts())
              }}
            >
              {t('vexlOnlyContacts.exportButton')}
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack f={1} pt="$10">
          <Stack width="100%" px="$6" py="$6" gap="$5" alignItems="center">
            <Typography
              width="100%"
              textAlign="center"
              color="$foregroundPrimary"
              variant="heading3"
            >
              {t('vexlOnlyContacts.emptyTitle')}
            </Typography>
            <Typography
              width="100%"
              textAlign="center"
              color="$foregroundSecondary"
              variant="description"
            >
              {t('vexlOnlyContacts.emptyDescription')}
            </Typography>
          </Stack>
        </Stack>
      )}
    </Screen>
  )
}
