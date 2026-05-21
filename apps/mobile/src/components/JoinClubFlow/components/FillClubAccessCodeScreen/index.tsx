import {useFocusEffect} from '@react-navigation/native'
import {ClubCode} from '@vexl-next/domain/src/general/clubs'
import {
  ArrowLeft,
  Button,
  NavigationBar,
  Screen,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Effect, pipe, Schema} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Keyboard, TextInput, TouchableOpacity} from 'react-native'
import {type JoinClubFlowStackScreenProps} from '../../../../navigationTypes'
import {validateCodeToJoinClubActionAtom} from '../../../../state/clubs/atom/submitCodeToJoinClubActionAtom'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {accessCodeMolecule, CODE_LENGTH} from '../../atoms'

type Props = JoinClubFlowStackScreenProps<'FillClubAccessCodeScreen'>

function CodeBox({
  disabled,
  invalid,
  value,
}: {
  readonly disabled: boolean
  readonly invalid: boolean
  readonly value: string | undefined
}): React.ReactElement {
  return (
    <YStack
      alignItems="center"
      backgroundColor={disabled ? '$backgroundTertiary' : '$backgroundPrimary'}
      borderColor={invalid ? '$redForeground' : '$backgroundHighlight'}
      borderRadius="$3"
      borderWidth={1}
      height={48}
      justifyContent="center"
      width={50}
    >
      <Typography
        color={disabled ? '$foregroundSecondary' : '$foregroundPrimary'}
        variant="paragraph"
      >
        {value ?? ''}
      </Typography>
    </YStack>
  )
}

function FillClubAccessCodeScreen({
  navigation,
  route,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const inputRef = useRef<TextInput>(null)
  const submitInProgressRef = useRef(false)
  const [submitInProgress, setSubmitInProgress] = useState(false)
  const {
    accessCodeAtom,
    handleAccessCodeElementChangeActionAtom,
    isCodeFilledAtom,
    isCodeInvalidAtom,
  } = useMolecule(accessCodeMolecule)
  const accessCode = useAtomValue(accessCodeAtom)
  const isCodeInvalid = useAtomValue(isCodeInvalidAtom)
  const isCodeFilled = useAtomValue(isCodeFilledAtom)
  const handleAccessCodeElementChange = useSetAtom(
    handleAccessCodeElementChangeActionAtom
  )
  const setIsCodeInvalid = useSetAtom(isCodeInvalidAtom)
  const validateCodeToJoinClub = useSetAtom(validateCodeToJoinClubActionAtom)
  const autoSubmitted = useRef(false)

  const submitCode = useCallback(
    (code: string): void => {
      if (code.length !== CODE_LENGTH || submitInProgressRef.current) return

      submitInProgressRef.current = true
      setSubmitInProgress(true)
      setIsCodeInvalid(false)

      void Effect.runPromise(
        Effect.gen(function* (_) {
          const clubCode = yield* _(Schema.decode(ClubCode)(code))
          const success = yield* _(
            validateCodeToJoinClub({
              code: clubCode,
              onCodeNotFound: () => {
                setIsCodeInvalid(true)
              },
            })
          )

          if (success) {
            navigation.navigate('MakingSureScreen', {code: clubCode})
          }
        })
      ).finally(() => {
        submitInProgressRef.current = false
        setSubmitInProgress(false)
      })
    },
    [navigation, setIsCodeInvalid, validateCodeToJoinClub]
  )

  useEffect(() => {
    if (!route.params?.autoSubmit || !isCodeFilled || autoSubmitted.current) {
      return
    }

    autoSubmitted.current = true
    submitCode(accessCode.join(''))
  }, [accessCode, isCodeFilled, route.params?.autoSubmit, submitCode])

  useFocusEffect(
    useCallback(() => {
      let refocusTimeout: ReturnType<typeof setTimeout> | undefined

      autoSubmitted.current = false

      const focusInput = (): void => {
        if (!submitInProgressRef.current) inputRef.current?.focus()
      }

      const scheduleFocus = (): void => {
        if (refocusTimeout !== undefined) clearTimeout(refocusTimeout)
        refocusTimeout = setTimeout(focusInput, 50)
      }

      scheduleFocus()

      const keyboardDidHideSubscription = Keyboard.addListener(
        'keyboardDidHide',
        scheduleFocus
      )

      return () => {
        if (refocusTimeout !== undefined) clearTimeout(refocusTimeout)
        keyboardDidHideSubscription.remove()
      }
    }, [])
  )

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          leftAction={{
            icon: ArrowLeft,
            onPress: navigation.goBack,
          }}
        />
      }
      footer={
        <Button
          disabled={!isCodeFilled || submitInProgress}
          variant="primary"
          onPress={() => {
            submitCode(accessCode.join(''))
          }}
        >
          {t('clubs.joinClub')}
        </Button>
      }
    >
      <YStack flex={1} justifyContent="center" gap="$10">
        <YStack alignItems="center" gap="$4">
          <Typography
            variant="heading3"
            color="$foregroundPrimary"
            textAlign="center"
          >
            {t('clubs.enterYourClubCode')}
          </Typography>
        </YStack>
        <TouchableOpacity
          activeOpacity={1}
          disabled={submitInProgress}
          onPress={() => {
            inputRef.current?.focus()
          }}
        >
          <YStack gap="$3">
            <TextInput
              autoFocus
              caretHidden
              editable={!submitInProgress}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              onChangeText={(value) => {
                const code = value.replace(/\D/g, '').substring(0, CODE_LENGTH)
                handleAccessCodeElementChange(code)
              }}
              ref={inputRef}
              style={{height: 1, opacity: 0, position: 'absolute', width: 1}}
              value={accessCode.join('')}
            />
            <XStack gap="$2" justifyContent="center">
              {pipe(
                Array.makeBy(CODE_LENGTH, (index) => (
                  <CodeBox
                    key={index}
                    disabled={submitInProgress}
                    invalid={isCodeInvalid}
                    value={accessCode[index]}
                  />
                ))
              )}
            </XStack>
            {!!submitInProgress && (
              <Typography
                color="$foregroundPrimary"
                textAlign="center"
                variant="paragraphSmall"
              >
                {t('clubs.verifying')}
              </Typography>
            )}
            {!!isCodeInvalid && !submitInProgress && (
              <Typography
                color="$redForeground"
                textAlign="center"
                variant="paragraphSmall"
              >
                {t('clubs.codeDidNotWorkDoubleCheckAndTryAgain')}
              </Typography>
            )}
          </YStack>
        </TouchableOpacity>
        <YStack />
      </YStack>
    </Screen>
  )
}

export default FillClubAccessCodeScreen
