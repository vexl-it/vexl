import {useTranslation} from '../../utils/localization/I18nProvider'
import Screen from '../Screen'
import {Alert} from 'react-native'
import {useNavigation} from '@react-navigation/native'
import useContent from './useContent'
import Button from '../Button'
import {Stack} from 'tamagui'
import {useCreateOffer} from '../../state/marketplace'
import {useSetAtom, useStore} from 'jotai'
import {
  createOfferStateAtom,
  createOfferInitialState,
  secondDegreeFriendsCountAtom,
} from './state/atom'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {generateKeyPair} from '@vexl-next/resources-utils/src/utils/crypto'
import React, {useCallback, useEffect, useState} from 'react'
import OfferEncryptionProgress from './components/OfferEncryptionProgress'
import {usePrivateApiAssumeLoggedIn} from '../../api'
import {MAX_PAGE_SIZE} from '@vexl-next/rest-api/dist/Pagination.brand'
import reportError from '../../utils/reportError'
import CreateOfferContent from './components/CreateOfferContent'
import useCreateInbox from '../../state/chat/hooks/useCreateInbox'
import KeyboardAvoidingView from '../KeyboardAvoidingView'

function CreateOfferScreen(): JSX.Element {
  const {t} = useTranslation()
  const content = useContent()
  const navigation = useNavigation()
  const privateApi = usePrivateApiAssumeLoggedIn()
  const createOffer = useCreateOffer()
  const createInbox = useCreateInbox()

  const setSecondDegreeFriendCountAtom = useSetAtom(
    secondDegreeFriendsCountAtom
  )
  const store = useStore()
  const [encryptingOffer, setEncryptingOffer] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const fetchFriendsOnEachLevel = useCallback(() => {
    void pipe(
      privateApi.contact.fetchMyContacts({
        page: 0,
        limit: MAX_PAGE_SIZE,
        level: 'SECOND',
      }),
      TE.match(
        (e) => {
          reportError('error', `Error while getting contact levels`, e)
        },
        (data) => {
          setSecondDegreeFriendCountAtom(data.itemsCountTotal)
        }
      )
    )()
  }, [privateApi.contact, setSecondDegreeFriendCountAtom])

  const onPublishOfferPress = useCallback((): void => {
    const {
      connectionLevel,
      secondDegreeFriendsCount,
      offerDescription,
      location,
      locationState,
      ...publicPayload
    } = store.get(createOfferStateAtom)

    if (locationState === 'IN_PERSON' && location.length === 0) {
      Alert.alert(t('createOffer.errorLocationNotFilled'))
      return
    }

    if (offerDescription.trim() === '') {
      Alert.alert(t('createOffer.errorDescriptionNotFilled'))
      return
    }

    setEncryptingOffer(true)
    setLoading(true)
    void pipe(
      generateKeyPair(),
      TE.fromEither,
      TE.bindTo('key'),
      TE.bindW('createdOffer', ({key}) =>
        createOffer({
          payloadPublic: {
            offerPublicKey: key.publicKeyPemBase64,
            location,
            locationState,
            offerDescription: offerDescription.trim(),
            ...publicPayload,
          },
          connectionLevel,
        })
      ),
      TE.chainFirstW(({key, createdOffer}) =>
        createInbox({privateKey: key, offerId: createdOffer.offerInfo.offerId})
      ),
      TE.match(
        (e) => {
          Alert.alert(t('createOffer.errorCreatingOffer'))
          setLoading(false)
        },
        () => {
          setLoading(false)
          store.set(createOfferStateAtom, createOfferInitialState)
          const timeout = setTimeout(() => {
            setEncryptingOffer(false)
            clearTimeout(timeout)
            // TODO navigate to my offer detail instead
            navigation.navigate('InsideTabs', {
              screen: 'Marketplace',
            })
          }, 3000)
        }
      )
    )()
  }, [createInbox, createOffer, navigation, store, t])

  useEffect(() => {
    fetchFriendsOnEachLevel()
  }, [fetchFriendsOnEachLevel])

  return (
    <>
      <Screen customHorizontalPadding={0} customVerticalPadding={32}>
        <KeyboardAvoidingView>
          <CreateOfferContent
            content={content}
            onClosePress={() => {
              navigation.goBack()
            }}
          />
          <Stack px="$4" py="$4" bc="transparent">
            <Button
              text={t('createOffer.publishOffer')}
              onPress={onPublishOfferPress}
              variant="secondary"
            />
          </Stack>
        </KeyboardAvoidingView>
      </Screen>
      {encryptingOffer && (
        <OfferEncryptionProgress loading={loading} visible={encryptingOffer} />
      )}
    </>
  )
}

export default CreateOfferScreen
