import {FlashList} from '@shopify/flash-list'
import {type Atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {Stack, Text, YStack} from 'tamagui'
import atomKeyExtractor from '../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {toCommonErrorMessage} from '../../../../utils/useCommonErrorMessages'
import Button from '../../../Button'
import VexlActivityIndicator from '../../../LoadingOverlayProvider/VexlActivityIndicator'
import EventItem from './components/EventItem'
import {
  areThereEventsToShowAtom,
  eventsForListAtomsAtom,
  eventsLoadingAtom,
  eventsLoadingErrorAtom,
  type ListData,
  refreshEventsActionAtom,
  stickyHeadersIndiciesAtom,
} from './state'

function renderItem({
  item: itemAtom,
}: {
  item: Atom<ListData>
}): React.ReactElement {
  return <EventItem atom={itemAtom} />
}

export default function EventsScreen(): React.ReactElement {
  const eventsLoading = useAtomValue(eventsLoadingAtom)
  const areThereEventsToShow = useAtomValue(areThereEventsToShowAtom)
  const loadEvents = useSetAtom(refreshEventsActionAtom)
  const listDataAtoms = useAtomValue(eventsForListAtomsAtom)
  const stickyHeadersIndicies = useAtomValue(stickyHeadersIndiciesAtom)
  const error = useAtomValue(eventsLoadingErrorAtom)
  const {t} = useTranslation()

  useEffect(loadEvents, [loadEvents])

  return (
    <YStack f={1} mx="$4" mt="$5">
      {!!eventsLoading && !areThereEventsToShow && (
        <Stack my="$5">
          <VexlActivityIndicator size="large" bc="$main" />
        </Stack>
      )}

      {!!error && (
        <YStack alignItems="flex-start" mb="$3">
          <Text ff="$body500" fontSize={18}>
            {t('events.errorLoadingEvents')}
          </Text>
          <Text color="white">{toCommonErrorMessage(error, t)}</Text>
          <Button
            size="small"
            variant="primary"
            text={t('common.tryAgain')}
            onPress={loadEvents}
          />
        </YStack>
      )}

      {!!areThereEventsToShow && (
        <FlashList
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={stickyHeadersIndicies}
          estimatedItemSize={112}
          data={listDataAtoms}
          keyExtractor={atomKeyExtractor}
          renderItem={renderItem}
        />
      )}
    </YStack>
  )
}
