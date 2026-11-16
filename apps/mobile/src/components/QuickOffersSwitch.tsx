import {BoltElectric, MenuItem, Switch} from '@vexl-next/ui'
import {type SetStateAction, type WritableAtom} from 'jotai'
import React from 'react'
import {useTranslation} from '../utils/localization/I18nProvider'

export default function QuickOffersSwitch({
  valueAtom,
}: {
  readonly valueAtom: WritableAtom<boolean, [SetStateAction<boolean>], void>
}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <MenuItem
      label={t('quickOffers.switch.label')}
      note={t('quickOffers.switch.note')}
      icon={BoltElectric}
      showChevron={false}
      tag={<Switch valueAtom={valueAtom} />}
    />
  )
}
