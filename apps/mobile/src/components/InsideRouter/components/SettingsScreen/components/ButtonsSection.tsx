import SvgImage from '../../../../Image'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import profileIconSvg from '../../../images/profileIconSvg'
import {Alert, Linking, Platform, TouchableWithoutFeedback} from 'react-native'
import imageIconSvg from '../images/imageIconSvg'
import {Fragment, useCallback, useMemo} from 'react'
import editIconSvg from '../images/editIconSvg'
import trashIconSvg from '../images/trashIconSvg'
import webIconSvg from '../images/webIconSvg'
import mediumIconSvg from '../images/mediumIconSvg'
import twitterIconSvg from '../images/twitterIconSvg'
import dataIconSvg from '../images/dataIconSvg'
import cpuIconSvg from '../images/cpuIconSvg'
import customerSupportIconSvg from '../images/customerSupportIconSvg'
import questionIconSvg from '../images/questionIconSvg'
import termsIconSvg from '../images/termsIconSvg'
import coinsIconSvg from '../images/coinsIconSvg'
import faceIdIconSvg from '../images/faceIdIconSvg'
import contactIconSvg from '../images/contactIconSvg'
import {useNavigation} from '@react-navigation/native'
import {useLogout} from '../../../../../state/session'
import {getTokens, Stack, styled, Text, XStack} from 'tamagui'
import {enableHiddenFeatures} from '../../../../../utils/environment'
import notEmpty from '../../../../../utils/notEmpty'
import {useSetAtom, useStore} from 'jotai'
import * as TE from 'fp-ts/TaskEither'
import {askAreYouSureActionAtom} from '../../../../AreYouSureDialog'
import {pipe} from 'fp-ts/function'
import {deleteOffersAtom} from '../../../../../state/marketplace'
import {myOffersAtom} from '../../../../../state/marketplace/atom'

const ItemText = styled(Text, {
  fos: 18,
})

function Item({
  text,
  icon,
  onPress,
}: {
  text: string | JSX.Element
  icon: SvgString
  onPress: () => void
}): JSX.Element {
  const tokens = getTokens()
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <XStack ai="center" h={66} mx="$7">
        <Stack w={24} h={24} mr="$4">
          <SvgImage stroke={tokens.color.greyOnBlack.val} source={icon} />
        </Stack>
        {typeof text === 'string' ? (
          <ItemText ff="$body500" col="$white">
            {text}
          </ItemText>
        ) : (
          text
        )}
      </XStack>
    </TouchableWithoutFeedback>
  )
}

