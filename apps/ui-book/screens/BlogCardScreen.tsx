import {BlogCard, YStack} from '@vexl-next/ui'
import React from 'react'
import {Image} from 'react-native'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const testBlogUri = Image.resolveAssetSource(
  require('../assets/testBlog.png')
).uri

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <BlogCard
        imageUri={testBlogUri}
        title="Why Vexl doesn't rate offers or users"
        description="How do you create compelling presentations that wow your colleagues and impress your managers?"
        date="July 23, 2025"
      />
      <BlogCard
        imageUri={testBlogUri}
        title="How to buy Bitcoin without KYC"
        description="A short guide on buying Bitcoin peer-to-peer while keeping your privacy intact."
        date="June 15, 2025"
        onPress={() => {}}
      />
      <BlogCard
        title="Without image (placeholder)"
        description="Articles without a main image show an empty placeholder."
        date="May 2, 2025"
      />
    </YStack>
  )
}

export function BlogCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Blog Card" demos={Demos} />
}
