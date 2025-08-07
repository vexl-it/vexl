import {useNavigation} from '@react-navigation/native'
import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect} from 'effect'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {useSetAtom} from 'jotai'
import {Fragment, useCallback, useMemo} from 'react'
import {
  Alert,
  Platform,
  TouchableWithoutFeedback,
  type ColorValue,
} from 'react-native'
import {Stack, XStack, getTokens} from 'tamagui'
import chevronRightSvg from '../../../../../images/chevronRightSvg'
import {useLogout} from '../../../../../state/useLogout'
import {enableHiddenFeatures} from '../../../../../utils/environment'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import notEmpty from '../../../../../utils/notEmpty'
import openUrl from '../../../../../utils/openUrl'
import {defaultCurrencyAtom} from '../../../../../utils/preferences'
import {askAreYouSureActionAtom} from '../../../../AreYouSureDialog'
import CurrencySelect from '../../../../CurrencySelect'
import SvgImage from '../../../../Image'
import editIconSvg from '../../../../images/editIconSvg'
import spokenLanguagesSvg from '../../../../images/spokenLanguagesSvg'
import {
  changeLanguageActionAtom,
  showVexlNitroPhoneCooperationBannerActionAtom,
} from '../actionAtoms'
import {
  changeCurrencyDialogVisibleAtom,
  toggleScreenshotsDisabledActionAtom,
} from '../atoms'
import coinsIconSvg from '../images/coinsIconSvg'
import contactIconSvg from '../images/contactIconSvg'
import cpuIconSvg from '../images/cpuIconSvg'
import customerSupportIconSvg from '../images/customerSupportIconSvg'
import dataIconSvg from '../images/dataIconSvg'
import donationsSvg from '../images/donationsSvg'
import eventsAndClubsSvg from '../images/eventsAndClubsSvg'
import faceIdIconSvg from '../images/faceIdIconSvg'
import glassesSvg from '../images/glassesSvg'
import imageIconSvg from '../images/imageIconSvg'
import notificationsIconSvg from '../images/notificationsIconSvg'
import popularSvg from '../images/popularSvg'
import questionIconSvg from '../images/questionIconSvg'
import termsIconSvg from '../images/termsIconSvg'
import trashIconSvg from '../images/trashIconSvg'
import webIconSvg from '../images/webIconSvg'
import xSvg from '../images/xIconSvg'
import AllowScreenshots from './AllowScreenshots'
import ItemText from './ButtonSectionItemText'
import ContactsImportedTitle from './ContactsImportedTitle'
import {reportIssueDialogAtom} from './ReportIssue'
import SelectedCurrencyTitle from './SelectedCurrencyTitle'

interface ItemProps {
  text: string | JSX.Element
  icon: SvgString
  iconFill?: ColorValue
  navigatesFurther?: boolean
  onPress: () => void
  children?: React.ReactNode
  hidden?: boolean
  testID?: string
}

function Item({
  testID,
  text,
  icon,
  iconFill,
  navigatesFurther,
  onPress,
  children,
  hidden,
}: ItemProps): JSX.Element | null {
  const tokens = getTokens()
  return !hidden ? (
    <TouchableWithoutFeedback testID={testID} onPress={onPress}>
      <XStack ai="center" jc="space-between" h={66} ml="$7" mr="$4">
        <XStack f={1} ai="center">
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
              <Stack f={1}>{text}</Stack>
            ))}
        </XStack>
        {!!navigatesFurther && (
          <SvgImage
            source={chevronRightSvg}
            stroke={tokens.color.greyOnBlack.val}
          />
        )}
      </XStack>
    </TouchableWithoutFeedback>
  ) : null
}

