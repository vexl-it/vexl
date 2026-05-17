import {Typography} from '@vexl-next/ui'
import type Luxon from 'luxon'
import React, {useEffect, useState} from 'react'

type TypographyProps = React.ComponentProps<typeof Typography>

interface Props
  extends Omit<TypographyProps, 'children' | 'color' | 'variant'> {
  countUntil: Luxon.DateTime
  onFinished: () => void
  color?: TypographyProps['color']
}

function Countdown({
  countUntil,
  onFinished,
  color = '$foregroundPrimary',
  ...props
}: Props): React.ReactElement {
  const [secLeft, setSecLeft] = useState(
    Math.floor(countUntil.diffNow().as('seconds'))
  )

  useEffect(() => {
    const interval = setInterval(() => {
      const newSecLeft = Math.floor(countUntil.diffNow().as('seconds'))
      setSecLeft(newSecLeft)
      if (newSecLeft <= 0) {
        onFinished()
        clearInterval(interval)
      }
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [setSecLeft, countUntil, onFinished])

  return (
    <Typography variant="paragraphSmall" color={color} {...props}>
      {secLeft}
    </Typography>
  )
}

export default Countdown
