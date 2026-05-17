import {
  Button,
  ConferenceClub,
  NavigationBar,
  Screen,
  Typography,
  XStack,
  XmarkCancelClose,
  YStack,
  useTheme,
} from '@vexl-next/ui'
import {Effect} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useState} from 'react'
import {type JoinClubFlowStackScreenProps} from '../../../navigationTypes'
import {submitCodeToJoinClubActionAtom} from '../../../state/clubs/atom/submitCodeToJoinClubActionAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {ImageUniversal} from '../../Image'
import {clubToJoinAtom} from '../atoms'

type Props = JoinClubFlowStackScreenProps<'MakingSureScreen'>

function MakingSureScreen({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation()
  const theme = useTheme()
  const submitCodeToJoinClub = useSetAtom(submitCodeToJoinClubActionAtom)
  const clubToJoin = useAtomValue(clubToJoinAtom)
  const setClubToJoin = useSetAtom(clubToJoinAtom)
  const [submitInProgress, setSubmitInProgress] = useState(false)
  const imageSize = 140

  const cancelJoinFlow = (): void => {
    setClubToJoin(null)

    const parentNavigation = navigation.getParent()
    if (parentNavigation) {
      parentNavigation.goBack()
    } else {
      navigation.goBack()
    }
  }

  const submit = (): void => {
    if (submitInProgress) return

    setSubmitInProgress(true)

    void Effect.runPromise(
      pipe(
        submitCodeToJoinClub({
          code: route.params.code,
          skipConfirmation: true,
        }),
        Effect.andThen((success) =>
          Effect.sync(() => {
            if (success) {
              setClubToJoin(null)
              navigation.navigate('InsideTabs', {
                screen: 'Community',
                params: {screen: 'Clubs'},
              })
            }
          })
        )
      )
    ).finally(() => {
      setSubmitInProgress(false)
    })
  }

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: cancelJoinFlow,
            },
          ]}
        />
      }
      footer={
        <XStack gap="$2">
          <Button
            disabled={submitInProgress}
            flex={1}
            variant="secondary"
            onPress={cancelJoinFlow}
          >
            {t('common.noThanks')}
          </Button>
          <Button
            disabled={submitInProgress}
            flex={1}
            variant="primary"
            onPress={submit}
          >
            {t('clubs.join')}
          </Button>
        </XStack>
      }
    >
      <YStack flex={1} alignItems="center" paddingTop="$2">
        <YStack alignItems="center" gap="$7">
          <YStack
            width={imageSize}
            height={imageSize}
            borderRadius="$5"
            overflow="hidden"
            backgroundColor="$accentYellowSecondary"
          >
            {clubToJoin?.clubImageUrl ? (
              <ImageUniversal
                width={imageSize}
                height={imageSize}
                style={{
                  height: imageSize,
                  resizeMode: 'cover',
                  width: imageSize,
                }}
                source={{
                  type: 'imageUri',
                  imageUri: clubToJoin.clubImageUrl,
                }}
              />
            ) : (
              <YStack flex={1} alignItems="center" justifyContent="center">
                <ConferenceClub
                  size={80}
                  color={theme.accentHighlightSecondary.get()}
                />
              </YStack>
            )}
          </YStack>
          <YStack alignItems="center" gap="$7">
            <Typography
              variant="heading3"
              color="$foregroundPrimary"
              textAlign="center"
            >
              {clubToJoin
                ? t('clubs.joinSpecificClubQuestion', {
                    clubName: clubToJoin.name,
                  })
                : t('clubs.joinClubQuestion')}
            </Typography>
            <Typography
              variant="description"
              color="$foregroundPrimary"
              textAlign="center"
            >
              {t('clubs.joinClubQuestionDescription')}
            </Typography>
          </YStack>
        </YStack>
      </YStack>
    </Screen>
  )
}

export default MakingSureScreen
