import {type SpokenLanguage} from '@vexl-next/domain/src/general/offers'
import {FilterTag} from '@vexl-next/ui'
import {useAtom} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {isThisLanguageSelectedAtomFamily} from '../atom'

function SpokenLanguageTag({
  language,
}: {
  language: SpokenLanguage
}): React.ReactElement {
  const {t} = useTranslation()
  const [selected, setSelected] = useAtom(
    isThisLanguageSelectedAtomFamily(language)
  )

  return (
    <FilterTag
      label={t(`offerForm.spokenLanguages.${language}`)}
      selected={selected}
      onPress={() => {
        setSelected((prev) => !prev)
      }}
    />
  )
}

export default SpokenLanguageTag
