import {
  Banner,
  BannerCarousel,
  ReachNetworkGraphic,
  StatBanner,
} from '@vexl-next/ui'
import React, {useState} from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [activeKey, setActiveKey] = useState('offers')
  return (
    <BannerCarousel
      activeKey={activeKey}
      onActiveKeyChange={setActiveKey}
      pages={[
        {
          key: 'offers',
          label: 'Offers',
          content: (
            <StatBanner
              color="green"
              fillHeight
              label="Active in Czechia"
              value="1,240 offers"
              description="Your network brings you 31 of them. Add more contacts to grow it and see more offers."
            />
          ),
        },
        {
          key: 'network',
          label: 'Network',
          content: (
            <Banner
              color="neutral"
              fillHeight
              leading={<ReachNetworkGraphic />}
              title="Reach beyond your contacts"
              description="Add a contact so you can also reach the people they know."
            />
          ),
        },
        {
          key: 'reach',
          label: 'Your reach',
          content: (
            <StatBanner
              color="yellow"
              fillHeight
              label="Your reach"
              value="125 people"
              description="can see your offers. Add more contacts for a better chance of a trade."
              onPress={() => {
                Alert.alert('Pressed', 'Your reach')
              }}
            />
          ),
        },
      ]}
    />
  )
}

export function BannerCarouselScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Banner Carousel" demos={Demos} />
}
