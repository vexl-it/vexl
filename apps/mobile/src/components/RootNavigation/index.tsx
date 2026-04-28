import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {useAtomValue} from 'jotai'
import React, {memo} from 'react'
import {type RootStackParamsList} from '../../navigationTypes'
import {useManageTypingIndications} from '../../state/chat/atoms/typingIndication'
import {useIsUserLoggedIn} from '../../state/session'
import useHandleNotificationOpen from '../../state/useHandleNotificationOpen'
import {useHandleReceivedNotifications} from '../../state/useHandleReceivedNotifications'
import {useSetupBackgroundTask} from '../../utils/backgroundTask'
import {useHandleUniversalAndAppLinks} from '../../utils/deepLinks'
import {useHideInnactivityReminderNotificationsOnResume} from '../../utils/notifications/chatNotifications'
import {useConsumeNotificationStream} from '../../utils/notifications/useConsumeNotificationStream'
import {showTextDebugButtonAtom} from '../../utils/preferences'
import AppLogsScreen from '../AppLogsScreen'
import {BlogArticlesListScreen} from '../BlogArticlesListScreen'
import CRUDOfferFlow from '../CRUDOfferFlow'
import OfferExpirationDateScreen from '../CRUDOfferFlow/components/OfferExpirationDateScreen'
import SelectLocationRadiusScreen from '../CRUDOfferFlow/components/SelectLocationRadiusScreen'
import SelectLocationSearchScreen from '../CRUDOfferFlow/components/SelectLocationSearchScreen'
import ChangeProfilePictureScreen from '../ChangeProfilePictureScreen/ChangeProfilePictureScreen'
import ChatDetailScreen from '../ChatDetailScreen'
import ChatImagePreviewScreen from '../ChatDetailScreen/ChatImagePreviewScreen'
import ChatInfoJsonDebugScreen from '../ChatDetailScreen/ChatInfoJsonDebugScreen'
import ChatInfoScreen from '../ChatDetailScreen/ChatInfoScreen'
import ChatReceivedMessagesDebugScreen from '../ChatDetailScreen/ChatReceivedMessagesDebugScreen'
import DeclineChatRequestScreen from '../ChatDetailScreen/DeclineChatRequestScreen'
import ChatOfferDetailScreen from '../ChatDetailScreen/OfferDetailScreen'
import ChatSearchScreen from '../ChatSearchScreen'
import {ClubDetailScreen} from '../ClubDetail'
import {ClubOffersScreen} from '../ClubOffersScreen'
import CommonFriendsScreen from '../CommonFriends/CommonFriendsScreen'
import DebugScreen from '../DebugScreen'
import DevTranslationFloatingButton from '../DevTranslationFloatingButtons'
import DonationDetailsScreen from '../DonationDetailsScreen'
import EditNameScreen from '../EditNameScreen'
import EditOfferFieldScreen from '../EditOfferFieldScreen'
import EventsAndClubsScreen from '../EventsAndClubsScreen'
import FaqsScreen from '../FaqScreen'
import FilterOffersScreen from '../FilterOffersScreen'
import GoldenAvatarAnimation, {
  showGoldenAvatarAnimationAtom,
} from '../GoldenAvatar'
import InsideScreen from '../InsideRouter'
import SettingsScreen from '../InsideRouter/components/SettingsScreen'
import JoinClubFlow from '../JoinClubFlow'
import LoginFlow from '../LoginFlow'
import MyDonationsScreen from '../MyDonationsScreen'
import MyOfferDetailScreen from '../MyOfferDetailScreen'
import NotificationSettingsScreen from '../NotificationSettingsScreen'
import OfferDetailScreen from '../OfferDetailScreen'
import PostLoginFlow from '../PostLoginFlow'
import SendMessageScreen from '../SendMessageScreen'
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
  useConsumeNotificationStream()

  // navigation
  useHandlePostLoginFlowRedirect()
  useHandleUniversalAndAppLinks()

  useManageTypingIndications()

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
            <Stack.Screen
              name="MyOfferDetail"
              component={MyOfferDetailScreen}
            />
            <Stack.Screen
              name="EditOfferField"
              component={EditOfferFieldScreen}
            />
            <Stack.Screen name="SendMessage" component={SendMessageScreen} />
            <Stack.Screen name="CRUDOfferFlow" component={CRUDOfferFlow} />
            <Stack.Screen
              name="OfferExpirationDate"
              component={OfferExpirationDateScreen}
            />
            <Stack.Screen
              name="SelectLocationSearch"
              component={SelectLocationSearchScreen}
            />
            <Stack.Screen
              name="SelectLocationRadius"
              component={SelectLocationRadiusScreen}
            />
            <Stack.Screen name="FilterOffers" component={FilterOffersScreen} />
            <Stack.Screen name="AppLogs" component={AppLogsScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen
              name="DeclineChatRequest"
              component={DeclineChatRequestScreen}
            />
            <Stack.Screen
              name="ChatImagePreview"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
              component={ChatImagePreviewScreen}
            />
            <Stack.Screen
              name="ChatInfo"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
              component={ChatInfoScreen}
            />
            <Stack.Screen
              name="ChatOfferDetail"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
              component={ChatOfferDetailScreen}
            />
            <Stack.Screen
              name="ChatReceivedMessagesDebug"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
              component={ChatReceivedMessagesDebugScreen}
            />
            <Stack.Screen
              name="ChatInfoJsonDebug"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
              component={ChatInfoJsonDebugScreen}
            />
            <Stack.Screen name="ChatSearch" component={ChatSearchScreen} />
            <Stack.Screen
              name="CommonFriends"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
              component={CommonFriendsScreen}
            />
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
            <Stack.Screen name="Settings" component={SettingsScreen} />
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
