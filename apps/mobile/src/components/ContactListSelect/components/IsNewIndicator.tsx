import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, type Atom} from 'jotai'
import {useMemo} from 'react'
import {Stack} from 'tamagui'
import {type ContactNormalized} from '../../../state/contacts/domain'
import {contactSelectMolecule} from '../atom'

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
