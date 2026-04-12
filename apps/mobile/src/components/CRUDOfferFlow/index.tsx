import {
  Button,
  EditRow,
  KeyboardAvoidingView,
  NavigationBar,
  Screen,
} from '@vexl-next/ui'
import {XmarkCancelClose} from '@vexl-next/ui/src/icons'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect, useMemo, useState} from 'react'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {getTokens, ScrollView, YStack} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {globalDialogAtom} from '../GlobalDialog'
import FriendLevel from '../OfferForm/components/FriendLevel'
import numberOfFriendsAtom from './atoms/numberOfFriendsAtom'
import {offerFormMolecule} from './atoms/offerFormStateAtoms'
import AmountStep from './components/AmountStep'
import ClubsStep from './components/ClubsStep'
import DescribeStep from './components/DescribeStep'
import LanguageStep from './components/LanguageStep'
import ListingTypeStep from './components/ListingTypeStep'
import LocationStep from './components/LocationStep'
import NetworkStep from './components/NetworkStep'
import OfferTypeStep from './components/OfferTypeStep'
import PriceUpToStep from './components/PriceUpToStep'
import ProductCategoryStep from './components/ProductCategoryStep'

type OfferSetupStep =
  | 'offerType'
  | 'listingType'
  | 'productCategory'
  | 'amount'
  | 'location'
  | 'network'
  | 'describe'
  | 'language'
  | 'friendLevel'
  | 'clubs'

