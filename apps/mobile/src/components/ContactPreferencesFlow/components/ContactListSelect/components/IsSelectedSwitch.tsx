import {Switch} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import {type NormalizedContactValue} from '../../../../../state/contacts/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'

function IsSelectedSwitch({
  contactValue,
}: {
  readonly contactValue: NormalizedContactValue
}): React.ReactElement {
  const {t} = useTranslation()
  const {selectContactAtom} = useMolecule(contactSelectMolecule)
  const isSelected = useAtomValue(selectContactAtom(contactValue))
  const accessibilityLabel = t(
    isSelected
      ? 'postLoginFlow.contactsList.deactivateContact'
      : 'postLoginFlow.contactsList.activateContact'
  )

  return (
    <Switch
      testID="@contactItem/select"
      accessibilityLabel={accessibilityLabel}
      valueAtom={selectContactAtom(contactValue)}
    />
  )
}

export default IsSelectedSwitch
