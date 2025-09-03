import {type SpokenLanguage} from '@vexl-next/domain/src/general/offers'
import {useAtomValue, useSetAtom, type Atom, type WritableAtom} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import SelectableCell from '../../../SelectableCell'

interface Props {
  spokenLanguageAtom: Atom<SpokenLanguage>
  removeSpokenLanguageActionAtom: WritableAtom<
    null,
    [spokenLanguage: SpokenLanguage],
    void
  >
}

function OfferFormSpokenLanguageCell({
  spokenLanguageAtom,
  removeSpokenLanguageActionAtom,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const spokenLanguage = useAtomValue(spokenLanguageAtom)
  const removeSpokenLanguage = useSetAtom(removeSpokenLanguageActionAtom)

  return (
    <SelectableCell
      selected
      onPress={removeSpokenLanguage}
      size="small"
      title={t(`offerForm.spokenLanguages.${spokenLanguage}`)}
      type={spokenLanguage}
    />
  )
}

export default OfferFormSpokenLanguageCell
