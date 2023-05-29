import SvgImage from '../../../../Image'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import profileIconSvg from '../../../images/profileIconSvg'
import {Alert, Platform, TouchableWithoutFeedback} from 'react-native'
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
import {getTokens, Stack, styled, Text, XStack} from 'tamagui'
import {enableHiddenFeatures} from '../../../../../utils/environment'
import notEmpty from '../../../../../utils/notEmpty'
import {type PrimitiveAtom, useAtomValue, useSetAtom} from 'jotai'
import * as TE from 'fp-ts/TaskEither'
import {askAreYouSureActionAtom} from '../../../../AreYouSureDialog'
import {pipe} from 'fp-ts/function'
import {useLogout} from '../../../../../state/useLogout'
import ReportIssue from './ReportIssue'
import {
  changeCurrencyDialogVisibleAtom,
  reportIssueDialogVisibleAtom,
} from '../atoms'
import openUrl from '../../../../../utils/openUrl'
import ChangeCurrency from './ChangeCurrency'
import {type Currency} from '@vexl-next/domain/src/general/offers'
import {selectedCurrencyAtom} from '../../../../../state/selectedCurrency'

const ItemText = styled(Text, {
  fos: 18,
})

function SelectedCurrencyTitle({
  currencyAtom,
}: {
  currencyAtom: PrimitiveAtom<Currency>
}): JSX.Element {
  const {t} = useTranslation()
  const selectedCurrency = useAtomValue(currencyAtom)
  return (
    <ItemText ff="$body500" col="$white">
      {selectedCurrency === 'USD'
        ? t('currency.unitedStatesDollar')
        : selectedCurrency === 'EUR'
        ? t('currency.euro')
        : t('currency.czechCrown')}
    </ItemText>
  )
}

function Item({
  text,
  icon,
  onPress,
  children,
}: {
  text: string | JSX.Element
  icon: SvgString
  onPress: () => void
  children?: React.ReactNode
}): JSX.Element {
  const tokens = getTokens()
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <XStack ai="center" h={66} mx="$7">
        <Stack w={24} h={24} mr="$4">
          <SvgImage stroke={tokens.color.greyOnBlack.val} source={icon} />
        </Stack>
        {children ??
          (typeof text === 'string' ? (
            <ItemText ff="$body500" col="$white">
              {text}
            </ItemText>
          ) : (
            text
          ))}
      </XStack>
    </TouchableWithoutFeedback>
  )
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

  function todo(): void {
    Alert.alert('To be implemented')
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
      TE.map(logout)
    )()
  }, [showAreYouSure, t, logout])

  const data: Array<
    Array<{
      icon: SvgString
      text: string | JSX.Element
      onPress: () => void
      children?: React.ReactNode
    } | null>
  > = useMemo(
    () =>
      [
        enableHiddenFeatures
          ? [
              {
                text: t('common.myOffers'),
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
        [
          enableHiddenFeatures
            ? {
                text: `${t('settings.items.setPin')} ${
                  Platform.OS === 'ios'
                    ? ` / ${t('settings.items.faceId')}`
                    : ''
                }`,
                icon: faceIdIconSvg,
                onPress: todo,
              }
            : null,
          {
            text: t('settings.items.czechCrown'),
            icon: coinsIconSvg,
            onPress: () => {
              setChangeCurrencyDialogVisible(true)
            },
            children: (
              <SelectedCurrencyTitle currencyAtom={selectedCurrencyAtom} />
            ),
          },
          enableHiddenFeatures
            ? {
                text: t('settings.items.allowScreenshots'),
                icon: imageIconSvg,
                onPress: todo,
              }
            : null,
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
      deleteAccountWithAreYouSure,
      navigation,
      setChangeCurrencyDialogVisible,
      setReportIssueDialogVisible,
      t,
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