function CRUDOfferFlow(): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const {
    offerTypeAtom,
    listingTypeAtom,
    initializeValuesForOfferFormActionAtom,
    intendedConnectionLevelAtom,
  } = useMolecule(offerFormMolecule)
  const offerType = useAtomValue(offerTypeAtom)
  const listingType = useAtomValue(listingTypeAtom)
  const intendedConnectionLevel = useAtomValue(intendedConnectionLevelAtom)
  const numberOfFriends = useAtomValue(numberOfFriendsAtom)
  const showDialog = useSetAtom(globalDialogAtom)
  const initializeValuesForOfferForm = useSetAtom(
    initializeValuesForOfferFormActionAtom
  )
  const insets = useSafeAreaInsets()

  useEffect(() => {
    void Effect.runPromise(initializeValuesForOfferForm())
  }, [initializeValuesForOfferForm])
  const [activeStep, setActiveStep] = useState<OfferSetupStep>(() => {
    if (listingType) return 'amount'
    if (offerType) return 'listingType'
    return 'offerType'
  })

  const friendLevelReachLabel = (() => {
    const effectiveConnectionLevel = intendedConnectionLevel ?? 'FIRST'
    const friendLevelLabel =
      effectiveConnectionLevel === 'FIRST'
        ? t('offerForm.friendLevel.firstDegree')
        : t('offerForm.friendLevel.secondDegree')

    if (numberOfFriends.state === 'loading') {
      return `${friendLevelLabel} (${t('common.loading')})`
    }

    if (numberOfFriends.state === 'error') {
      return `${friendLevelLabel} (${t('offerForm.friendLevel.noVexlers')})`
    }

    const reachCount =
      effectiveConnectionLevel === 'FIRST'
        ? numberOfFriends.firstLevelFriendsCount
        : numberOfFriends.firstAndSecondLevelFriendsCount

    return `${friendLevelLabel} (${t('offerForm.friendLevel.reachVexlersInline', {count: reachCount})})`
  })()
  const areFriendLevelCountsLoading = numberOfFriends.state === 'loading'

  const closeAction = useMemo(
    () => ({
      icon: XmarkCancelClose,
      onPress: () => {
        if (!offerType) {
          safeGoBack()
          return
        }
        void Effect.runPromise(
          Effect.gen(function* (_) {
            const confirmed = yield* _(
              showDialog({
                title: t('offerForm.discardNewOffer'),
                subtitle: t('offerForm.discardNewOfferDescription'),
                positiveButtonText: t('common.discard'),
                positiveButtonVariant: 'destructive',
                negativeButtonText: t('common.goBack'),
              })
            )
            if (confirmed) {
              safeGoBack()
            }
          })
        )
      },
    }),
    [offerType, safeGoBack, showDialog, t]
  )

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
      <KeyboardAvoidingView>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: insets.bottom + getTokens().space.$5.val,
          }}
        >
          <YStack gap="$5">
            <OfferTypeStep
              active={activeStep === 'offerType'}
              onEdit={() => {
                setActiveStep('offerType')
              }}
              onComplete={() => {
                setActiveStep('listingType')
              }}
            />
            {activeStep !== 'offerType' ? (
              <ListingTypeStep
                active={activeStep === 'listingType'}
                onEdit={() => {
                  setActiveStep('listingType')
                }}
                onComplete={(type) => {
                  setActiveStep(
                    type === 'PRODUCT' ? 'productCategory' : 'amount'
                  )
                }}
              />
            ) : null}
            {activeStep !== 'offerType' &&
            activeStep !== 'listingType' &&
            listingType === 'PRODUCT' ? (
              <ProductCategoryStep
                active={activeStep === 'productCategory'}
                onEdit={() => {
                  setActiveStep('productCategory')
                }}
                onComplete={() => {
                  setActiveStep('amount')
                }}
              />
            ) : null}
            {activeStep !== 'offerType' &&
            activeStep !== 'listingType' &&
            activeStep !== 'productCategory' ? (
              listingType === 'BITCOIN' ? (
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
              )
            ) : null}
            {activeStep === 'location' ||
            activeStep === 'network' ||
            activeStep === 'describe' ||
            activeStep === 'language' ||
            activeStep === 'friendLevel' ||
            activeStep === 'clubs' ? (
              <LocationStep
                active={activeStep === 'location'}
                onEdit={() => {
                  setActiveStep('location')
                }}
                onComplete={() => {
                  setActiveStep('network')
                }}
              />
            ) : null}
            {activeStep === 'network' ||
            activeStep === 'describe' ||
            activeStep === 'language' ||
            activeStep === 'friendLevel' ||
            activeStep === 'clubs' ? (
              <NetworkStep
                active={activeStep === 'network'}
                onEdit={() => {
                  setActiveStep('network')
                }}
                onComplete={() => {
                  setActiveStep('describe')
                }}
              />
            ) : null}
            {activeStep === 'describe' ||
            activeStep === 'language' ||
            activeStep === 'friendLevel' ||
            activeStep === 'clubs' ? (
              <DescribeStep
                active={activeStep === 'describe'}
                onEdit={() => {
                  setActiveStep('describe')
                }}
                onComplete={() => {
                  setActiveStep('language')
                }}
              />
            ) : null}
            {activeStep === 'language' ||
            activeStep === 'friendLevel' ||
            activeStep === 'clubs' ? (
              <LanguageStep
                active={activeStep === 'language'}
                onEdit={() => {
                  setActiveStep('language')
                }}
                onComplete={() => {
                  setActiveStep('friendLevel')
                }}
              />
            ) : null}
            {activeStep === 'friendLevel' || activeStep === 'clubs' ? (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <YStack>
                  {activeStep === 'friendLevel' ? (
                    <>
                      <EditRow
                        state="initial"
                        headline={t('offerForm.whoCanSeeYourOffer')}
                      />
                      <YStack gap="$5" paddingVertical="$5">
                        <FriendLevel
                          intendedConnectionLevelAtom={
                            intendedConnectionLevelAtom
                          }
                        />
                        <Button
                          variant="primary"
                          size="large"
                          disabled={areFriendLevelCountsLoading}
                          onPress={() => {
                            setActiveStep('clubs')
                          }}
                        >
                          {t('offerForm.next')}
                        </Button>
                      </YStack>
                    </>
                  ) : (
                    <YStack gap="$5">
                      <EditRow
                        state="completed"
                        overline={t('offerForm.whoCanSeeYourOffer')}
                        headline={friendLevelReachLabel}
                        onPress={() => {
                          setActiveStep('friendLevel')
                        }}
                      />
                      <ClubsStep />
                    </YStack>
                  )}
                </YStack>
              </Animated.View>
            ) : null}
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default CRUDOfferFlow
