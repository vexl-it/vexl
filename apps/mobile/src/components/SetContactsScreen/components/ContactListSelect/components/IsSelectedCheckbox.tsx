import {CheckboxFilled, SquareOutline, Stack, useTheme} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, type Atom} from 'jotai'
import React, {useMemo} from 'react'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {contactSelectMolecule} from '../atom'

function IsSelectedCheckbox({
  contactAtom,
}: {
  contactAtom: Atom<StoredContactWithComputedValues>
}): React.ReactElement {
  const {createSelectContactAtom} = useMolecule(contactSelectMolecule)

  const [isSelected, select] = useAtom(
    useMemo(
      () => createSelectContactAtom(contactAtom),
      [contactAtom, createSelectContactAtom]
    )
  )

  const theme = useTheme()
  const iconColor = isSelected
    ? theme.accentHighlightSecondary.get()
    : theme.foregroundPrimary.get()

  return (
    <Stack
      role="button"
      alignItems="center"
      justifyContent="center"
      width={32}
      height={32}
      onPress={() => {
        select(!isSelected)
      }}
      pressStyle={{opacity: 0.7}}
    >
      {isSelected ? (
        <CheckboxFilled size={24} color={iconColor} />
      ) : (
        <SquareOutline size={24} color={iconColor} />
      )}
    </Stack>
  )
}

export default IsSelectedCheckbox
