import SvgImage from '../../../../Image'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import profileIconSvg from '../../../images/profileIconSvg'
import {
  Alert,
  type ColorValue,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native'
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
import {getTokens, Stack, XStack} from 'tamagui'
import {enableHiddenFeatures} from '../../../../../utils/environment'
import notEmpty from '../../../../../utils/notEmpty'
import {useSetAtom} from 'jotai'
import * as TE from 'fp-ts/TaskEither'
import {askAreYouSureActionAtom} from '../../../../AreYouSureDialog'
import {pipe} from 'fp-ts/function'
import {useLogout} from '../../../../../state/useLogout'
import ReportIssue from './ReportIssue'
import {
  changeCurrencyDialogVisibleAtom,
  reportIssueDialogVisibleAtom,
  toggleScreenshotsDisabledActionAtom,
} from '../atoms'
import openUrl from '../../../../../utils/openUrl'
import ChangeCurrency from './ChangeCurrency'
import ContactsImportedTitle from './ContactsImportedTitle'
import SelectedCurrencyTitle from './SelectedCurrencyTitle'
import notificationsIconSvg from '../images/notificationsIconSvg'
import spokenLanguagesSvg from '../../../../images/spokenLanguagesSvg'
import AllowScreenshots from './AllowScreenshots'
import ItemText from './ButtonSectionItemText'
import {isUsingIos17AndAbove} from '../../../../../utils/isUsingIos17AndAbove'
import {changeLanguageActionAtom} from '../actionAtoms'

interface ItemProps {
  text: string | JSX.Element
  icon: SvgString
  iconFill?: ColorValue
  onPress: () => void
  children?: React.ReactNode
  hidden?: boolean
}

function Item({
  text,
  icon,
  iconFill,
  onPress,
  children,
  hidden,
}: ItemProps): JSX.Element | null {
  const tokens = getTokens()
  return !hidden ? (
    <TouchableWithoutFeedback onPress={onPress}>
      <XStack ai="center" h={66} mx="$7">
        <Stack w={24} h={24} mr="$4">
          <SvgImage
            stroke={!iconFill ? tokens.color.greyOnBlack.val : undefined}
            fill={iconFill ?? 'none'}
            source={icon}
          />
        </Stack>
        {children ??
          (typeof text === 'string' ? (
            <Stack f={1}>
              <ItemText>{text}</ItemText>
            </Stack>
          ) : (
            text
          ))}
      </XStack>
    </TouchableWithoutFeedback>
  ) : null
}

function ButtonsSection(): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const logout = useLogout()
  const showAreYouSure = useSetAtom(askAreYouSureActionAtom)
  const setReportIssueDialogVisible = useSetAtom(reportIssueDialogVisibleAtom)
  const setChangeCurrencyDialogVisible = useSetAtom(
    changeCurrencyDialogVisibleAtom
  )
  const toggleScreenshotsDisabled = useSetAtom(
    toggleScreenshotsDisabledActionAtom
  )
  const changeLanguage = useSetAtom(changeLanguageActionAtom)

  function todo(): void {
    Alert.alert('To be implemented')
  }

  const deleteAccountWithAreYouSure = useCallback(async () => {
    return await pipe(
      showAreYouSure({
        variant: 'danger',
        steps: [
          {
            type: 'StepWithText',
            title: t('settings.logoutDialog.title'),
            description: t('settings.logoutDialog.description'),
            positiveButtonText: t('common.yesDelete'),
            negativeButtonText: t('common.nope'),
          },
          {
            type: 'StepWithText',
            title: t('settings.logoutDialog.title2'),
            description: t('settings.logoutDialog.description'),
            positiveButtonText: t('common.yesDelete'),
            negativeButtonText: t('common.nope'),
          },
        ],
      }),
      TE.map(logout)
    )()
  }, [showAreYouSure, t, logout])

  const data: Array<Array<ItemProps | null>> = useMemo(
    () =>
      [
        [
          {
            text: t('common.myOffers'),
            icon: profileIconSvg,
            onPress: () => {
              navigation.navigate('MyOffers')
            },
          },
        ],
        [
          {
            text: t('settings.items.changeProfilePicture'),
            icon: imageIconSvg,
            onPress: () => {
              navigation.navigate('ChangeProfilePicture')
            },
          },
          {
            text: t('settings.items.editName'),
            icon: editIconSvg,
            onPress: () => {
              navigation.navigate('EditName')
            },
          },
          {
            text: t('settings.items.changeLanguage'),
            icon: spokenLanguagesSvg,
            iconFill: getTokens().color.greyOnBlack.val,
            onPress: changeLanguage,
          },
        ],
        [
          {
            text: t('settings.items.contactsImported'),
            icon: contactIconSvg,
            onPress: () => {
              navigation.navigate('SetContacts', {})
            },
            children: <ContactsImportedTitle />,
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
                text: 'CZK',
                icon: coinsIconSvg,
                onPress: () => {
                  setChangeCurrencyDialogVisible(true)
                },
                children: <SelectedCurrencyTitle />,
              },
              {
                text: t('settings.items.allowScreenshots'),
                icon: imageIconSvg,
                onPress: toggleScreenshotsDisabled,
                children: <AllowScreenshots />,
                // not working correctly for iOS 17 and above
                hidden: isUsingIos17AndAbove(),
              },
            ]
          : [
              {
                text: 'CZK',
                icon: coinsIconSvg,
                onPress: () => {
                  setChangeCurrencyDialogVisible(true)
                },
                children: <SelectedCurrencyTitle />,
              },
              {
                text: t('settings.items.allowScreenshots'),
                icon: imageIconSvg,
                onPress: toggleScreenshotsDisabled,
                children: <AllowScreenshots />,
                // not working correctly for iOS 17 and above
                hidden: isUsingIos17AndAbove(),
              },
            ],
        [
          {
            text: t('settings.items.termsAndPrivacy'),
            icon: termsIconSvg,
            onPress: () => {
              navigation.navigate('TermsAndConditions')
            },
          },
          {
            text: t('notifications.preferences.screenTitle'),
            icon: notificationsIconSvg,
            onPress: () => {
              navigation.navigate('NotificationSettings')
            },
          },
          {
            text: t('settings.items.faqs'),
            icon: questionIconSvg,
            onPress: () => {
              navigation.navigate('Faqs')
            },
          },
          {
            text: t('settings.items.reportIssue'),
            icon: customerSupportIconSvg,
            onPress: () => {
              setReportIssueDialogVisible(true)
            },
          },
          {
            text: t('settings.items.inAppLogs'),
            icon: cpuIconSvg,
            onPress: () => {
              navigation.navigate('AppLogs')
            },
          },
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
    [
      changeLanguage,
      deleteAccountWithAreYouSure,
      navigation,
      setChangeCurrencyDialogVisible,
      setReportIssueDialogVisible,
      t,
      toggleScreenshotsDisabled,
    ]
  )

  return (
    <Stack f={1} mt="$7" mx="$2">
      {data.map((group, groupIndex) => (
        <Fragment key={groupIndex}>
          <Stack br="$4" bg="$blackAccent1">
            {group.map((item, itemIndex) => (
              <Fragment key={itemIndex}>
                {item && <Item {...item} />}
                {itemIndex !== group.length - 1 && (
                  <Stack h={2} bg="$grey" als="stretch" ml="$7" />
                )}
              </Fragment>
            ))}
          </Stack>
          {groupIndex !== data.length - 1 && <Stack h={16} />}
        </Fragment>
      ))}
      <ReportIssue />
      <ChangeCurrency />
    </Stack>
  )
}

export default ButtonsSection
