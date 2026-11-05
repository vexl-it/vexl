import {
  Avatar,
  Button,
  Dialog,
  TrustedFriendExplanation,
  Typography,
  UserImagePlaceholder,
} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const placeholderAvatar = (
  <Avatar customSize={44}>
    <UserImagePlaceholder size={44} />
  </Avatar>
)

function Example({
  role,
  german = false,
}: {
  readonly role: string
  readonly german?: boolean
}): React.JSX.Element {
  return (
    <TrustedFriendExplanation
      you={{label: 'You', avatar: placeholderAvatar}}
      trustedFriend={{
        label: 'Jana',
        avatar: {children: <UserImagePlaceholder size={44} />},
      }}
      otherSide={{label: role, avatar: placeholderAvatar}}
      caption={
        german
          ? 'Du und die andere Person habt Jana beide in euren Kontakten gespeichert, und Jana hat euch ebenfalls beide in ihren Kontakten gespeichert.'
          : `You and the ${role.toLowerCase()} both have Jana in your contacts, and Jana has you both in theirs.`
      }
      commonFriendTitle="Common friend"
      commonFriendDescription={`You and the ${role.toLowerCase()} both have them in your contacts.`}
      trustedFriendTitle="Trusted friend"
      trustedFriendDescription="A common friend who also uses Vexl and has you both in their contacts."
      caution="Be cautious; we can't verify whether you really know each other in real life."
    />
  )
}

function Demos(): React.JSX.Element {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <DemoSection title="Seller">
        <Example role="Seller" />
      </DemoSection>
      <DemoSection title="Buyer">
        <Example role="Buyer" />
      </DemoSection>
      <DemoSection title="Other person (long German caption)">
        <Example role="Other person" german />
      </DemoSection>
      <DemoSection title="In a dialog">
        <Button
          onPress={() => {
            setVisible(true)
          }}
        >
          Open dialog
        </Button>
      </DemoSection>
      <Dialog
        visible={visible}
        onClose={() => {
          setVisible(false)
        }}
        footer={
          <Button
            flex={1}
            onPress={() => {
              setVisible(false)
            }}
          >
            Got it
          </Button>
        }
      >
        <Typography variant="titlesSmall" color="$foregroundPrimary">
          What&apos;s a trusted friend?
        </Typography>
        <Example role="Seller" />
      </Dialog>
    </>
  )
}

export function TrustedFriendExplanationScreen(): React.JSX.Element {
  return (
    <ComponentScreenLayout title="Trusted Friend Explanation" demos={Demos} />
  )
}
