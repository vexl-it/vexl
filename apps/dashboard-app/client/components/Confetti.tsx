import {Option, pipe} from 'effect'
import {useAtom} from 'jotai'
import ReactConfetti from 'react-confetti'
import useWindowSize from 'react-use/lib/useWindowSize'
import {type UserWithConnections} from '../../common/ServerMessage'
import {getCountryInfo} from '../../common/countryInfos'
import {showConfettiAtom} from '../state'

const getColors = (user: UserWithConnections): Option.Option<string[]> =>
  pipe(
    getCountryInfo(user.countryPrefix),
    Option.map((info) => info.colors)
  )

export default function Confetti(): React.ReactElement | null {
  const {width, height} = useWindowSize()
  const [showConfetti, setShowConfetti] = useAtom(showConfettiAtom)

  if (Option.isNone(showConfetti)) {
    return null
  }

  const colors = getColors(showConfetti.value)
  if (Option.isNone(colors)) {
    return null
  }

  return (
    <ReactConfetti
      key={showConfetti.value.pubKey}
      numberOfPieces={showConfetti.value.connectionsCount}
      run={true}
      recycle={false}
      colors={colors.value}
      onConfettiComplete={() => {
        setShowConfetti(Option.none())
      }}
      width={width}
      height={height}
    />
  )
}
