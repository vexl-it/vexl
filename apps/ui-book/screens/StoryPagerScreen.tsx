import {
  FaqNoRatings,
  FaqStayAnonymous,
  FaqWhatIsVexl,
  StoryPager,
  Typography,
  YStack,
  type StoryPage,
} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const pages: readonly StoryPage[] = [
  {
    graphic: FaqWhatIsVexl,
    title: 'What is Vexl?',
    text: 'Tap the right half to go forward and the left half to go back.',
  },
  {
    graphic: FaqStayAnonymous,
    title: 'Stay anonymous',
    text: 'Tap a progress segment to jump straight to that page.',
  },
  {
    graphic: FaqNoRatings,
    title: 'No ratings',
    text: 'The last page swaps Next for the finish label.',
  },
]

function Demos(): React.JSX.Element {
  const [finishedCount, setFinishedCount] = useState(0)

  return (
    <YStack gap="$3">
      <YStack height={560}>
        <StoryPager
          pages={pages}
          backLabel="Back"
          nextLabel="Next"
          finishLabel="Done"
          onFinish={() => {
            setFinishedCount((count) => count + 1)
          }}
        />
      </YStack>
      <Typography variant="micro" color="$foregroundTertiary">
        Finished {finishedCount}×
      </Typography>
    </YStack>
  )
}

export function StoryPagerScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Story Pager" demos={Demos} />
}
