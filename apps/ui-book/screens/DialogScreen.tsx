import type {BtcUnit} from '@vexl-next/ui'
import {
  Button,
  Circle,
  Dialog,
  DialogDescription,
  DialogLabel,
  DialogTitle,
  Exchange,
  ScrollView,
  SizableText,
  Theme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React, {useCallback, useState} from 'react'

function DialogDemos(): React.JSX.Element {
  const [singleVisible, setSingleVisible] = useState(false)
  const [twoButtonVisible, setTwoButtonVisible] = useState(false)
  const [autoDismissVisible, setAutoDismissVisible] = useState(false)
  const [btcInfoVisible, setBtcInfoVisible] = useState(false)
  const [exchangeVisible, setExchangeVisible] = useState(false)

  const [btcValue, setBtcValue] = useState('0.00')
  const [btcUnit, setBtcUnit] = useState<BtcUnit>('BTC')
  const [fiatValue, setFiatValue] = useState('2448543')

  const closeSingle = useCallback(() => {
    setSingleVisible(false)
  }, [])
  const closeTwoButton = useCallback(() => {
    setTwoButtonVisible(false)
  }, [])
  const closeAutoDismiss = useCallback(() => {
    setAutoDismissVisible(false)
  }, [])
  const closeBtcInfo = useCallback(() => {
    setBtcInfoVisible(false)
  }, [])
  const closeExchange = useCallback(() => {
    setExchangeVisible(false)
  }, [])

  return (
    <>
      <Button
        variant="primary"
        size="medium"
        onPress={() => {
          setSingleVisible(true)
        }}
      >
        Single button
      </Button>

      <Button
        variant="secondary"
        size="medium"
        onPress={() => {
          setTwoButtonVisible(true)
        }}
      >
        Two buttons
      </Button>

      <Button
        variant="secondary"
        size="medium"
        onPress={() => {
          setAutoDismissVisible(true)
        }}
      >
        Auto-dismiss (no footer)
      </Button>

      <Button
        variant="secondary"
        size="medium"
        onPress={() => {
          setBtcInfoVisible(true)
        }}
      >
        BTC info (label above title)
      </Button>

      <Button
        variant="secondary"
        size="medium"
        onPress={() => {
          setExchangeVisible(true)
        }}
      >
        Exchange child
      </Button>

      <Dialog
        visible={singleVisible}
        onClose={closeSingle}
        footer={
          <Button flex={1} onPress={closeSingle}>
            Okay
          </Button>
        }
      >
        <DialogTitle>Market unlocked!</DialogTitle>
        <DialogDescription>
          Browse offers for Bitcoin, products, and services. Use filters to find
          what you need.
        </DialogDescription>
      </Dialog>

      <Dialog
        visible={twoButtonVisible}
        onClose={closeTwoButton}
        footer={
          <>
            <Button variant="secondary" flex={1} onPress={closeTwoButton}>
              Not now
            </Button>
            <Button flex={1} onPress={closeTwoButton}>
              Confirm
            </Button>
          </>
        }
      >
        <DialogTitle>Nice number</DialogTitle>
        <DialogDescription>
          {`We've got your number as 773 777 888. If that's not right, you can change it below.`}
        </DialogDescription>
      </Dialog>

      <Dialog visible={autoDismissVisible} onClose={closeAutoDismiss}>
        <DialogTitle>{'Done!\nOffer posted.'}</DialogTitle>
        <DialogDescription>
          Your friends and friends of their friends can now see your offer.
        </DialogDescription>
      </Dialog>

      <Dialog
        visible={btcInfoVisible}
        onClose={closeBtcInfo}
        footer={
          <>
            <Button variant="secondary" flex={1} onPress={closeBtcInfo}>
              Close
            </Button>
            <Button flex={1} onPress={closeBtcInfo}>
              Confirm
            </Button>
          </>
        }
      >
        <XStack alignItems="center" justifyContent="space-between">
          <XStack
            backgroundColor="$navigationBackgroundHighlight"
            borderRadius="$2"
            padding="$1"
            gap="$1"
            alignItems="center"
          >
            <Circle size="$2" backgroundColor="$accentYellowPrimary" />
            <DialogLabel color="$accentHighlightPrimary">
              Live market price
            </DialogLabel>
          </XStack>
          <DialogLabel>Source: CoinGecko.com</DialogLabel>
        </XStack>
        <DialogTitle>{'1 BTC =\n647,900 CZK'}</DialogTitle>
        <DialogDescription>
          Your trade uses the live market rate.
        </DialogDescription>
      </Dialog>

      <Dialog
        visible={exchangeVisible}
        onClose={closeExchange}
        footer={
          <Button flex={1} onPress={closeExchange}>
            Save
          </Button>
        }
      >
        <DialogTitle>Set your own price</DialogTitle>
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
      </Dialog>
    </>
  )
}

export function DialogScreen(): React.JSX.Element {
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
        <DialogDemos />

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
            <DialogDemos />
          </YStack>
        </Theme>
      </YStack>
    </ScrollView>
  )
}
