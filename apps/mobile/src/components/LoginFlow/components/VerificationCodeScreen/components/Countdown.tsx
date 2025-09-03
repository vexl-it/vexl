import type Luxon from 'luxon'
import React, {useEffect, useState} from 'react'
import {Text, type TextProps} from 'tamagui'

interface Props extends TextProps {
  countUntil: Luxon.DateTime
  onFinished: () => void
}

function Countdown({
  countUntil,
  onFinished,
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
    <Text col="$black" ff="$body500" {...props}>
      {secLeft}
    </Text>
  )
}

export default Countdown
