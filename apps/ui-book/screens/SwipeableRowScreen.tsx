import {
  ArchiveInbox,
  NotificationCard,
  SelectableItem,
  Stack,
  StarFilled,
  SwipeableRow,
  SwipeAction,
  TagLabel,
  TrashBin,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [lastAction, setLastAction] = useState('none')

  return (
    <YStack gap="$4">
      <Typography variant="micro" color="$foregroundSecondary">
        SwipeAction variants
      </Typography>
      <XStack gap="$2" height="$13">
        <SwipeAction
          icon={TrashBin}
          label="Delete"
          variant="destructive"
          onPress={() => {}}
        />
        <SwipeAction
          icon={TagLabel}
          label="Tags"
          variant="success"
          onPress={() => {}}
        />
        <SwipeAction
          icon={StarFilled}
          label="Favourite"
          variant="accent"
          rounded
          onPress={() => {}}
        />
        <SwipeAction
          icon={ArchiveInbox}
          label="Archive"
          variant="neutral"
          rounded
          onPress={() => {}}
        />
      </XStack>

      <Typography variant="micro" color="$foregroundSecondary">
        Flush row (swipe both ways)
      </Typography>
      <SwipeableRow
        leftAction={{
          icon: TagLabel,
          label: 'Tags',
          variant: 'success',
          onPress: () => {
            setLastAction('tags')
          },
        }}
        rightAction={{
          icon: TrashBin,
          label: 'Delete',
          variant: 'destructive',
          onPress: () => {
            setLastAction('delete')
          },
        }}
      >
        <Stack backgroundColor="$backgroundPrimary">
          <SelectableItem
            label="Swipe me"
            selected={false}
            onPress={() => {}}
          />
        </Stack>
      </SwipeableRow>

      <Typography variant="micro" color="$foregroundSecondary">
        Rounded card row (swipe left)
      </Typography>
      <SwipeableRow
        rounded
        rightAction={{
          icon: TrashBin,
          label: 'Delete',
          variant: 'destructive',
          onPress: () => {
            setLastAction('delete card')
          },
        }}
      >
        <Stack backgroundColor="$backgroundPrimary" borderRadius="$5">
          <NotificationCard
            avatar={null}
            name="Vexl"
            time="12:00"
            category="Club"
            message="Swipe this card to the left."
          />
        </Stack>
      </SwipeableRow>

      <Typography variant="micro" color="$foregroundTertiary">
        Last action: {lastAction}
      </Typography>
    </YStack>
  )
}

export function SwipeableRowScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Swipeable Row" demos={Demos} />
}
