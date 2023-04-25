import {Text} from 'tamagui'
import {useTriggerOffersRefresh} from '../../../../../state/marketplace'
import Button from '../../../../Button'

function EmptyListPlaceholder(): JSX.Element {
  const refresh = useTriggerOffersRefresh()

  return (
    <>
      <Text fontSize={14} col="$white">
        No offers TODO
      </Text>
      <Button
        text="refresh"
        variant={'primary'}
        small={true}
        onPress={() => {
          void refresh()
        }}
      ></Button>
    </>
  )
}

export default EmptyListPlaceholder
