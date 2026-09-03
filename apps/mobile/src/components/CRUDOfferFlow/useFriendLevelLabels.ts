import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {formatInteger} from '../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../utils/localization/formattingLocaleAtom'
import numberOfFriendsAtom from './atoms/numberOfFriendsAtom'
import {offerFormMolecule} from './atoms/offerFormStateAtoms'

export function useFriendLevelLabels(): {
  headline: string
  reachLabel: string
} {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {intendedConnectionLevelAtom} = useMolecule(offerFormMolecule)
  const intendedConnectionLevel = useAtomValue(intendedConnectionLevelAtom)
  const numberOfFriends = useAtomValue(numberOfFriendsAtom)

  const headline =
    intendedConnectionLevel === 'FIRST'
      ? t('offerForm.friendLevel.firstDegree')
      : t('offerForm.friendLevel.secondDegree')

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

  return {headline, reachLabel}
}
