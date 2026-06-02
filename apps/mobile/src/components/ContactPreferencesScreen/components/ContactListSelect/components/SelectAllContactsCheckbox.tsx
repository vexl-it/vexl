import {IconButton} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom} from 'jotai'
import React from 'react'
import {contactSelectMolecule} from '../atom'
import AnimatedSelectionCheckboxIcon from './AnimatedSelectionCheckboxIcon'

function SelectAllContactsCheckbox({
  disabled,
}: {
  readonly disabled: boolean
}): React.ReactElement {
  const {selectAllAtom} = useMolecule(contactSelectMolecule)
  const [allSelected, setAllSelected] = useAtom(selectAllAtom)

  return (
    <IconButton
      disabled={disabled}
      opacity={disabled ? 0.45 : 1}
      testID="@contactsList/selectAll"
      backgroundColor="$backgroundTertiary"
      onPress={() => {
        setAllSelected((value) => !value)
      }}
    >
      <AnimatedSelectionCheckboxIcon selected={allSelected} />
    </IconButton>
  )
}

export default SelectAllContactsCheckbox
