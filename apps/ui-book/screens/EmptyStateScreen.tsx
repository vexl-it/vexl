import {
  ChatBubbles,
  EmptyState,
  MyDonationsEmptyStateGraphic,
  PlusAdd,
  YStack,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const noop = (): void => {}

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Title + description + action">
        <EmptyState
          title="No offers yet"
          description="Create your first offer and share it with your network."
          action={{label: 'Create offer', onPress: noop, icon: PlusAdd}}
        />
      </DemoSection>

      <DemoSection title="With secondary action">
        <EmptyState
          title="Nothing here"
          description="Import contacts to see offers from your friends."
          action={{label: 'Import contacts', onPress: noop}}
          secondaryAction={{label: 'Learn more', onPress: noop}}
        />
      </DemoSection>

      <DemoSection title="With graphic">
        <EmptyState
          graphic={<MyDonationsEmptyStateGraphic width={160} height={160} />}
          title="No donations yet"
          description="Your donations will appear here."
        />
      </DemoSection>

      <DemoSection title="With icon">
        <EmptyState
          icon={ChatBubbles}
          title="No chats"
          description="Start a conversation from an offer."
        />
      </DemoSection>

      <DemoSection title="Framed">
        <EmptyState
          framed
          title="No results"
          description="Try a different search."
          action={{label: 'Clear search', onPress: noop}}
        />
      </DemoSection>

      <DemoSection title="Description only">
        <EmptyState description="Nothing to show here." />
      </DemoSection>

      <DemoSection title="Fullscreen (inside a fixed-height box)">
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
      </DemoSection>
    </>
  )
}

export function EmptyStateScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Empty State" demos={Demos} />
}
