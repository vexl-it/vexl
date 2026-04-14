import {useNavigationState} from '@react-navigation/native'
import {
  Button,
  Camera,
  IconButton,
  TrashBin,
  Typography,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {StyleSheet, TouchableOpacity} from 'react-native'
import Svg, {Rect} from 'react-native-svg'
import {
  getTokens,
  Stack,
  Image as TamaguiImage,
  useTheme,
  XStack,
  YStack,
} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import {selectImageActionAtom} from '../../../../state/selectImageActionAtom'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../../utils/resolveLocalUri'
import {
  discardRevealIdentityDraftActionAtom,
  revealIdentityImageUriAtom,
} from '../../atoms/revealIdentityAtoms'
import {TradeChecklistItemPageLayout} from '../TradeChecklistItemPageLayout'

type Props = TradeChecklistStackScreenProps<'RevealIdentityPhoto'>

const DASHED_BORDER_SIZE = 256
const DASHED_BORDER_WIDTH = 1
const DASHED_BORDER_INSET = DASHED_BORDER_WIDTH / 2
const DASHED_BORDER_RECT_SIZE = DASHED_BORDER_SIZE - DASHED_BORDER_WIDTH
const DASHED_BORDER_RADIUS = getTokens().radius[5].val

function RevealIdentityPhotoScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const previousRouteName = useNavigationState(
    (state) => state.routes[state.index - 1]?.name
  )
  const revealIdentityImageUri = useAtomValue(revealIdentityImageUriAtom)
  const selectImage = useSetAtom(selectImageActionAtom)
  const discardRevealIdentityDraft = useSetAtom(
    discardRevealIdentityDraftActionAtom
  )
  const setRevealIdentityImageUri = useSetAtom(revealIdentityImageUriAtom)

  const closeFlow = useCallback(() => {
    discardRevealIdentityDraft()
    navigation.popTo('AgreeOnTradeDetails')
  }, [discardRevealIdentityDraft, navigation])

  return (
    <TradeChecklistItemPageLayout
      header={{
        title: t('tradeChecklist.revealIdentity.addPhotoTitle'),
        onBackPress: () => {
          if (previousRouteName === 'AgreeOnTradeDetails') {
            closeFlow()
            return
          }

          navigation.goBack()
        },
        rightActions: [
          {
            icon: XmarkCancelClose,
            onPress: closeFlow,
          },
        ],
      }}
      bottomButton={{
        disabled: false,
        text: t('common.next'),
        onPress: () => {
          navigation.navigate('RevealIdentityNickname')
        },
      }}
      scrollable={false}
    >
      <Stack f={1} gap="$7" pt="$4" alignItems="stretch">
        <Typography variant="description" color="$foregroundSecondary">
          {t('tradeChecklist.revealIdentity.addPhotoDescription')}
        </Typography>
        <YStack flex={1} alignItems="center" gap="$8" pt="$6">
          {revealIdentityImageUri ? (
            <>
              <TamaguiImage
                borderRadius="$5"
                height={DASHED_BORDER_SIZE}
                width={DASHED_BORDER_SIZE}
                source={{uri: resolveLocalUri(revealIdentityImageUri)}}
              />
              <XStack gap="$3">
                <Button
                  variant="secondary"
                  size="small"
                  onPress={() => {
                    selectImage(revealIdentityImageUriAtom)
                  }}
                >
                  {t('tradeChecklist.revealIdentity.changePhoto')}
                </Button>
                <IconButton
                  width={40}
                  height={40}
                  padding="$0"
                  borderRadius="$4"
                  backgroundColor="$redBackground"
                  onPress={() => {
                    setRevealIdentityImageUri(undefined)
                  }}
                >
                  <TrashBin size={24} color={theme.white100.val} />
                </IconButton>
              </XStack>
            </>
          ) : (
            <TouchableOpacity
              style={{
                flex: 1,
                alignSelf: 'stretch',
                alignItems: 'center',
              }}
              onPress={() => {
                selectImage(revealIdentityImageUriAtom)
              }}
            >
              <Stack f={1}>
                <Stack
                  ai="center"
                  jc="center"
                  alignSelf="stretch"
                  borderRadius="$5"
                  position="relative"
                  flex={1}
                  width={DASHED_BORDER_SIZE}
                  maxHeight={DASHED_BORDER_SIZE}
                >
                  <Svg
                    pointerEvents="none"
                    style={StyleSheet.absoluteFill}
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${DASHED_BORDER_SIZE} ${DASHED_BORDER_SIZE}`}
                  >
                    <Rect
                      width={DASHED_BORDER_RECT_SIZE}
                      height={DASHED_BORDER_RECT_SIZE}
                      rx={DASHED_BORDER_RADIUS}
                      ry={DASHED_BORDER_RADIUS}
                      fill="none"
                      stroke={theme.foregroundTertiary.val}
                      strokeWidth={DASHED_BORDER_WIDTH}
                      strokeDasharray="6 6"
                      transform={`translate(${DASHED_BORDER_INSET} ${DASHED_BORDER_INSET})`}
                    />
                  </Svg>
                  <Stack
                    ai="center"
                    jc="center"
                    width={88}
                    height={88}
                    borderRadius={44}
                    backgroundColor="$main"
                  >
                    <Camera size={40} color="black" />
                  </Stack>
                </Stack>
              </Stack>
            </TouchableOpacity>
          )}
        </YStack>
      </Stack>
    </TradeChecklistItemPageLayout>
  )
}

export default RevealIdentityPhotoScreen
