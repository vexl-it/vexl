import type Luxon from 'luxon'
import {useEffect, useState} from 'react'
import Text, {type Props as TextProps} from '../../../../Text'
interface Props extends TextProps {
  countUntil: Luxon.DateTime
  onFinished: () => void
}

function Countdown({countUntil, onFinished, ...props}: Props): JSX.Element {
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

  return <Text {...props}>{secLeft}</Text>
}

export default Countdown
