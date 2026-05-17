import {Stack, Typography} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, type Atom} from 'jotai'
import React, {useMemo} from 'react'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'

function IsNewIndicator({
  contactAtom,
}: {
  contactAtom: Atom<StoredContactWithComputedValues>
}): React.ReactElement | null {
  const {t} = useTranslation()
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
      r={-13}
      t={-10}
      p="$1"
      br={5}
      zi="$10"
      bc="$accentYellowPrimary"
    >
      <Typography variant="micro" color="$accentHighlightPrimary">
        {t('postLoginFlow.contactsList.new')}
      </Typography>
    </Stack>
  ) : null
}

export default IsNewIndicator
