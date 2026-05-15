import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {IconButton} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom} from 'jotai'
import React from 'react'
import {contactSelectMolecule} from '../atom'
import AnimatedSelectionCheckboxIcon from './AnimatedSelectionCheckboxIcon'

function IsSelectedCheckbox({
  contactNumber,
}: {
  contactNumber: E164PhoneNumber
}): React.ReactElement {
  const {selectContactAtom} = useMolecule(contactSelectMolecule)

  const [isSelected, select] = useAtom(selectContactAtom(contactNumber))

  return (
    <IconButton
      testID="@contactItem/select"
      backgroundColor="$backgroundTertiary"
      onPress={() => {
        select((value) => !value)
      }}
    >
      <AnimatedSelectionCheckboxIcon selected={isSelected} />
    </IconButton>
  )
}

export default IsSelectedCheckbox
