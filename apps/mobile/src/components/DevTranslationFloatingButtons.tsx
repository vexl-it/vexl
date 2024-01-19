import {useSetAtom} from 'jotai'
import {Dimensions} from 'react-native'
import Draggable from 'react-native-draggable'
import {getTokens} from 'tamagui'
import {showDevLabelsAtom} from '../utils/localization/I18nProvider'

function DevTranslationFloatingButton(): JSX.Element {
  const setShowDevLabels = useSetAtom(showDevLabelsAtom)
  return (
    <Draggable
      x={Dimensions.get('window').width - 100}
      y={Dimensions.get('window').height - 100}
      z={1000}
      renderSize={56}
      renderColor={getTokens().color.red.val}
      renderText="🔍"
      isCircle
      onShortPressRelease={() => {
        setShowDevLabels((prev) => !prev)
      }}
    />
  )
}

export default DevTranslationFloatingButton
