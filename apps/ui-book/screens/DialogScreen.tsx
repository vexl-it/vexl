import type {BtcUnit, DialogAtom} from '@vexl-next/ui'
import {
  Button,
  createDialogAtom,
  DialogFromAtom,
  Exchange,
  YStack,
} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useMemo, useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function ExchangeDialogContent(): React.JSX.Element {
  const [btcValue, setBtcValue] = useState('0.00')
  const [btcUnit, setBtcUnit] = useState<BtcUnit>('BTC')
  const [fiatValue, setFiatValue] = useState('2448543')

  return (
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
  )
}

function Demos(): React.JSX.Element {
  const dialogAtom: DialogAtom = useMemo(() => createDialogAtom(), [])
  const showDialog = useSetAtom(dialogAtom)

  return (
    <YStack gap="$4">
      <Button
        variant="primary"
        size="medium"
        onPress={() => {
          void Effect.runPromise(
            showDialog({
              title: 'Market unlocked!',
              subtitle:
                'Browse offers for Bitcoin, products, and services. Use filters to find what you need.',
              positiveButtonText: 'Okay',
            })
          )
        }}
      >
        Single button
      </Button>

      <Button
        variant="secondary"
        size="medium"
        onPress={() => {
          void Effect.runPromise(
            showDialog({
              title: 'Nice number',
              subtitle: `We've got your number as 773 777 888. If that's not right, you can change it below.`,
              positiveButtonText: 'Confirm',
              negativeButtonText: 'Not now',
            })
          ).then((confirmed) => {
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
          void Effect.runPromise(
            showDialog({
              title: 'Delete offer?',
              subtitle:
                'This action cannot be undone. Your offer will be removed permanently.',
              positiveButtonText: 'Delete',
              negativeButtonText: 'Cancel',
            })
          ).then((confirmed) => {
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
          void Effect.runPromise(
            showDialog({
              title: 'Set your own price',
              positiveButtonText: 'Save',
              children: <ExchangeDialogContent />,
            })
          )
        }}
      >
        With children (Exchange)
      </Button>

      <DialogFromAtom dialogAtom={dialogAtom} />
    </YStack>
  )
}

export function DialogScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Dialog" demos={Demos} />
}
