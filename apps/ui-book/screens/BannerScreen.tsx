import {Banner, Button, Image, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const testBannerSource = require('../assets/testBanner.png') as number

function BannerImage(): React.JSX.Element {
  return (
    <Image
      source={testBannerSource}
      width="100%"
      height={98}
      borderRadius="$3"
      objectFit="cover"
    />
  )
}

function DismissibleDemo(): React.JSX.Element {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <Button
        size="small"
        variant="secondary"
        onPress={() => {
          setVisible(true)
        }}
      >
        Show again
      </Button>
    )
  }

  return (
    <Banner
      dismissible
      color="pink"
      title="Create your first offer"
      description="The banner slides away before the action runs."
      primaryButton={{
        label: 'Create',
        onPress: () => {
          setVisible(false)
        },
      }}
      secondaryButton={{
        label: 'Dismiss',
        onPress: () => {
          setVisible(false)
        },
      }}
    />
  )
}

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <DemoSection title="Green with image">
        <Banner
          color="green"
          title="Title"
          description="Description text goes here with more details about the banner."
          image={<BannerImage />}
          primaryButton={{label: 'Label 1'}}
          secondaryButton={{label: 'Label 2'}}
        />
      </DemoSection>

      <DemoSection title="Pink with image">
        <Banner
          color="pink"
          title="Title"
          description="Description text goes here with more details about the banner."
          image={<BannerImage />}
          primaryButton={{label: 'Label 1'}}
          secondaryButton={{label: 'Label 2'}}
        />
      </DemoSection>

      <DemoSection title="Green without image">
        <Banner
          color="green"
          title="Give love"
          description="Like Vexl? Help us improve it. Donate some sound money."
          primaryButton={{label: 'Donate'}}
        />
      </DemoSection>

      <DemoSection title="Pink without image">
        <Banner
          color="pink"
          title="Give love"
          description="Like Vexl? Help us improve it. Donate some sound money."
          primaryButton={{label: 'Donate'}}
        />
      </DemoSection>

      <DemoSection title="Dismissible (press a button)">
        <DismissibleDemo />
      </DemoSection>
    </YStack>
  )
}

export function BannerScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Banner" demos={Demos} />
}
