import {useNavigation, usePreventRemove} from '@react-navigation/native'
import {
  getTokens,
  KeyboardAwareScrollView,
  Loader,
  NavigationBar,
  Screen,
  Stack,
  XmarkCancelClose,
  YStack,
  type KeyboardAwareScrollViewRef,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {type LayoutChangeEvent} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {globalDialogAtom} from '../GlobalDialog'
import {offerFormMolecule} from './atoms/offerFormStateAtoms'
import AmountStep from './components/AmountStep'
import ClubsStep from './components/ClubsStep'
import DescribeStep from './components/DescribeStep'
import FriendLevelStep from './components/FriendLevelStep'
import LanguageStep from './components/LanguageStep'
import ListingTypeStep from './components/ListingTypeStep'
import LocationStep from './components/LocationStep'
import NetworkStep from './components/NetworkStep'
import OfferTypeStep from './components/OfferTypeStep'
import PriceUpToStep from './components/PriceUpToStep'
import ProductCategoryStep from './components/ProductCategoryStep'
import {type OfferSetupStep} from './offerSetupSteps'

function CRUDOfferFlow(): React.ReactElement {
  const {t} = useTranslation()
  const navigation =
    useNavigation<RootStackScreenProps<'CRUDOfferFlow'>['navigation']>()
  const safeGoBack = useSafeGoBack()
  const {
    offerTypeAtom,
    listingTypeAtom,
    initializeValuesForOfferFormActionAtom,
    resetOfferFormActionAtom,
    discardLocationIfNotInPersonActionAtom,
    createOfferActionAtom,
  } = useMolecule(offerFormMolecule)
  const offerType = useAtomValue(offerTypeAtom)
  const listingType = useAtomValue(listingTypeAtom)
  const showDialog = useSetAtom(globalDialogAtom)
  const createOffer = useSetAtom(createOfferActionAtom)
  const initializeValuesForOfferForm = useSetAtom(
    initializeValuesForOfferFormActionAtom
  )
  const resetOfferForm = useSetAtom(resetOfferFormActionAtom)
  const discardLocationIfNotInPerson = useSetAtom(
    discardLocationIfNotInPersonActionAtom
  )
  const insets = useSafeAreaInsets()

  const [activeStep, setActiveStep] = useState<OfferSetupStep>('listingType')
  const skipExitConfirmationRef = useRef(false)
  useEffect(() => {
    skipExitConfirmationRef.current = false
    resetOfferForm()
    setActiveStep('listingType')
    void Effect.runPromise(initializeValuesForOfferForm())
  }, [initializeValuesForOfferForm, resetOfferForm])

  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null)
  const stepYsRef = useRef<Partial<Record<OfferSetupStep, number>>>({})

  const isHeavyStep = (step: OfferSetupStep): boolean =>
    step === 'friendLevel' || step === 'clubs'

  const [heavyContentReady, setHeavyContentReady] = useState(false)
  useEffect(() => {
    if (!isHeavyStep(activeStep)) {
      setHeavyContentReady(false)
      return
    }
    const id = setTimeout(() => {
      setHeavyContentReady(true)
    }, 0)
    return () => {
      clearTimeout(id)
    }
  }, [activeStep])

  const scrollToActiveStep = (): void => {
    if (isHeavyStep(activeStep) && !heavyContentReady) return
    const y = stepYsRef.current[activeStep]
    if (y === undefined) return
    scrollRef.current?.scrollTo({
      y: Math.max(0, y - getTokens().space.$2.val),
      animated: true,
    })
  }

  useEffect(() => {
    scrollToActiveStep()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, heavyContentReady])

  const handleStepLayout =
    (step: OfferSetupStep) =>
    (e: LayoutChangeEvent): void => {
      stepYsRef.current[step] = e.nativeEvent.layout.y
      if (step === activeStep) scrollToActiveStep()
    }

  const confirmDiscardNewOffer = useCallback(
    () =>
      Effect.gen(function* (_) {
        return yield* _(
          showDialog({
            title: t('offerForm.discardNewOffer'),
            subtitle: t('offerForm.discardNewOfferDescription'),
            positiveButtonText: t('common.discard'),
            positiveButtonVariant: 'destructive',
            negativeButtonText: t('common.goBack'),
          })
        )
      }),
    [showDialog, t]
  )

  usePreventRemove(!!listingType || !!offerType, ({data}) => {
    if (skipExitConfirmationRef.current) {
      navigation.dispatch(data.action)
      return
    }

    void Effect.runPromise(confirmDiscardNewOffer()).then((confirmed) => {
      if (confirmed) {
        navigation.dispatch(data.action)
      }
    })
  })

  const closeAction = useMemo(
    () => ({
      icon: XmarkCancelClose,
      onPress: () => {
        safeGoBack()
      },
    }),
    [safeGoBack]
  )

  const publishOffer = useCallback(() => {
    void Effect.runPromise(createOffer()).then((success) => {
      if (!success) return
      skipExitConfirmationRef.current = true
      navigation.popTo('InsideTabs', {
        screen: 'Marketplace',
        params: {
          initialTab: 'myOffers',
          tabSwitchRequestId: String(Date.now()),
        },
      })
    })
  }, [createOffer, navigation])

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('offerForm.myNewOffer')}
          rightActions={[closeAction]}
        />
      }
    >
      <KeyboardAwareScrollView
        ref={scrollRef}
        bottomOffset={getTokens().space.$5.val}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: insets.bottom + getTokens().space.$5.val,
        }}
      >
        <YStack gap="$5">
          <Stack onLayout={handleStepLayout('listingType')}>
            <ListingTypeStep
              active={activeStep === 'listingType'}
              onEdit={() => {
                setActiveStep('listingType')
              }}
              onComplete={() => {
                setActiveStep('offerType')
              }}
            />
          </Stack>
          {activeStep !== 'listingType' ? (
            <Stack onLayout={handleStepLayout('offerType')}>
              <OfferTypeStep
                active={activeStep === 'offerType'}
                onEdit={() => {
                  setActiveStep('offerType')
                }}
                onComplete={() => {
                  setActiveStep(
                    listingType === 'PRODUCT' ? 'productCategory' : 'amount'
                  )
                }}
              />
            </Stack>
          ) : null}
          {activeStep !== 'offerType' &&
          activeStep !== 'listingType' &&
          listingType === 'PRODUCT' ? (
            <Stack onLayout={handleStepLayout('productCategory')}>
              <ProductCategoryStep
                active={activeStep === 'productCategory'}
                onEdit={() => {
                  setActiveStep('productCategory')
                }}
                onComplete={() => {
                  setActiveStep('amount')
                }}
              />
            </Stack>
          ) : null}
          {activeStep !== 'offerType' &&
          activeStep !== 'listingType' &&
          activeStep !== 'productCategory' ? (
            <Stack onLayout={handleStepLayout('amount')}>
              {listingType === 'BITCOIN' ? (
                <AmountStep
                  active={activeStep === 'amount'}
                  onEdit={() => {
                    setActiveStep('amount')
                  }}
                  onComplete={() => {
                    setActiveStep('location')
                  }}
                />
              ) : (
                <PriceUpToStep
                  active={activeStep === 'amount'}
                  onEdit={() => {
                    setActiveStep('amount')
                  }}
                  onComplete={() => {
                    setActiveStep('location')
                  }}
                />
              )}
            </Stack>
          ) : null}
          {activeStep === 'location' ||
          activeStep === 'network' ||
          activeStep === 'describe' ||
          activeStep === 'language' ||
          activeStep === 'friendLevel' ||
          activeStep === 'clubs' ? (
            <Stack onLayout={handleStepLayout('location')}>
              <LocationStep
                active={activeStep === 'location'}
                onEdit={() => {
                  setActiveStep('location')
                }}
                onComplete={() => {
                  discardLocationIfNotInPerson()
                  setActiveStep('network')
                }}
              />
            </Stack>
          ) : null}
          {activeStep === 'network' ||
          activeStep === 'describe' ||
          activeStep === 'language' ||
          activeStep === 'friendLevel' ||
          activeStep === 'clubs' ? (
            <Stack onLayout={handleStepLayout('network')}>
              <NetworkStep
                active={activeStep === 'network'}
                onEdit={() => {
                  setActiveStep('network')
                }}
                onComplete={() => {
                  setActiveStep('describe')
                }}
              />
            </Stack>
          ) : null}
          {activeStep === 'describe' ||
          activeStep === 'language' ||
          activeStep === 'friendLevel' ||
          activeStep === 'clubs' ? (
            <Stack onLayout={handleStepLayout('describe')}>
              <DescribeStep
                active={activeStep === 'describe'}
                onEdit={() => {
                  setActiveStep('describe')
                }}
                onComplete={() => {
                  setActiveStep('language')
                }}
              />
            </Stack>
          ) : null}
          {activeStep === 'language' ||
          activeStep === 'friendLevel' ||
          activeStep === 'clubs' ? (
            <Stack onLayout={handleStepLayout('language')}>
              <LanguageStep
                active={activeStep === 'language'}
                onEdit={() => {
                  setActiveStep('language')
                }}
                onComplete={() => {
                  setActiveStep('friendLevel')
                }}
              />
            </Stack>
          ) : null}
          {activeStep === 'friendLevel' || activeStep === 'clubs' ? (
            <Stack
              onLayout={(e) => {
                const y = e.nativeEvent.layout.y
                stepYsRef.current.friendLevel = y
                stepYsRef.current.clubs = y
                scrollToActiveStep()
              }}
            >
              <FriendLevelStep
                active={activeStep === 'friendLevel'}
                contentLoading={!heavyContentReady}
                onEdit={() => {
                  setActiveStep('friendLevel')
                }}
                onComplete={() => {
                  setActiveStep('clubs')
                }}
              />
              {activeStep === 'clubs' ? (
                <YStack paddingTop="$5">
                  {heavyContentReady ? (
                    <ClubsStep
                      ctaLabel={t('offerForm.publishOffer')}
                      onComplete={publishOffer}
                    />
                  ) : (
                    <Loader size="large" />
                  )}
                </YStack>
              ) : null}
            </Stack>
          ) : null}
        </YStack>
      </KeyboardAwareScrollView>
    </Screen>
  )
}

export default CRUDOfferFlow
