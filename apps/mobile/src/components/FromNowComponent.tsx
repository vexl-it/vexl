import {type DateTime} from 'luxon'
import i18n from '../utils/localization/i18n'
import {useEffect, useState} from 'react'
import {useNavigation} from '@react-navigation/native'

function whenShouldIUpdateNext(difNowSec: number): number | null {
  if (difNowSec < 60) {
    return 1000
  } else if (difNowSec < 60 * 60) {
    return 1000 * 60
  }

  return null
}

function FromNowComponent({date}: {date: DateTime}): JSX.Element {
  const [toShow, setToShow] = useState('')
  const navigation = useNavigation()

  useEffect(() => {
    const targetDate = date

    let timeoutId: NodeJS.Timeout | null = null

    setToShow(
      targetDate.toRelative({style: 'narrow', locale: i18n.locale}) ?? ''
    )

    function setupUpdate(): void {
      timeoutId && clearTimeout(timeoutId)
      setToShow(
        targetDate.toRelative({style: 'narrow', locale: i18n.locale}) ?? ''
      )
      const nextUpdateIn = whenShouldIUpdateNext(
        Math.abs(targetDate.diffNow(['seconds']).seconds)
      )

      if (nextUpdateIn) {
        timeoutId = setTimeout(() => {
          setupUpdate()
        }, nextUpdateIn)
      }
    }

    setupUpdate()
    const removeFocusListener = navigation.addListener('focus', setupUpdate)

    const removeBlurListener = navigation.addListener('blur', () => {
      timeoutId && clearTimeout(timeoutId)
    })

    return () => {
      removeFocusListener()
      removeBlurListener()
      timeoutId && clearTimeout(timeoutId)
    }
  }, [date, navigation, setToShow])

  return <>{toShow}</>
}

export default FromNowComponent
