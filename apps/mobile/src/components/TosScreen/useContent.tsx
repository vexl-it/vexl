import {useMemo} from 'react'
import {useTranslation} from '../../utils/localization/I18nProvider'

export type TabType = 'termsOfUse' | 'privacyPolicy' | 'childSafety'

export interface TosTab {
  readonly title: string
  readonly type: TabType
}

export default function useContent(): TosTab[] {
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
      {
        title: t('termsOfUse.childSafety'),
        type: 'childSafety',
      },
    ],
    [t]
  )
}
