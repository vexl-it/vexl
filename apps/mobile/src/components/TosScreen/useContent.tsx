import {useTranslation} from '../../utils/localization/I18nProvider'
import {type TabProps} from '../Tabs'
import {useMemo} from 'react'

export type TabType = 'termsOfUse' | 'privacyPolicy'
export default function useContent(): Array<TabProps<TabType>> {
  const {t} = useTranslation()

  return useMemo(
    () => [
      {
        title: t('termsOfUse.termsOfUse'),
        type: 'termsOfUse',
      },
      {
        title: t('termsOfUse.privacyPolicy'),
        type: 'privacyPolicy',
      },
    ],
    [t]
  )
}
