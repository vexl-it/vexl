import {DetailsCard, KeyValueRow, TextTag} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Standalone">
        <KeyValueRow label="Small (default)" value="0.0042 BTC" />
        <KeyValueRow size="medium" label="Medium" value="0.0042 BTC" />
        <KeyValueRow
          label="Array value"
          value={['Revolut', 'Bank transfer', 'Cash']}
        />
        <KeyValueRow
          label="Truncated"
          value="A very long value that is cut after a single line of text"
          numberOfLines={1}
        />
        <KeyValueRow label="Children value">
          <TextTag variant="neutral" label="Custom" />
        </KeyValueRow>
      </DemoSection>

      <DemoSection title="Inside DetailsCard">
        <DetailsCard>
          <KeyValueRow label="Amount" value="0.0042 BTC" />
          <KeyValueRow label="Price" value="1 250 EUR" />
          <KeyValueRow label="Payment" value={['Revolut', 'Cash']} />
        </DetailsCard>
        <DetailsCard>
          <KeyValueRow size="medium" label="Amount" value="0.0042 BTC" />
          <KeyValueRow size="medium" label="Price" value="1 250 EUR" />
        </DetailsCard>
      </DemoSection>
    </>
  )
}

export function KeyValueRowScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Key Value Row" demos={Demos} />
}
