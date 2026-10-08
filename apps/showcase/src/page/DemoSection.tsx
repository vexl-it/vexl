import {SegmentedPicker, Typography, YStack} from '@vexl-next/ui'
import {useState} from 'react'
import {identityRevealDemo} from '../demos/identityReveal/identityRevealDemo'
import {DemoPlayer, type Demo} from '../demos/shared/DemoPlayer'
import {tradeDemo} from '../demos/trade/tradeDemo'

type DemoId = 'trade' | 'identityReveal'

const demos: Record<
  DemoId,
  {label: string; title: string; text: string; demo: Demo}
> = {
  trade: {
    label: 'Trade',
    title: 'From offer to meetup',
    text: 'You post an offer to sell bitcoin for cash. A friend of a friend asks for it, you accept, and together you agree on when to meet and how much.',
    demo: tradeDemo,
  },
  identityReveal: {
    label: 'Identity reveal',
    title: 'Stay anonymous until you both say yes',
    text: 'When it’s time to meet, reveal your nickname and photo, but only if they reveal theirs too.',
    demo: identityRevealDemo,
  },
}

export function DemoSection(): React.JSX.Element {
  const [active, setActive] = useState<DemoId>('trade')
  const {title, text, demo} = demos[active]
  return (
    <section className="page-demo page-width" aria-label="Demos">
      <div className="page-demo-switcher">
        <SegmentedPicker
          tabs={[
            {label: demos.trade.label, value: 'trade'},
            {label: demos.identityReveal.label, value: 'identityReveal'},
          ]}
          activeTab={active}
          onTabPress={setActive}
        />
      </div>
      <YStack gap="$3" className="page-demo-intro">
        <h2 className="page-title">
          <Typography variant="heading3" color="$foregroundPrimary">
            {title}
          </Typography>
        </h2>
        <Typography variant="paragraph" color="$foregroundSecondary">
          {text}
        </Typography>
      </YStack>
      <DemoPlayer key={active} demo={demo} />
    </section>
  )
}
