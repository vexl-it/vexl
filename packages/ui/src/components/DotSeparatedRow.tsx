import React from 'react'

import {Circle, XStack} from '../primitives'

export type DotSeparatedRowProps = React.ComponentProps<typeof XStack>

export function DotSeparatedRow({
  children,
  ...rest
}: DotSeparatedRowProps): React.JSX.Element {
  return (
    <XStack gap="$2" alignItems="center" {...rest}>
      {React.Children.toArray(children).flatMap((part, index) =>
        index === 0
          ? [part]
          : [
              <Circle
                key={`dot-${String(index)}`}
                size="$2"
                backgroundColor="$foregroundSecondary"
                flexShrink={0}
              />,
              part,
            ]
      )}
    </XStack>
  )
}
