import {
  ChatBubbles,
  EmptyState,
  MyDonationsEmptyStateGraphic,
  PlusAdd,
  Typography,
  YStack,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const noop = (): void => {}

function Label({children}: {readonly children: string}): React.JSX.Element {
  return (
    <Typography variant="description" color="$foregroundSecondary">
      {children}
    </Typography>
  )
}

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <Label>Title + description + action</Label>
      <EmptyState
        title="No offers yet"
        description="Create your first offer and share it with your network."
        action={{label: 'Create offer', onPress: noop, icon: PlusAdd}}
      />

      <Label>With secondary action</Label>
      <EmptyState
        title="Nothing here"
        description="Import contacts to see offers from your friends."
        action={{label: 'Import contacts', onPress: noop}}
        secondaryAction={{label: 'Learn more', onPress: noop}}
      />

      <Label>With graphic</Label>
      <EmptyState
        graphic={<MyDonationsEmptyStateGraphic width={160} height={160} />}
        title="No donations yet"
        description="Your donations will appear here."
      />

      <Label>With icon</Label>
      <EmptyState
        icon={ChatBubbles}
        title="No chats"
        description="Start a conversation from an offer."
      />

      <Label>Framed</Label>
      <EmptyState
        framed
        title="No results"
        description="Try a different search."
        action={{label: 'Clear search', onPress: noop}}
      />

      <Label>Description only</Label>
      <EmptyState description="Nothing to show here." />

      <Label>Fullscreen (inside a fixed-height box)</Label>
      <YStack
        height={360}
        borderRadius="$4"
        borderWidth={1}
        borderColor="$backgroundTertiary"
        paddingHorizontal="$5"
      >
        <EmptyState
          fullscreen
          icon={ChatBubbles}
          title="No chats yet"
          description="When you reach out to an offer, the chat shows up here."
          action={{label: 'Browse offers', onPress: noop, variant: 'primary'}}
        />
      </YStack>
    </YStack>
  )
}

export function EmptyStateScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Empty State" demos={Demos} />
}
