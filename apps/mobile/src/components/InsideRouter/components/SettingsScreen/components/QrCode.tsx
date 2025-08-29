import {BlurView} from '@react-native-community/blur'
import {Effect, pipe} from 'effect'
import {atom, useAtomValue} from 'jotai'
import React, {useState} from 'react'
import {Stack, Text, YStack} from 'tamagui'
import {
  translationAtom,
  useTranslation,
} from '../../../../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../../../../AreYouSureDialog'
import Button from '../../../../Button'
import {SharableQrCode} from '../../../../SharableQrCode'
import {encodedUserDetailsUriAtom} from '../atoms'

export const qrCodeDialogActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return pipe(
    set(askAreYouSureActionAtom, {
      variant: 'info',
      steps: [
        {
          type: 'StepWithChildren',
          MainSectionComponent: QrCode,
          positiveButtonText: t('common.gotIt'),
        },
      ],
    }),
    Effect.match({
      onSuccess: () => {},
      onFailure: () => {},
    })
  )
})

function QrCode(): React.ReactElement {
  const {t} = useTranslation()
  const [sharePressed, setSharePressed] = useState(false)
  const [confirmPressed, setConfirmPressed] = useState(false)
  const encodedUserDetailsUri = useAtomValue(encodedUserDetailsUriAtom)

  return (
    <Stack>
      <YStack ai="center" gap="$4">
        <Stack height={350} ai="center" jc="center">
          <SharableQrCode
            size={300}
            value={encodedUserDetailsUri}
            logo={require('../images/app_logo.png')}
          />
        </Stack>
        {(!sharePressed || !confirmPressed) && (
          <BlurView
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 50,
            }}
            blurType="light"
            blurAmount={8}
            reducedTransparencyFallbackColor="white"
          />
        )}
        <Text col="$black" fos={28} ff="$heading">
          {t('qrCode.joinVexl')}
        </Text>
        {!confirmPressed && !sharePressed && (
          <Stack
            pos="absolute"
            t={0}
            b={50}
            r={0}
            l={0}
            ai="center"
            jc="center"
          >
            <Button
              variant="primary"
              text={t('common.share')}
              onPress={() => {
                setSharePressed(true)
              }}
            />
          </Stack>
        )}
        {!confirmPressed && !!sharePressed && (
          <Stack
            pos="absolute"
            t={0}
            b={50}
            r={0}
            l={0}
            ai="center"
            jc="center"
            gap="$4"
          >
            <YStack br="$4" p="$4" bc="$grey">
              <Text fos={16} textAlign="justify">
                {t('qrCode.attentionSharingYourQrCode')}
              </Text>
            </YStack>
            <Button
              variant="primary"
              text={t('common.confirm')}
              onPress={() => {
                setConfirmPressed(true)
              }}
            />
          </Stack>
        )}
      </YStack>
    </Stack>
  )
}

export default QrCode
