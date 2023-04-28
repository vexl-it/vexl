import {Modal, ScrollView, StyleSheet, useWindowDimensions} from 'react-native'
import {Stack, Text} from 'tamagui'
import WhiteContainer from '../../WhiteContainer'
import Button from '../../Button'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import SvgImage from '../../Image'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import {type ReactNode} from 'react'
import Screen from '../../Screen'

interface Props {
  visible: boolean
  onClose: () => void
  title: string
  image: SvgString
  children: ReactNode
}

const styles = StyleSheet.create({
  scrollStyles: {
    paddingHorizontal: 16,
  },
})

function Help({children, image, onClose, title, visible}: Props): JSX.Element {
  const {t} = useTranslation()
  const dimensions = useWindowDimensions()
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Screen customHorizontalPadding={0}>
        <WhiteContainer noPadding py="$4">
          <ScrollView contentContainerStyle={styles.scrollStyles}>
            <Stack f={1} ai="center" jc="center" h={dimensions.width / 2}>
              <SvgImage source={image} />
            </Stack>
            <Stack jc="flex-end">
              <Text
                my="$4"
                ff="$heading"
                fos={24}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {title}
              </Text>
              {children}
            </Stack>
          </ScrollView>
        </WhiteContainer>
        <Stack my="$2">
          <Button
            onPress={onClose}
            variant="secondary"
            text={t('createOffer.gotIt')}
          />
        </Stack>
      </Screen>
    </Modal>
  )
}

export default Help
