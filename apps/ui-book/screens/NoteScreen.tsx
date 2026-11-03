import {Avatar, avatarsSvg, Note} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const testAvatarSource = require('../assets/testAvatar.png') as number

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const AnonymousAvatar = avatarsSvg[0]!

function PngAvatar(): React.JSX.Element {
  return <Avatar source={testAvatarSource} size="small" customSize={36} />
}

function SvgAvatar(): React.JSX.Element {
  return (
    <Avatar size="small" customSize={36}>
      <AnonymousAvatar size={36} />
    </Avatar>
  )
}

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="PNG avatar">
        <Note
          avatar={<PngAvatar />}
          name="Direct friend"
          commonFriends="10 common friends"
          expiration="expires in 3 days"
          message="Looking for someone in Brno who's into crypto and coffee."
        />
      </DemoSection>

      <DemoSection title="SVG anonymous avatar">
        <Note
          avatar={<SvgAvatar />}
          name="Friend of friend"
          commonFriends="3 common friends"
          expiration="expires in 5 days"
          message="Selling 0.05 BTC for cash in Prague. DM me if interested!"
        />
      </DemoSection>

      <DemoSection title="Trusted">
        <Note
          avatar={<SvgAvatar />}
          name="Friend of friend"
          commonFriends="5 common friends"
          trustedFriends="2 trusted"
          expiration="18 h"
          message="Looking to buy sats in Prague."
        />
      </DemoSection>

      <DemoSection title="Pressable">
        <Note
          avatar={<SvgAvatar />}
          name="Friend of friend"
          commonFriends="5 common friends"
          expiration="expires in 1 day"
          message="Looking to buy sats with Revolut. Quick and easy trade preferred."
          onPress={() => {}}
        />
      </DemoSection>

      <DemoSection title="Preview variant">
        <Note
          variant="preview"
          avatar={<SvgAvatar />}
          name="Friend of friend"
          commonFriends="5 common friends"
          expiration="expires in 1 day"
          message="Looking to buy sats with Revolut. Quick and easy trade preferred."
        />
      </DemoSection>
    </>
  )
}

export function NoteScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Note" demos={Demos} />
}
