import type {BtcUnit, DialogAtom} from '@vexl-next/ui'
import {
  Button,
  createDialogAtom,
  DialogFromAtom,
  Exchange,
  ScrollView,
  SizableText,
  Theme,
  YStack,
} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React, {useMemo, useState} from 'react'

function DialogDemos({
  dialogAtom,
}: {
  readonly dialogAtom: DialogAtom
}): React.JSX.Element {
  const showDialog = useSetAtom(dialogAtom)

  const [btcValue, setBtcValue] = useState('0.00')
  const [btcUnit, setBtcUnit] = useState<BtcUnit>('BTC')
  const [fiatValue, setFiatValue] = useState('2448543')

  return (
    <>
      <Button
        variant="primary"
        size="medium"
        onPress={() => {
          void showDialog({
            title: 'Market unlocked!',
            subtitle:
              'Browse offers for Bitcoin, products, and services. Use filters to find what you need.',
            positiveButtonText: 'Okay',
          })
        }}
      >
        Single button
      </Button>

      <Button
        variant="secondary"
        size="medium"
        onPress={() => {
          void showDialog({
            title: 'Nice number',
            subtitle: `We've got your number as 773 777 888. If that's not right, you can change it below.`,
            positiveButtonText: 'Confirm',
            negativeButtonText: 'Not now',
          }).then((confirmed) => {
            console.log('Confirmed:', confirmed)
          })
        }}
      >
        Two buttons
      </Button>

      <Button
        variant="destructive"
        size="medium"
        onPress={() => {
          void showDialog({
            title: 'Delete offer?',
            subtitle:
              'This action cannot be undone. Your offer will be removed permanently.',
            positiveButtonText: 'Delete',
            negativeButtonText: 'Cancel',
          }).then((confirmed) => {
            console.log('Delete confirmed:', confirmed)
          })
        }}
      >
        Destructive
      </Button>

      <Button
        variant="secondary"
        size="medium"
        onPress={() => {
          void showDialog({
            title: 'Set your own price',
            positiveButtonText: 'Save',
            children: (
              <Exchange
                btcValue={btcValue}
                btcUnit={btcUnit}
                onBtcValueChange={setBtcValue}
                onBtcUnitChange={setBtcUnit}
                fiatValue={fiatValue}
                fiatCurrency="CZK"
                onFiatValueChange={setFiatValue}
                onFiatCurrencyPress={() => {}}
              />
            ),
          })
        }}
      >
        With children (Exchange)
      </Button>

      <DialogFromAtom dialogAtom={dialogAtom} />
    </>
  )
}

export function DialogScreen(): React.JSX.Element {
  const dialogAtom = useMemo(() => createDialogAtom(), [])
  const darkDialogAtom = useMemo(() => createDialogAtom(), [])

  return (
    <ScrollView contentContainerStyle={{flexGrow: 1}}>
      <YStack
        flex={1}
        padding="$5"
        gap="$4"
        backgroundColor="$backgroundPrimary"
      >
        <SizableText fontFamily="$body" fontWeight="600" fontSize="$5">
          Light mode
        </SizableText>
        <DialogDemos dialogAtom={dialogAtom} />

        <Theme name="dark">
          <YStack
            gap="$4"
            backgroundColor="$backgroundPrimary"
            padding="$5"
            borderRadius="$5"
            marginTop="$4"
          >
            <SizableText
              fontFamily="$body"
              fontWeight="600"
              fontSize="$5"
              color="$foregroundPrimary"
            >
              Dark mode
            </SizableText>
            <DialogDemos dialogAtom={darkDialogAtom} />
          </YStack>
        </Theme>
      </YStack>
    </ScrollView>
  )
}
