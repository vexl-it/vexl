import {type Atom, useAtomValue} from 'jotai'
import {type ContactNormalized} from '../../../state/contacts/domain'
import {useMolecule} from 'bunshi/dist/react'
import {contactSelectMolecule} from '../atom'
import {useMemo} from 'react'
import {Stack} from 'tamagui'

function IsNewIndicator({
  contactAtom,
}: {
  contactAtom: Atom<ContactNormalized>
}): JSX.Element | null {
  const {createIsNewContactAtom} = useMolecule(contactSelectMolecule)

  const isNewContact = useAtomValue(
    useMemo(
      () => createIsNewContactAtom(contactAtom),
      [contactAtom, createIsNewContactAtom]
    )
  )

  return isNewContact ? (
    <Stack
      pos="absolute"
      r={-7}
      t={-7}
      w={15}
      h={15}
      br={15}
      zi="$10"
      bc="$main"
    />
  ) : null
}

export default IsNewIndicator
