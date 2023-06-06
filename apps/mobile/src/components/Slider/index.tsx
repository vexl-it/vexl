import {Slider as RNSlider} from '@miblanchard/react-native-slider'
import SliderCustomThumb from './SliderCustomThumb'
import {type ColorTokens, getTokens} from 'tamagui'
import {type SliderOnChangeCallback} from '@miblanchard/react-native-slider/lib/types'

interface Props {
  customKnobColor?: ColorTokens
  maximumTrackTintColor?: string
  minimumTrackTintColor?: string
  maximumValue: number
  minimumValue: number
  step: number | undefined
  value: number | number[] | undefined
  onValueChange: SliderOnChangeCallback | undefined
}

function Slider({
  customKnobColor,
  maximumTrackTintColor,
  minimumTrackTintColor,
  maximumValue,
  minimumValue,
  step,
  value,
  onValueChange,
}: Props): JSX.Element {
  const tokens = getTokens()
  return (
    <RNSlider
      trackClickable
      maximumTrackTintColor={
        maximumTrackTintColor ?? tokens.color.greyOnWhite.val
      }
      maximumValue={maximumValue}
      minimumTrackTintColor={minimumTrackTintColor ?? tokens.color.main.val}
      minimumValue={minimumValue}
      renderThumbComponent={() => (
        <SliderCustomThumb customKnobColor={customKnobColor} />
      )}
      step={step}
      value={value}
      onValueChange={onValueChange}
    />
  )
}

export default Slider
