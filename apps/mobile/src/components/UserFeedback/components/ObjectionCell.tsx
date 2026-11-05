import {type ObjectionType} from '@vexl-next/domain/src/general/feedback'
import {FilterTag} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom} from 'jotai'
import React, {useMemo} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {feedbackMolecule} from '../atoms'

interface Props {
  objection: ObjectionType
}

function ObjectionCell({objection}: Props): React.ReactElement {
  const {t} = useTranslation()
  const {createIsObjectionSelectedAtom} = useMolecule(feedbackMolecule)

  const [isSelected, select] = useAtom(
    useMemo(
      () => createIsObjectionSelectedAtom(objection),
      [createIsObjectionSelectedAtom, objection]
    )
  )

  return (
    <FilterTag
      label={t(`feedback.objection.${objection}`)}
      selected={isSelected}
      backgroundColor={
        isSelected ? '$accentYellowSecondary' : '$backgroundTertiary'
      }
      onPress={() => {
        select(!isSelected)
      }}
    />
  )
}

export default ObjectionCell
