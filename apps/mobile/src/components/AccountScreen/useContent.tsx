import {useNavigation} from '@react-navigation/native'
import {
  CellPhoneMobileDevice,
  DocumentsFiles,
  Gift,
  Help,
  type IconProps,
  LogConsole,
  MegaphoneNotifications,
  type MenuItemProps,
  PencilWriteEdit,
  PeopleUsers,
  QuestionsFaq,
  TrashBin,
  XTwitter,
} from '@vexl-next/ui'
import {Effect} from 'effect'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {importedContactsCountAtom} from '../../state/contacts/atom/contactsStore'
import {useLogout} from '../../state/useLogout'
import {contactSupportActionAtom} from '../../utils/contactSupportActionAtom'
import {useTranslation as useTranslations} from '../../utils/localization/I18nProvider'
import openUrl from '../../utils/openUrl'
import ContactUsDialogContent from '../AppSettingsScreen/components/ContactUsDialogContent'
import {globalDialogAtom} from '../GlobalDialog'
import DeleteAccountConfirmationDialogContent from './components/DeleteAccountConfirmationDialogContent'

interface AccountMenuItem {
  readonly label: string
  readonly note?: string
  readonly icon: React.ComponentType<IconProps>
  readonly variant?: MenuItemProps['variant']
  readonly onPress: () => void
}
type AccountMenus = ReadonlyArray<
  | {
      readonly type: 'menu'
      readonly label?: string
      readonly items: AccountMenuItem[]
    }
  | {type: 'nitroKeyBanner'}
>

export function useContent(): AccountMenus {
  const {t} = useTranslations()
  const navigation = useNavigation()
  const numberOfContacts = useAtomValue(importedContactsCountAtom)
  const showDialog = useSetAtom(globalDialogAtom)
  const contactSupport = useSetAtom(contactSupportActionAtom)
  const logout = useLogout()
  return useMemo((): AccountMenus => {
    return [
      {
        type: 'menu' as const,
        label: t('account.network'),
        items: [
          {
            label: t('account.contactPreferences'),
            note: t('account.contactsCount', {count: numberOfContacts}),
            icon: PeopleUsers,
            onPress: () => {
              navigation.navigate('ContactPreferences')
            },
          },
        ],
      },
      {
        type: 'menu' as const,
        label: t('account.settings'),
        items: [
          {
            label: t('account.appSettings'),
            icon: CellPhoneMobileDevice,
            onPress: () => {
              navigation.navigate('AppSettings')
            },
          },
          {
            label: t('account.notificationSettings'),
            icon: MegaphoneNotifications,
            onPress: () => {
              navigation.navigate('NotificationSettings')
            },
          },
          {
            label: t('account.appLogs'),
            icon: LogConsole,
            onPress: () => {
              navigation.navigate('AppLogs')
            },
          },
        ],
      },
      {
        type: 'menu' as const,
        label: t('account.vexl'),
        items: [
          {
            label: t('account.myDonations'),
            icon: Gift,
            onPress: () => {
              navigation.navigate('DonationsFlow', {
                screen: 'MyDonations',
              })
            },
          },
          {
            label: t('account.followUsOnX'),
            icon: XTwitter,
            onPress: openUrl(t('settings.items.XUrl')),
          },
          {
            label: t('account.vexlBlog'),
            icon: PencilWriteEdit,
            onPress: openUrl(t('settings.items.ourBlogUrl')),
          },
        ],
      },
      {
        type: 'nitroKeyBanner',
      },
      {
        type: 'menu' as const,
        label: t('account.vexl'),
        items: [
          {
            label: t('account.faqs'),
            icon: QuestionsFaq,
            onPress: () => {
              navigation.navigate('Faqs')
            },
          },
          {
            label: t('account.contactUs'),
            icon: Help,
            onPress: () => {
              void Effect.runPromise(
                Effect.gen(function* (_) {
                  const confirmed = yield* _(
                    showDialog({
                      title: t('account.contactUs'),
                      subtitle: t('account.contactUsSubtitle'),
                      positiveButtonText: t('account.openMailApp'),
                      negativeButtonText: t('common.close'),
                      children: <ContactUsDialogContent />,
                    })
                  )

                  if (confirmed) {
                    contactSupport()
                  }
                })
              )
            },
          },
          {
            label: t('account.termsAndPrivacyPolicy'),
            icon: DocumentsFiles,
            onPress: () => {
              navigation.navigate('TermsAndConditions')
            },
          },
        ],
      },
      {
        type: 'menu' as const,
        items: [
          {
            label: t('account.deleteAccount'),
            icon: TrashBin,
            onPress: () => {
              const confirmationAtom = atom('')
              const positiveButtonDisabledAtom = atom(
                (get) =>
                  get(confirmationAtom).trim() !==
                  t('account.deleteAccountConfirmation.confirmationText')
              )

              void Effect.runPromise(
                Effect.gen(function* (_) {
                  const confirmed = yield* _(
                    showDialog({
                      title: t('account.deleteAccountConfirmation.title'),
                      positiveButtonText: t('account.deleteAccount'),
                      positiveButtonVariant: 'destructive',
                      negativeButtonText: t('common.cancel'),
                      positiveButtonDisabledAtom,
                      children: (
                        <DeleteAccountConfirmationDialogContent
                          confirmationAtom={confirmationAtom}
                        />
                      ),
                    })
                  )

                  if (confirmed) {
                    yield* _(Effect.promise(logout))
                  }
                })
              )
            },
            variant: 'danger',
          },
        ],
      },
    ] as const
  }, [contactSupport, logout, navigation, numberOfContacts, showDialog, t])
}
