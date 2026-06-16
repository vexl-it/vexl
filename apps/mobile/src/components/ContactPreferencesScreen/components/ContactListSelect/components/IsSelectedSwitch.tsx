import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Switch} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'

function IsSelectedSwitch({
  contactNumber,
}: {
  readonly contactNumber: E164PhoneNumber
}): React.ReactElement {
  const {t} = useTranslation()
  const {selectContactAtom} = useMolecule(contactSelectMolecule)
  const isSelected = useAtomValue(selectContactAtom(contactNumber))
  const accessibilityLabel = t(
    isSelected
      ? 'postLoginFlow.contactsList.deactivateContact'
      : 'postLoginFlow.contactsList.activateContact'
  )

  return (
    <Switch
      testID="@contactItem/select"
      accessibilityLabel={accessibilityLabel}
      valueAtom={selectContactAtom(contactNumber)}
    />
  )
}

export default IsSelectedSwitch
