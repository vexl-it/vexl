import {Collapse, ExpandToggle} from '@vexl-next/ui'
import React, {useState, type ReactNode} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'

interface Props {
  readonly changedOptionsCount: number
  readonly children: ReactNode
}

function MoreOptions({
  changedOptionsCount,
  children,
}: Props): React.JSX.Element {
  const {t} = useTranslation()
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <ExpandToggle
        label={
          expanded ? t('offerForm.hideOptions') : t('offerForm.showMoreOptions')
        }
        expanded={expanded}
        count={changedOptionsCount}
        onToggle={() => {
          setExpanded((previous) => !previous)
        }}
      />
      {expanded ? (
        <Collapse expanded animateOnMount>
          {children}
        </Collapse>
      ) : null}
    </>
  )
}

export default MoreOptions