function ButtonsSection(): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const logout = useLogout()
  const store = useStore()
  const showAreYouSure = useSetAtom(askAreYouSureActionAtom)
  const deleteMyOffers = useSetAtom(deleteOffersAtom)

  function todo(): void {
    Alert.alert('To be implemented')
  }

  function openUrl(url: string): () => void {
    return () => {
      void Linking.openURL(url)
    }
  }

  const deleteAccountWithAreYouSure = useCallback(async () => {
    return await pipe(
      showAreYouSure({
        variant: 'danger',
        steps: [
          {
            title: t('settings.logoutDialog.title'),
            description: t('settings.logoutDialog.description'),
            positiveButtonText: t('common.yesDelete'),
            negativeButtonText: t('common.nope'),
          },
          {
            title: t('settings.logoutDialog.title2'),
            description: t('settings.logoutDialog.description'),
            positiveButtonText: t('common.yesDelete'),
            negativeButtonText: t('common.nope'),
          },
        ],
      }),
      TE.chainW(() =>
        deleteMyOffers({
          adminIds: store
            .get(myOffersAtom)
            .map((offer) => offer.ownershipInfo?.adminId)
            .filter(notEmpty),
        })
      ),
      TE.map(logout)
    )()
  }, [showAreYouSure, t, logout, deleteMyOffers, store])

  const data: Array<
    Array<{icon: SvgString; text: string | JSX.Element; onPress: () => void}>
  > = useMemo(
    () =>
      [
        enableHiddenFeatures
          ? [
              {
                text: t('settings.items.myOffers'),
                icon: profileIconSvg,
                onPress: todo,
              },
            ]
          : null,
        enableHiddenFeatures
          ? [
              {
                text: t('settings.items.changeProfilePicture'),
                icon: imageIconSvg,
                onPress: todo,
              },
              {
                text: t('settings.items.editName'),
                icon: editIconSvg,
                onPress: todo,
              },
            ]
          : null,
        [
          {
            text: t('settings.items.contactsImported'),
            icon: contactIconSvg,
            onPress: () => {
              navigation.navigate('SetContacts')
            },
          },
        ],
        enableHiddenFeatures
          ? [
              {
                text: `${t('settings.items.setPin')} ${
                  Platform.OS === 'ios'
                    ? ` / ${t('settings.items.faceId')}`
                    : ''
                }`,
                icon: faceIdIconSvg,
                onPress: todo,
              },
              {
                text: t('settings.items.czechCrown'),
                icon: coinsIconSvg,
                onPress: todo,
              },
              {
                text: t('settings.items.allowScreenshots'),
                icon: imageIconSvg,
                onPress: todo,
              },
            ]
          : null,
        [
          {
            text: t('settings.items.termsAndPrivacy'),
            icon: termsIconSvg,
            onPress: () => {
              navigation.navigate('TermsAndConditions')
            },
          },
          {
            text: t('settings.items.faqs'),
            icon: questionIconSvg,
            onPress: () => {
              navigation.navigate('Faqs')
            },
          },
          enableHiddenFeatures
            ? {
                text: t('settings.items.reportIssue'),
                icon: customerSupportIconSvg,
                onPress: todo,
              }
            : null,
          enableHiddenFeatures
            ? {
                text: t('settings.items.inAppLogs'),
                icon: cpuIconSvg,
                onPress: todo,
              }
            : null,
        ].filter(notEmpty),
        enableHiddenFeatures
          ? [
              {
                text: t('settings.items.requestKnownData'),
                icon: dataIconSvg,
                onPress: todo,
              },
            ]
          : null,
        [
          {
            text: (
              <ItemText ff="$body500" col="$greyOnBlack">
                {t('settings.items.followUsOn')}{' '}
                <ItemText ff="$body500" col="$white">
                  {t('settings.items.twitter')}
                </ItemText>
              </ItemText>
            ),
            icon: twitterIconSvg,
            onPress: openUrl(t('settings.items.twitterUrl')),
          },
          {
            text: (
              <ItemText ff="$body500" col="$greyOnBlack">
                {t('settings.items.readMoreOn')}{' '}
                <ItemText ff="$body500" col="$white">
                  {t('settings.items.medium')}
                </ItemText>
              </ItemText>
            ),
            icon: mediumIconSvg,
            onPress: openUrl(t('settings.items.mediumUrl')),
          },
          {
            text: (
              <ItemText ff="$body500" col="$greyOnBlack">
                {t('settings.items.learnMoreOn')}{' '}
                <ItemText ff="$body500" col="$white">
                  {t('settings.items.website')}
                </ItemText>
              </ItemText>
            ),
            icon: webIconSvg,
            onPress: openUrl(`${t('settings.items.websiteUrl')}`),
          },
        ],
        [
          {
            text: (
              <ItemText ff="$body500" col="$red">
                {t('settings.items.deleteAccount')}
              </ItemText>
            ),
            icon: trashIconSvg,
            onPress: deleteAccountWithAreYouSure,
          },
        ],
      ].filter(notEmpty),
    [deleteAccountWithAreYouSure, navigation, t]
  )

  return (
    <Stack f={1} mt="$7" mx="$2">
      {data.map((group, groupIndex) => (
        <Fragment key={groupIndex}>
          <Stack br="$4" bg="$blackAccent1">
            {group.map((item, itemIndex) => (
              <Fragment key={itemIndex}>
                <Item {...item} />
                {itemIndex !== group.length - 1 && (
                  <Stack h={2} bg="$grey" als="stretch" ml="$7" />
                )}
              </Fragment>
            ))}
          </Stack>
          {groupIndex !== data.length - 1 && <Stack h={16} />}
        </Fragment>
      ))}
    </Stack>
  )
}

export default ButtonsSection
