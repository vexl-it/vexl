import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {type RootStackParamsList} from '../../navigationTypes'
import {useSyncConnections} from '../../state/connections'
import {useSetCombinedContactsAfterLastSubmitForCurrentUsers} from '../../state/contacts/hooks/useSetCombinedContactsAfterLastSubmitForCurrentUsers'
import {useIsUserLoggedIn} from '../../state/session'
import useHandleNotificationOpen from '../../state/useHandleNotificationOpen'
import {useHandleReceivedNotifications} from '../../state/useHandleReceivedNotifications'
import useHandleRefreshContactServiceAndOffers from '../../state/useHandleRefreshContactServiceAndOffers'
import {useHandleDeepLink} from '../../utils/deepLinks'
import {useHideInnactivityReminderNotificationsOnResume} from '../../utils/notifications/chatNotifications'
import {useRefreshNotificationTokenOnResumeAssumeLoggedIn} from '../../utils/notifications/useRefreshNotificationTokenOnResumeAssumeLoggedIn'
import AppLogsScreen from '../AppLogsScreen'
import ChangeProfilePictureScreen from '../ChangeProfilePictureScreen/ChangeProfilePictureScreen'
import ChatDetailScreen from '../ChatDetailScreen'
import CommonFriendsScreen from '../CommonFriendsScreen'
import DebugScreen from '../DebugScreen'
import EditNameScreen from '../EditNameScreen'
import FaqsScreen from '../FaqScreen'
import FilterOffersScreen from '../FilterOffersScreen'
import InsideScreen from '../InsideRouter'
import LoginFlow from '../LoginFlow'
import CreateOfferScreen from '../ModifyOffer/components/CreateOfferScreen'
import EditOfferScreen from '../ModifyOffer/components/EditOfferScreen'
import MyOffersScreen from '../MyOffersScreen'
import {NotificationPermissionsScreen} from '../NotificationPermissionsScreen'
import NotificationSettingsScreen from '../NotificationSettingsScreen'
import OfferDetailScreen from '../OfferDetailScreen'
import PostLoginFlow from '../PostLoginFlow'
import SearchOffersScreen from '../SearchOffersScreen'
import SetContactsScreen from '../SetContactsScreen'
import TodoScreen from '../TodoScreen'
import TosScreen from '../TosScreen'
import TradeChecklistFlow from '../TradeChecklistFlow'
import {
  useHandleNotificationsPermissionsRedirect,
  useHandlePostLoginFlowRedirect,
} from './utils'
import useRefreshContactsFromDeviceOnResume from '../../state/contacts/hooks/useRefreshContactsFromDeviceOnResume'
import DevTranslationFloatingButton from '../DevTranslationFloatingButtons'
import {showTextDebugButtonAtom} from '../../utils/preferences'
import {useAtomValue} from 'jotai'
import {useSetAppLanguageFromStore} from '../../state/useSetAppLanguageFromStore'

const Stack = createNativeStackNavigator<RootStackParamsList>()

function LoggedInHookGroup(): null {
  useRefreshNotificationTokenOnResumeAssumeLoggedIn()
  useHandleReceivedNotifications()
  useHandleNotificationOpen()

  useHandleNotificationsPermissionsRedirect()
  useHandlePostLoginFlowRedirect()
  useHandleRefreshContactServiceAndOffers()
  useSyncConnections()
  useHandleDeepLink()
  useSetCombinedContactsAfterLastSubmitForCurrentUsers()

  useHideInnactivityReminderNotificationsOnResume()
  useRefreshContactsFromDeviceOnResume()
  useSetAppLanguageFromStore()

  return null
}

function RootNavigation(): JSX.Element {
  const isLoggedIn = useIsUserLoggedIn()
  const showTextDebugButton = useAtomValue(showTextDebugButtonAtom)

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          presentation: 'card',
        }}
      >
        {!isLoggedIn ? (
          <Stack.Screen name={'LoginFlow'} component={LoginFlow} />
        ) : (
          <Stack.Group>
            <Stack.Screen name={'InsideTabs'} component={InsideScreen} />
            <Stack.Screen name={'TodoScreen'} component={TodoScreen} />
            <Stack.Screen name={'PostLoginFlow'} component={PostLoginFlow} />
            <Stack.Screen name={'OfferDetail'} component={OfferDetailScreen} />
            <Stack.Screen name={'CreateOffer'} component={CreateOfferScreen} />
            <Stack.Screen name={'EditOffer'} component={EditOfferScreen} />
            <Stack.Screen
              name={'FilterOffers'}
              component={FilterOffersScreen}
            />
            <Stack.Screen
              name={'SearchOffers'}
              component={SearchOffersScreen}
            />
            <Stack.Screen name={'MyOffers'} component={MyOffersScreen} />
            <Stack.Screen name={'AppLogs'} component={AppLogsScreen} />
            <Stack.Screen name={'ChatDetail'} component={ChatDetailScreen} />
            <Stack.Screen name={'SetContacts'} component={SetContactsScreen} />
            <Stack.Screen
              name={'CommonFriends'}
              component={CommonFriendsScreen}
            />
            <Stack.Screen
              name={'NotificationPermissionsMissing'}
              component={NotificationPermissionsScreen}
            />
            <Stack.Screen name={'EditName'} component={EditNameScreen} />
            <Stack.Screen
              name={'ChangeProfilePicture'}
              component={ChangeProfilePictureScreen}
            />
            <Stack.Screen
              name={'TradeChecklistFlow'}
              options={{
                animation: 'slide_from_bottom',
                presentation: 'transparentModal',
              }}
              component={TradeChecklistFlow}
            />
          </Stack.Group>
        )}
        <Stack.Screen
          name={'NotificationSettings'}
          component={NotificationSettingsScreen}
        />
        <Stack.Screen name={'TermsAndConditions'} component={TosScreen} />
        <Stack.Screen name={'Faqs'} component={FaqsScreen} />
        <Stack.Screen name={'DebugScreen'} component={DebugScreen} />
      </Stack.Navigator>
      {showTextDebugButton && <DevTranslationFloatingButton />}
      {isLoggedIn && <LoggedInHookGroup />}
    </>
  )
}

export default RootNavigation
