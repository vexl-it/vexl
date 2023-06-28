import {type OneOfferInState} from '../../../state/marketplace/domain'
import {getTokens, Stack, YStack} from 'tamagui'
import OfferWithBubbleTip from '../../OfferWithBubbleTip'
import ScreenTitle from '../../ScreenTitle'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {
  translationAtom,
  useTranslation,
} from '../../../utils/localization/I18nProvider'
import * as TE from 'fp-ts/TaskEither'
import {ScrollView, StyleSheet} from 'react-native'
import TextInput from '../../Input'
import Button from '../../Button'
import IconButton from '../../IconButton'
import flagSvg from '../images/flagSvg'
import {useReportOfferHandleUI, useSubmitRequestHandleUI} from '../api'
import React, {useMemo, useState} from 'react'
import {useChatForOffer} from '../../../state/chat/hooks/useChatForOffer'
import {useNavigation} from '@react-navigation/native'
import InfoSquare from '../../InfoSquare'
import closeSvg from '../../images/closeSvg'
import identityIconSvg from '../../images/identityIconSvg'
import CommonFriends from '../../CommonFriends'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import createChatStatusAtom from '../../../state/chat/atoms/createChatStatusAtom'
import Info from '../../Info'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import {pipe} from 'fp-ts/function'

const style = StyleSheet.create({
  textInput: {
    minHeight: 130,
    alignItems: 'flex-start',
  },
})

const showCommonFriendsExplanationUIActionAtom = atom(
  null,
  async (get, set, params: {offer: OneOfferInState}) => {
    const {t} = get(translationAtom)
    const {offer} = params

    const modalContent = (() => {
      if (offer.offerInfo.privatePart.friendLevel.includes('FIRST_DEGREE')) {
        if (offer.offerInfo.privatePart.commonFriends.length === 0) {
          return {
            title: t('offer.offerFromDirectFriend'),
            description: `${t('offer.youSeeThisOfferBecause')} ${t(
              'offer.beCautiousWeCannotVerify'
            )}`,
            positiveButtonText: t('common.gotIt'),
          }
        }
        return {
          title: t('offer.offerFromDirectFriend'),
          description: `${t('offer.youSeeThisOfferBecause')} ${t(
            'offer.dontForgetToVerifyTheIdentity'
          )}`,
          positiveButtonText: t('common.gotIt'),
        }
      }
      return {
        title: t('offer.offerFromFriendOfFriend'),
        description: t('offer.noDirectConnection'),
        positiveButtonText: t('common.gotIt'),
      }
    })()

    return await pipe(
      set(askAreYouSureActionAtom, {
        steps: [{...modalContent, type: 'StepWithText'}],
        variant: 'info',
      }),
      TE.match(
        () => {
          return false
        },
        () => {
          return true
        }
      )
    )()
  }
)

function OfferInfo({offer}: {offer: OneOfferInState}): JSX.Element {
  const goBack = useSafeGoBack()
  const navigation = useNavigation()
  const {t} = useTranslation()
  const reportOffer = useReportOfferHandleUI()
  const submitRequest = useSubmitRequestHandleUI()
  const [text, setText] = useState('')
  const chatForOffer = useChatForOffer({
    offerPublicKey: offer.offerInfo.publicPart.offerPublicKey,
  })

  const showCommonFriendsExplanationUIAction = useSetAtom(
    showCommonFriendsExplanationUIActionAtom
  )
  const requestStatus = useAtomValue(
    useMemo(() => {
      if (!chatForOffer) return atom(() => null)
      return createChatStatusAtom(
        chatForOffer.id,
        chatForOffer.inbox.privateKey.publicKeyPemBase64
      )
    }, [chatForOffer])
  )

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
        <YStack space={'$4'}>
          <OfferWithBubbleTip negative={!!chatForOffer} offer={offer} />
          <CommonFriends
            variant={'dark'}
            contactsHashes={offer.offerInfo.privatePart.commonFriends}
          />
          <Info
            text={t('common.whatDoesThisMean')}
            actionButtonText={t('common.learnMore')}
            onActionPress={() => {
              void showCommonFriendsExplanationUIAction({offer})
            }}
          />
          {!chatForOffer ? (
            <TextInput
              style={style.textInput}
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={5}
              variant={'greyOnBlack'}
              placeholder={t('offer.inputPlaceholder')}
              placeholderTextColor={getTokens().color.greyOnBlack.val}
            />
          ) : (
            <InfoSquare>
              {t(`offer.requestStatus.${requestStatus ?? 'requested'}`)}
            </InfoSquare>
          )}
        </YStack>
      </ScrollView>
      {chatForOffer ? (
        <Button
          onPress={() => {
            if (!chatForOffer) return
            navigation.navigate('ChatDetail', {
              chatId: chatForOffer.id,
              inboxKey: chatForOffer.inbox.privateKey.publicKeyPemBase64,
            })
          }}
          variant={'primary'}
          text={t('offer.goToChat')}
        />
      ) : (
        <Button
          disabled={!text.trim()}
          onPress={() => {
            if (!text.trim()) return
            void submitRequest(text, offer.offerInfo)()
          }}
          variant={'secondary'}
          beforeIcon={identityIconSvg}
          text={t('offer.sendRequest')}
        />
      )}
    </Stack>
  )
}

export default OfferInfo
