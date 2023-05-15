import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {type TabProps} from '../../../Tabs'
import {type LocationState} from '@vexl-next/domain/dist/general/offers'
import {useMemo} from 'react'

export default function useContent(): Array<TabProps<LocationState>> {
  const {t} = useTranslation()

  return useMemo(
    () => [
      {
        title: t('offerForm.inPerson'),
        type: 'IN_PERSON',
      },
      {
        title: t('offerForm.online'),
        type: 'ONLINE',
      },
    ],
    [t]
  )
}
