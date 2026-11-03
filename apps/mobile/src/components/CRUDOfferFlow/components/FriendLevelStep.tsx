import {Button, EditStep, Loader} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import {formatInteger} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {getOfferExpirationLabel} from '../../../utils/offerAmountDetails'
import FriendLevel from '../../OfferForm/components/FriendLevel'
import numberOfFriendsAtom from '../atoms/numberOfFriendsAtom'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import {type OfferFormStepProps} from '../offerSetupSteps'
import ExpirationOptions from './ExpirationOptions'

interface FriendLevelStepProps extends OfferFormStepProps {
  readonly hideSubtitle?: boolean
  readonly contentLoading?: boolean
}

function FriendLevelStep({
  onComplete,
  ctaLabel,
  hideSubtitle,
  contentLoading,
  ...stepProps
}: FriendLevelStepProps): React.JSX.Element {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {intendedConnectionLevelAtom, expirationDateAtom} =
    useMolecule(offerFormMolecule)
  const intendedConnectionLevel = useAtomValue(intendedConnectionLevelAtom)
  const expirationDate = useAtomValue(expirationDateAtom)
  const numberOfFriends = useAtomValue(numberOfFriendsAtom)

  const reachLabel = (() => {
    if (numberOfFriends.state === 'loading') return t('common.loading')
    if (numberOfFriends.state === 'error')
      return t('offerForm.friendLevel.noVexlers')

    const reachCount =
      intendedConnectionLevel === 'FIRST'
        ? numberOfFriends.firstLevelFriendsCount
        : numberOfFriends.firstAndSecondLevelFriendsCount

    return t('offerForm.friendLevel.reachPeopleFormatted', {
      localizedString: formatInteger(reachCount, locale),
    })
  })()

  return (
    <EditStep
      {...stepProps}
      title={t('offerForm.whoCanSeeYourOffer')}
      value={
        intendedConnectionLevel === 'FIRST'
          ? t('offerForm.friendLevel.firstDegree')
          : t('offerForm.friendLevel.secondDegree')
      }
      details={[
        reachLabel,
        getOfferExpirationLabel({expirationDate, locale, t}),
      ]}
    >
      {contentLoading ? (
        <Loader size="large" />
      ) : (
        <>
          <FriendLevel
            hideSubtitle={hideSubtitle}
            intendedConnectionLevelAtom={intendedConnectionLevelAtom}
          />
          <ExpirationOptions />
          <Button
            variant="primary"
            size="large"
            disabled={numberOfFriends.state === 'loading'}
            onPress={onComplete}
          >
            {ctaLabel ?? t('offerForm.next')}
          </Button>
        </>
      )}
    </EditStep>
  )
}

export default FriendLevelStep