function ButtonsSection(): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const logout = useLogout()
  const showAreYouSure = useSetAtom(askAreYouSureActionAtom)
  const setChangeCurrencyDialogVisible = useSetAtom(
    changeCurrencyDialogVisibleAtom
  )
  const setReportIssueDialogVisible = useSetAtom(reportIssueDialogAtom)
  const setDefaultCurrency = useSetAtom(defaultCurrencyAtom)
  const toggleScreenshotsDisabled = useSetAtom(
    toggleScreenshotsDisabledActionAtom
  )
  const changeLanguage = useSetAtom(changeLanguageActionAtom)
  const showVexlNitroPhoneCooperationBanner = useSetAtom(
    showVexlNitroPhoneCooperationBannerActionAtom
  )

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
      effectToTaskEither,
      TE.map(logout)
    )()
  }, [showAreYouSure, t, logout])

  const data: Array<Array<ItemProps | null>> = useMemo(
    () =>
      [
        [
          {
            testID: '@buttonsSection/eventsAndClubsButton',
            text: t('settings.items.eventsAndClubs'),
            icon: eventsAndClubsSvg,
            onPress: () => {
              navigation.navigate('EventsAndClubs', {
                screen: 'Events',
              })
            },
          },
        ],
        [
          {
            testID: '@buttonsSection/changeProfilePictureButton',
            text: t('settings.items.changeProfilePicture'),
            icon: imageIconSvg,
            navigatesFurther: true,
            onPress: () => {
              navigation.navigate('ChangeProfilePicture')
            },
          },
          {
            testID: '@buttonsSection/editNameButton',
            text: t('settings.items.editName'),
            icon: editIconSvg,
            navigatesFurther: true,
            onPress: () => {
              navigation.navigate('EditName')
            },
          },
          {
            testID: '@buttonsSection/contactsImportedButton',
            text: t('settings.items.contactsImported'),
            icon: contactIconSvg,
            navigatesFurther: true,
            onPress: () => {
              navigation.navigate('SetContacts')
            },
            children: <ContactsImportedTitle />,
          },
          {
            testID: '@buttonsSection/allowScreenshotsButton',
            text: t('settings.items.allowScreenshots'),
            icon: imageIconSvg,
            onPress: toggleScreenshotsDisabled,
            children: <AllowScreenshots />,
          },
          {
            testID: '@buttonsSection/notificationPreferencesButton',
            text: t('notifications.preferences.screenTitle'),
            icon: notificationsIconSvg,
            navigatesFurther: true,
            onPress: () => {
              navigation.navigate('NotificationSettings')
            },
          },
          {
            testID: '@buttonsSection/vexlLovesNitroPhoneButton',
            text: 'Vexl 🤍 NitroPhone',
            icon: popularSvg,
            iconFill: getTokens().color.greyOnBlack.val,
            navigatesFurther: true,
            onPress: () => {
              Effect.runFork(showVexlNitroPhoneCooperationBanner())
            },
          },
          {
            testID: '@buttonsSection/myDonationsButton',
            text: t('settings.items.myDonations'),
            icon: donationsSvg,
            onPress: () => {
              navigation.navigate('MyDonations')
            },
            navigatesFurther: true,
          },
        ],
        [
          {
            testID: '@buttonsSection/changeLanguageButton',
            text: t('settings.items.changeLanguage'),
            icon: spokenLanguagesSvg,
            iconFill: getTokens().color.greyOnBlack.val,
            navigatesFurther: true,
            onPress: changeLanguage,
          },
          {
            testID: '@buttonsSection/changeCurrencyButton',
            text: 'CZK',
            icon: coinsIconSvg,
            onPress: () => {
              setChangeCurrencyDialogVisible(true)
            },
            children: <SelectedCurrencyTitle />,
          },
        ],
        [
          {
            testID: '@buttonsSection/faqsButton',
            text: t('settings.items.faqs'),
            icon: questionIconSvg,
            navigatesFurther: true,
            onPress: () => {
              navigation.navigate('Faqs')
            },
          },
          {
            testID: '@buttonsSection/termsAndPrivacyButton',
            text: t('settings.items.termsAndPrivacy'),
            icon: termsIconSvg,
            navigatesFurther: true,
            onPress: () => {
              navigation.navigate('TermsAndConditions')
            },
          },
          {
            testID: '@buttonsSection/reportIssueButton',
            text: t('settings.items.reportIssue'),
            icon: customerSupportIconSvg,
            navigatesFurther: true,
            onPress: () => {
              Effect.runFork(setReportIssueDialogVisible())
            },
          },
          {
            testID: '@buttonsSection/inAppLogsButton',
            text: t('settings.items.inAppLogs'),
            icon: cpuIconSvg,
            navigatesFurther: true,
            onPress: () => {
              navigation.navigate('AppLogs')
            },
          },
        ].filter(notEmpty),
        enableHiddenFeatures
          ? [
              {
                testID: '@buttonsSection/requestKnownDataButton',
                text: t('settings.items.requestKnownData'),
                icon: dataIconSvg,
                onPress: todo,
              },
              {
                testID: '@buttonsSection/setPinButton',
                text: `${t('settings.items.setPin')} ${
                  Platform.OS === 'ios'
                    ? ` / ${t('settings.items.faceId')}`
                    : ''
                }`,
                icon: faceIdIconSvg,
                navigatesFurther: true,
                onPress: todo,
              },
            ]
          : null,
        [
          {
            testID: '@buttonsSection/followUsOnTwitterButton',
            text: (
              <ItemText ff="$body500" col="$greyOnBlack">
                {t('settings.items.followUsOn')}{' '}
                <ItemText ff="$body500" col="$white">
                  {t('settings.items.X')}
                </ItemText>
              </ItemText>
            ),
            icon: xSvg,
            onPress: openUrl(t('settings.items.XUrl')),
          },
          {
            testID: '@buttonsSection/readMoreOnMediumButton',
            text: (
              <ItemText ff="$body500" col="$greyOnBlack">
                {t('settings.items.readMoreOn')}{' '}
                <ItemText ff="$body500" col="$white">
                  {t('settings.items.ourBlog')}
                </ItemText>
              </ItemText>
            ),
            icon: glassesSvg,
            onPress: openUrl(t('settings.items.ourBlogUrl')),
          },
          {
            testID: '@buttonsSection/learnMoreOnWebsiteButton',
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
            testID: '@buttonsSection/deleteAccountButton',
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
      showVexlNitroPhoneCooperationBanner,
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
                {!!item && <Item {...item} />}
                {itemIndex !== group.length - 1 && !item?.hidden && (
                  <Stack h={2} bg="$grey" als="stretch" ml="$7" />
                )}
              </Fragment>
            ))}
          </Stack>
          {groupIndex !== data.length - 1 && <Stack h={16} />}
        </Fragment>
      ))}
      <CurrencySelect
        selectedCurrencyCodeAtom={defaultCurrencyAtom}
        onItemPress={(currency) => {
          setDefaultCurrency(currency)
        }}
        visibleAtom={changeCurrencyDialogVisibleAtom}
      />
    </Stack>
  )
}

export default ButtonsSection
