import {Stack, Text, XStack} from 'tamagui'
import Button from '../../../../Button'
import {Modal} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

interface Props {
  primaryButton?: {
    text: string
    onPress?: () => boolean
  }
  secondaryButton?: {
    text: string
    onPress?: () => boolean
  }
  children?: React.ReactNode
  onClose: () => void
  title?: string
  subtitle?: string
  visible: boolean
}

function SettingsScreenDialog({
  primaryButton,
  secondaryButton,
  children,
  onClose,
  title,
  subtitle,
  visible,
}: Props): JSX.Element {
  const {bottom} = useSafeAreaInsets()

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Stack f={1} jc={'flex-end'} pb={bottom} bc={'rgba(0,0,0,0.6)'} px={'$2'}>
        <Stack py={'$4'} px={'$4'} backgroundColor={'$white'} br={'$4'}>
          <Stack jc="flex-end">
            {title && (
              <Text
                col="$black"
                my={'$4'}
                ff={'$heading'}
                fos={28}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text fos={18} ff={'$body500'} col={'$greyOnWhite'}>
                {subtitle}
              </Text>
            )}
          </Stack>
          {children}
        </Stack>
        <XStack space="$2" my="$2">
          {secondaryButton && (
            <Button
              fullSize
              adjustTextToFitOneLine
              variant="secondary"
              text={secondaryButton.text}
              onPress={() => {
                if (secondaryButton?.onPress) {
                  if (secondaryButton.onPress()) onClose()
                } else {
                  onClose()
                }
              }}
            />
          )}
          {primaryButton && (
            <Button
              fullSize
              adjustTextToFitOneLine
              onPress={() => {
                if (primaryButton?.onPress) {
                  if (primaryButton.onPress()) onClose()
                } else {
                  onClose()
                }
              }}
              variant="primary"
              text={primaryButton.text}
            />
          )}
        </XStack>
      </Stack>
    </Modal>
  )
}

export default SettingsScreenDialog
