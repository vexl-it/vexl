import {type DateTime} from 'luxon'
import {useEffect, useState} from 'react'
import {useNavigation} from '@react-navigation/native'
import {
  i18n,
  type TFunction,
  useTranslation,
} from '../utils/localization/I18nProvider'

function whenShouldIUpdateNext(difNowSec: number): number | null {
  if (difNowSec < 60 * 60) {
    return 1000 * 60
  }

  return null
}

function getTimeToShow(date: DateTime, t: TFunction): string {
  if (Math.abs(date.diffNow(['seconds']).seconds) < 60) {
    return t('common.now')
  }
  return date.toRelative({style: 'narrow', locale: i18n.locale}) ?? ''
}

function FromNowComponent({date}: {date: DateTime}): JSX.Element {
  const [toShow, setToShow] = useState('')
  const {t} = useTranslation()
  const navigation = useNavigation()

  useEffect(() => {
    const targetDate = date

    let timeoutId: NodeJS.Timeout | null = null

    setToShow(getTimeToShow(targetDate, t))

    function setupUpdate(): void {
      timeoutId && clearTimeout(timeoutId)
      setToShow(getTimeToShow(targetDate, t))

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
  }, [date, navigation, setToShow, t])

  return <>{toShow}</>
}

export default FromNowComponent
