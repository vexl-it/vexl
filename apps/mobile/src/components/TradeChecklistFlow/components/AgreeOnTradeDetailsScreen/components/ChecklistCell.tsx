import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import chevronRightSvg from '../../../../../images/chevronRightSvg'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Image from '../../../../Image'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'
import {type TradeChecklistItem} from '../../../domain'
import StatusIndicator from './StatusIndicator'

interface Props {
  hidden?: boolean
  isDisabled?: boolean
  item: TradeChecklistItem
  onPress: () => void
  sideNote?: string
  subtitle?: string
}

function ChecklistCell({
  hidden,
  isDisabled,
  item,
  onPress,
  sideNote,
  subtitle,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const itemStatus = useAtomValue(
    useMemo(() => createChecklistItemStatusAtom(item), [item])
  )

  if (hidden) return <></>

  return (
    <TouchableOpacity disabled={isDisabled} onPress={onPress}>
      <XStack
        ai="center"
        jc="space-between"
        bc="$grey"
        px="$4"
        py="$5"
        br="$4"
        opacity={isDisabled ? 0.7 : 1}
      >
        <XStack ai="center" space="$4" f={1}>
          <StatusIndicator itemStatus={itemStatus} />
          <Stack f={1}>
            <Text fos={16} ff="$body500" col="$white">
              {t(`tradeChecklist.options.${item}`)}
            </Text>
            {subtitle && (
              <Text fos={12} ff="$body500" col="$greyOnBlack">
                {subtitle}
              </Text>
            )}
          </Stack>
        </XStack>
        <XStack ai="center" space="$2">
          {sideNote && (
            <Text fos={12} ff="$body500" col="$greyOnBlack">
              {sideNote}
            </Text>
          )}
          {!isDisabled && (
            <Image
              source={chevronRightSvg}
              stroke={getTokens().color.greyOnBlack.val}
            />
          )}
        </XStack>
      </XStack>
    </TouchableOpacity>
  )
}

export default ChecklistCell
