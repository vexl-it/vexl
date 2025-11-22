import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {useAtomValue} from 'jotai'
import React, {memo} from 'react'
import {type RootStackParamsList} from '../../navigationTypes'
import {useIsUserLoggedIn} from '../../state/session'
import useHandleNotificationOpen from '../../state/useHandleNotificationOpen'
import {useHandleReceivedNotifications} from '../../state/useHandleReceivedNotifications'
import {useSetupBackgroundTask} from '../../utils/backgroundTask'
import {useHandleUniversalAndAppLinks} from '../../utils/deepLinks'
import {useHideInnactivityReminderNotificationsOnResume} from '../../utils/notifications/chatNotifications'
import {showTextDebugButtonAtom} from '../../utils/preferences'
import AppLogsScreen from '../AppLogsScreen'
import {BlogArticlesListScreen} from '../BlogArticlesListScreen'
import CRUDOfferFlow from '../CRUDOfferFlow'
import ChangeProfilePictureScreen from '../ChangeProfilePictureScreen/ChangeProfilePictureScreen'
import ChatDetailScreen from '../ChatDetailScreen'
import {ClubDetailScreen} from '../ClubDetail'
import {ClubOffersScreen} from '../ClubOffersScreen'
import CommonFriendsScreen from '../CommonFriendsScreen'
import DebugScreen from '../DebugScreen'
import DevTranslationFloatingButton from '../DevTranslationFloatingButtons'
import DonationDetailsScreen from '../DonationDetailsScreen'
import EditNameScreen from '../EditNameScreen'
import EventsAndClubsScreen from '../EventsAndClubsScreen'
import FaqsScreen from '../FaqScreen'
import FilterOffersScreen from '../FilterOffersScreen'
import GoldenAvatarAnimation, {
  showGoldenAvatarAnimationAtom,
} from '../GoldenAvatar'
import InsideScreen from '../InsideRouter'
import JoinClubFlow from '../JoinClubFlow'
import LoginFlow from '../LoginFlow'
import MyDonationsScreen from '../MyDonationsScreen'
import NotificationSettingsScreen from '../NotificationSettingsScreen'
import OfferDetailScreen from '../OfferDetailScreen'
import PostLoginFlow from '../PostLoginFlow'
import SetContactsScreen from '../SetContactsScreen'
import TaskRegistryOverviewScreen from '../TaskRegistryOverviewScreen'
import TodoScreen from '../TodoScreen'
import TosScreen from '../TosScreen'
import TradeCalculatorRouter from '../TradeCalculatorRouter'
import TradeChecklistFlow from '../TradeChecklistFlow'
import TradePriceTypeDialog from '../TradePriceTypeDialogScreen'
import {useHandlePostLoginFlowRedirect} from './utils'

const Stack = createNativeStackNavigator<RootStackParamsList>()

function LoggedInHookGroup(): null {
  // Notifications
  useHandleReceivedNotifications()
  useHandleNotificationOpen()
  useHideInnactivityReminderNotificationsOnResume()
  useSetupBackgroundTask()

  // navigation
  useHandlePostLoginFlowRedirect()
  useHandleUniversalAndAppLinks()

  return null
}

const LoggedInHookGroupMemoized = memo(LoggedInHookGroup)

function RootNavigation(): React.ReactElement {
  const isLoggedIn = useIsUserLoggedIn()
  const showTextDebugButton = useAtomValue(showTextDebugButtonAtom)
  const showGoldenAvatarAnimation = useAtomValue(showGoldenAvatarAnimationAtom)

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          presentation: 'card',
        }}
      >
        {!isLoggedIn ? (
          <Stack.Screen name="LoginFlow" component={LoginFlow} />
        ) : (
          <Stack.Group>
            <Stack.Screen name="InsideTabs" component={InsideScreen} />
            <Stack.Screen name="TodoScreen" component={TodoScreen} />
            <Stack.Screen name="PostLoginFlow" component={PostLoginFlow} />
            <Stack.Screen name="OfferDetail" component={OfferDetailScreen} />
            <Stack.Screen name="CRUDOfferFlow" component={CRUDOfferFlow} />
            <Stack.Screen name="FilterOffers" component={FilterOffersScreen} />
            <Stack.Screen name="AppLogs" component={AppLogsScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="ClubDetail" component={ClubDetailScreen} />
            <Stack.Screen name="ClubOffers" component={ClubOffersScreen} />
            <Stack.Screen name="SetContacts" component={SetContactsScreen} />
            <Stack.Screen
              name="EventsAndClubs"
              component={EventsAndClubsScreen}
            />
            <Stack.Screen name="MyDonations" component={MyDonationsScreen} />
            <Stack.Screen
              name="DonationDetails"
              component={DonationDetailsScreen}
            />
            <Stack.Screen
              name="CommonFriends"
              component={CommonFriendsScreen}
            />
            {/* <Stack.Screen
              name="NotificationPermissionsMissing"
              component={NotificationPermissionsScreen}
            /> */}
            <Stack.Screen name="EditName" component={EditNameScreen} />
            <Stack.Screen
              name="TradeCalculatorFlow"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'containedTransparentModal',
              }}
              component={TradeCalculatorRouter}
            />
            <Stack.Screen
              name="TradePriceType"
              options={{
                presentation: 'transparentModal',
                animation: 'slide_from_bottom',
              }}
              component={TradePriceTypeDialog}
            />
            <Stack.Screen
              name="ChangeProfilePicture"
              component={ChangeProfilePictureScreen}
            />
            <Stack.Screen
              name="TradeChecklistFlow"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'containedTransparentModal',
              }}
              component={TradeChecklistFlow}
            />
            <Stack.Screen name="JoinClubFlow" component={JoinClubFlow} />
            <Stack.Screen
              name="BlogArticlesList"
              component={BlogArticlesListScreen}
            />
          </Stack.Group>
        )}
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
        />
        <Stack.Screen name="TermsAndConditions" component={TosScreen} />
        <Stack.Screen name="Faqs" component={FaqsScreen} />
        <Stack.Screen name="DebugScreen" component={DebugScreen} />
        <Stack.Screen
          name="TaskRegistryOverview"
          component={TaskRegistryOverviewScreen}
        />
      </Stack.Navigator>
      {!!showTextDebugButton && <DevTranslationFloatingButton />}
      {!!isLoggedIn && <LoggedInHookGroupMemoized />}
      {!!isLoggedIn && !!showGoldenAvatarAnimation && <GoldenAvatarAnimation />}
    </>
  )
}

export default RootNavigation
