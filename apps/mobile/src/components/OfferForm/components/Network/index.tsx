import {type BtcNetwork} from '@vexl-next/domain/src/general/offers'
import {useAtom, type WritableAtom} from 'jotai'
import React from 'react'
import {YStack} from 'tamagui'
import SelectableCell from '../../../SelectableCell'
import useContent from './useContent'

interface Props {
  btcNetworkAtom: WritableAtom<
    readonly BtcNetwork[] | undefined,
    [btcNetwork: BtcNetwork],
    void
  >
}

function Network({btcNetworkAtom}: Props): React.ReactElement | null {
  const content = useContent()
  const [btcNetwork, setBtcNetwork] = useAtom(btcNetworkAtom)

  return (
    <YStack gap="$2">
      {content.map((cell) => (
        <SelectableCell
          key={cell.type}
          selected={btcNetwork?.includes(cell.type) ?? false}
          onPress={setBtcNetwork}
          title={cell.title}
          subtitle={cell.subtitle}
          type={cell.type}
        />
      ))}
    </YStack>
  )
}

export default Network
