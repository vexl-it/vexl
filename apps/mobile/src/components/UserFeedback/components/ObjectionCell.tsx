import {type ObjectionType} from '@vexl-next/domain/src/general/feedback'
import {Stack, Typography} from '@vexl-next/ui'
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
    <Stack
      onPress={() => {
        select(!isSelected)
      }}
      p="$4"
      py="$3"
      br="$5"
      bc={isSelected ? '$accentYellowSecondary' : '$backgroundTertiary'}
    >
      <Typography
        lineHeight="100%"
        variant="descriptionBold"
        color={isSelected ? '$accentHighlightPrimary' : '$foregroundPrimary'}
      >
        {t(`feedback.objection.${objection}`)}
      </Typography>
    </Stack>
  )
}

export default ObjectionCell
