import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {type Atom, useAtomValue, useSetAtom} from 'jotai'
import SelectableCell from '../../../SelectableCell'
import {type SpokenLanguage} from '@vexl-next/domain/dist/general/offers'
import {removeSpokenLanguageActionAtom} from '../../atom'

interface Props {
  spokenLanguageAtom: Atom<SpokenLanguage>
}

function OfferFormSpokenLanguageCell({spokenLanguageAtom}: Props): JSX.Element {
  const {t} = useTranslation()
  const spokenLanguage = useAtomValue(spokenLanguageAtom)
  const removeSpokenLanguage = useSetAtom(removeSpokenLanguageActionAtom)

  return (
    <SelectableCell
      selected
      onPress={removeSpokenLanguage}
      size={'small'}
      title={t(`offerForm.spokenLanguages.${spokenLanguage}`)}
      type={spokenLanguage}
    />
  )
}

export default OfferFormSpokenLanguageCell
