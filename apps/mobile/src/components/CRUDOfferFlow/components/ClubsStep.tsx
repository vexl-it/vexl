import {Button, EditStep} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import {clubsWithMembersAtomsAtom} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import ClubSelectionList from '../../ClubSelectionList'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'

interface ClubsStepProps {
  readonly ctaLabel: string
  readonly onComplete: () => void
  readonly showInitialIcon?: boolean
}

function ClubsStep({
  ctaLabel,
  onComplete,
  showInitialIcon,
}: ClubsStepProps): React.JSX.Element {
  const {t} = useTranslation()
  const hasClubs = useAtomValue(clubsWithMembersAtomsAtom).length > 0
  const {createSelectClubAtom} = useMolecule(offerFormMolecule)

  const button = (
    <Button variant="primary" size="large" onPress={onComplete}>
      {ctaLabel}
    </Button>
  )

  if (!hasClubs) return button

  return (
    <EditStep
      active
      title={t('offerForm.publishToVexlClub')}
      showInitialIcon={showInitialIcon}
    >
      <ClubSelectionList createSelectClubAtom={createSelectClubAtom} />
      {button}
    </EditStep>
  )
}

export default ClubsStep
