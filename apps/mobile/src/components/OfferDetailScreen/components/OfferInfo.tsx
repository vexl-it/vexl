import {Stack, YStack} from 'tamagui'
import OfferWithBubbleTip from '../../OfferWithBubbleTip'
import ScreenTitle from '../../ScreenTitle'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {ScrollView} from 'react-native'
import IconButton from '../../IconButton'
import flagSvg from '../images/flagSvg'
import {useReportOfferHandleUI} from '../api'
import {useChatWithMessagesForOffer} from '../../../state/chat/hooks/useChatForOffer'
import React, {useCallback, useMemo, useState} from 'react'
import InfoSquare from '../../InfoSquare'
import closeSvg from '../../images/closeSvg'
import CommonFriends from '../../CommonFriends'
import {useAtomValue, useSetAtom} from 'jotai'
import Info from '../../Info'
import {type RequestState} from '../../../state/chat/domain'
import {
  canChatBeRequested,
  getRequestState,
} from '../../../state/chat/utils/offerStates'
import showCommonFriendsExplanationUIActionAtom from '../atoms'
import identityIconSvg from '../../images/identityIconSvg'
import Button from '../../Button'
import {pipe} from 'fp-ts/function'
import * as TO from 'fp-ts/TaskOption'
import {sendRequestHandleUIActionAtom} from '../../../state/chat/atoms/sendRequestActionAtom'
import OfferRequestTextInput from '../../OfferRequestTextInput'
import {offerRerequestLimitDaysAtom} from '../../../utils/remoteConfig/atoms'
import {type RootStackScreenProps} from '../../../navigationTypes'
import RerequestInfo from './RerequestInfo'
import {type OneOfferInState} from '@vexl-next/domain/dist/general/offers'
import randomName from '../../../utils/randomName'
import {friendLevelBannerPreferenceAtom} from '../../../utils/preferences'

function OfferInfo({
  offer,
  navigation,
}: {
  offer: OneOfferInState
  navigation: RootStackScreenProps<'OfferDetail'>['navigation']
}): JSX.Element {
  const goBack = useSafeGoBack()
  const {t} = useTranslation()
  const reportOffer = useReportOfferHandleUI()
  const submitRequest = useSetAtom(sendRequestHandleUIActionAtom)
  const [text, setText] = useState('')
  const offerRerequestLimitDays = useAtomValue(offerRerequestLimitDaysAtom)
  const chatForOffer = useChatWithMessagesForOffer({
    offerPublicKey: offer.offerInfo.publicPart.offerPublicKey,
  })

  const showCommonFriendsExplanationUIAction = useSetAtom(
    showCommonFriendsExplanationUIActionAtom
  )

  const spokenLanguagesText = useMemo(
    () =>
      offer.offerInfo.publicPart.spokenLanguages
        ?.map((lang) => t(`offerForm.spokenLanguages.${lang}`))
        .join(', '),
    [offer.offerInfo.publicPart.spokenLanguages, t]
  )

  const requestState: RequestState = useMemo(
    () => (chatForOffer ? getRequestState(chatForOffer) : 'initial'),
    [chatForOffer]
  )
  const requestPossibleInfo = useMemo(() => {
    if (!chatForOffer)
      return {
        canBeRerequested: true,
      } as const

    return canChatBeRequested(chatForOffer, offerRerequestLimitDays)
  }, [chatForOffer, offerRerequestLimitDays])

  const onWhatDoesThisMeanPressed = useCallback(() => {
    void showCommonFriendsExplanationUIAction({offer})
  }, [showCommonFriendsExplanationUIAction, offer])

  const onRequestPressed = useCallback(() => {
    if (!text.trim()) return
    void pipe(
      submitRequest({text, originOffer: offer}),
      TO.map((chat) => {
        navigation.replace('ChatDetail', {
          chatId: chat.id,
          inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
        })
      })
    )()
  }, [navigation, offer, submitRequest, text])

  const showRequestButton =
    !chatForOffer || requestPossibleInfo.canBeRerequested

  const friendLevel = (() => {
    if (offer.offerInfo.privatePart.friendLevel.includes('FIRST_DEGREE'))
      return t('offer.directFriend')
    return t('offer.friendOfFriend')
  })()

  return (
    <Stack f={1} mx={'$2'} my={'$4'}>
      <ScreenTitle text={t('offer.title')}>
        {!offer.flags.reported && (
          <IconButton
            variant={'dark'}
            icon={flagSvg}
            onPress={() => {
              void reportOffer(offer.offerInfo.offerId)()
            }}
          />
        )}
        <IconButton variant="dark" icon={closeSvg} onPress={goBack} />
      </ScreenTitle>
      <ScrollView>
        <YStack space={'$2'} mb="$2">
          <OfferWithBubbleTip
            hideSpokenLanguages
            negative={!requestPossibleInfo.canBeRerequested}
            offer={offer}
          />
          <CommonFriends
            variant={'dark'}
            contactsHashes={offer.offerInfo.privatePart.commonFriends}
          />
          <Info
            visibleStateAtom={friendLevelBannerPreferenceAtom}
            text={t('common.whatDoesThisMean', {term: friendLevel})}
            actionButtonText={t('common.learnMore')}
            onActionPress={onWhatDoesThisMeanPressed}
          />
          {offer.offerInfo.publicPart.spokenLanguages.length > 0 && (
            <InfoSquare>
              {t('offer.offerAuthorSpeaks', {
                name:
                  chatForOffer?.chat.otherSide?.realLifeInfo?.userName ??
                  randomName(offer.offerInfo.offerId),
                spokenLanguages: spokenLanguagesText,
              })}
            </InfoSquare>
          )}
          <InfoSquare>{t(`offer.requestStatus.${requestState}`)}</InfoSquare>
          {showRequestButton && (
            <OfferRequestTextInput text={text} onChange={setText} />
          )}
        </YStack>
      </ScrollView>

      {showRequestButton ? (
        <Button
          disabled={!text.trim()}
          onPress={onRequestPressed}
          variant={'secondary'}
          beforeIcon={identityIconSvg}
          text={t('offer.sendRequest')}
        />
      ) : (
        <>
          {requestState === 'cancelled' || requestState === 'deleted' ? (
            <RerequestInfo chat={chatForOffer} />
          ) : (
            <Button
              onPress={() => {
                if (!chatForOffer) return
                navigation.navigate('ChatDetail', {
                  chatId: chatForOffer.chat.id,
                  inboxKey:
                    chatForOffer.chat.inbox.privateKey.publicKeyPemBase64,
                })
              }}
              variant="primary"
              text={t('offer.goToChat')}
            />
          )}
        </>
      )}
    </Stack>
  )
}

export default OfferInfo
