import {type LocationState} from '@vexl-next/domain/src/general/offers'
import {useMemo} from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {type TabProps} from '../../../Tabs'

export default function useContent(): Array<TabProps<LocationState>> {
  const {t} = useTranslation()

  return useMemo(
    () => [
      {
        testID: 'loation-IN_PERSON',
        title: t('offerForm.inPerson'),
        type: 'IN_PERSON',
      },
      {
        testID: 'location-ONLINE',
        title: t('offerForm.online'),
        type: 'ONLINE',
      },
    ],
    [t]
  )
}
