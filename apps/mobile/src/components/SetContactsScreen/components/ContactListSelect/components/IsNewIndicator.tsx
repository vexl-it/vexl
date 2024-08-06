import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, type Atom} from 'jotai'
import {useMemo} from 'react'
import {Stack, Text} from 'tamagui'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'

function IsNewIndicator({
  contactAtom,
}: {
  contactAtom: Atom<StoredContactWithComputedValues>
}): JSX.Element | null {
  const {t} = useTranslation()
  const {createIsNewContactAtom} = useMolecule(contactSelectMolecule)

  const isNewContact = useAtomValue(
    useMemo(
      () => createIsNewContactAtom(contactAtom),
      [contactAtom, createIsNewContactAtom]
    )
  )

  return isNewContact ? (
    <Stack pos="absolute" r={-13} t={-10} p="$1" br={5} zi="$10" bc="$main">
      <Text fontSize={10} color="$white">
        {t('postLoginFlow.contactsList.new')}
      </Text>
    </Stack>
  ) : null
}

export default IsNewIndicator
