import {useMemo} from 'react'
import {useAtom} from 'jotai'
import SvgImage from '../../Image'
import {TouchableOpacity} from 'react-native'
import {getTokens} from 'tamagui'
import starSvg from '../images/starSvg'
import {useMolecule} from 'jotai-molecules'
import {feedbackMolecule} from '../atoms'

interface Props {
  starOrderNumber: number
}

function TouchableStar({starOrderNumber}: Props): JSX.Element {
  const {createIsStarSelectedAtom} = useMolecule(feedbackMolecule)
  const [isSelected, select] = useAtom(
    useMemo(
      () => createIsStarSelectedAtom(starOrderNumber),
      [createIsStarSelectedAtom, starOrderNumber]
    )
  )

  return (
    <TouchableOpacity
      onPress={() => {
        select(!isSelected)
      }}
    >
      <SvgImage
        fill={isSelected ? getTokens().color.main.val : 'none'}
        source={starSvg}
      />
    </TouchableOpacity>
  )
}

export default TouchableStar
