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
} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [lastAction, setLastAction] = useState('none')

  return (
    <>
      <DemoSection title="SwipeAction variants">
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
      </DemoSection>
      <DemoSection title="Flush row (swipe both ways)">
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
      </DemoSection>
      <DemoSection title="Rounded card row (swipe left)">
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
      </DemoSection>
      <Typography variant="micro" color="$foregroundTertiary">
        Last action: {lastAction}
      </Typography>
    </>
  )
}

export function SwipeableRowScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Swipeable Row" demos={Demos} />
}
