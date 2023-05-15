import {XStack} from 'tamagui'
import FriendLevelCell from './components/FriendLevelCell'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import firstDegreeFriendsSvg from './images/firstDegreeFriendsSvg'
import secondDegreeFriendsSvg from './images/secondDegreeFriendsSvg'
import {type Atom, useAtom} from 'jotai'
import {type IntendedConnectionLevel} from '@vexl-next/domain/dist/general/offers'

interface Props {
  intendedConnectionLevelAtom: Atom<IntendedConnectionLevel | undefined>
}

function FriendLevel({intendedConnectionLevelAtom}: Props): JSX.Element {
  const {t} = useTranslation()
  const [intendedConnectionLevel, setIntendedConnectionLevel] = useAtom(
    intendedConnectionLevelAtom
  )

  return (
    <XStack jc="space-evenly">
      <FriendLevelCell
        image={firstDegreeFriendsSvg}
        selected={intendedConnectionLevel === 'FIRST'}
        type="FIRST"
        onPress={setIntendedConnectionLevel}
        title={t('offerForm.friendLevel.firstDegree')}
      />
      <FriendLevelCell
        image={secondDegreeFriendsSvg}
        selected={intendedConnectionLevel === 'ALL'}
        type="ALL"
        onPress={setIntendedConnectionLevel}
        title={t('offerForm.friendLevel.secondDegree')}
      />
    </XStack>
  )
}

export default FriendLevel
