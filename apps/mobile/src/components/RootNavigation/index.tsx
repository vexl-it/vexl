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
import AccountScreen from '../AccountScreen'
import AppLogsScreen from '../AppLogsScreen'
import AppSettingsScreen from '../AppSettingsScreen'
import CRUDOfferFlow from '../CRUDOfferFlow'
import OfferExpirationDateScreen from '../CRUDOfferFlow/components/OfferExpirationDateScreen'
import SelectLocationRadiusScreen from '../CRUDOfferFlow/components/SelectLocationRadiusScreen'
import SelectLocationSearchScreen from '../CRUDOfferFlow/components/SelectLocationSearchScreen'
import {ChangeCurrencyScreen} from '../ChangeCurrency'
import ChatDetailScreen from '../ChatDetailScreen'
import ChatImagePreviewScreen from '../ChatDetailScreen/ChatImagePreviewScreen'
import ChatInfoJsonDebugScreen from '../ChatDetailScreen/ChatInfoJsonDebugScreen'
import ChatInfoScreen from '../ChatDetailScreen/ChatInfoScreen'
import ChatReceivedMessagesDebugScreen from '../ChatDetailScreen/ChatReceivedMessagesDebugScreen'
import DeclineChatRequestScreen from '../ChatDetailScreen/DeclineChatRequestScreen'
import ChatOfferDetailScreen from '../ChatDetailScreen/OfferDetailScreen'
import ChatSearchScreen from '../ChatSearchScreen'
import ClubDetail from '../ClubDetail'
import {ScanClubAdmissionQrCodeScreen} from '../ClubDetail/components/ScanClubAdmissionQrCodeScreen'
import {ClubOffersScreen} from '../ClubOffersScreen'
import CommonFriendsScreen from '../CommonFriends/CommonFriendsScreen'
import DebugScreen from '../DebugScreen'
import DevTranslationFloatingButton from '../DevTranslationFloatingButtons'
import DonationsFlow from '../DonationsFlow'
import EditIdentityScreen from '../EditIdentityScreen'
import EditOfferFieldScreen from '../EditOfferFieldScreen'
import EditProfileScreen from '../EditProfileScreen'
import FaqsScreen from '../FaqScreen'
import FilterOffersScreen from '../FilterOffersScreen'
import GoldenAvatarAnimation, {
  showGoldenAvatarAnimationAtom,
} from '../GoldenAvatar'
import InsideScreen from '../InsideRouter'
import JoinClubFlow from '../JoinClubFlow'
import LoginFlow from '../LoginFlow'
import MapViewScreen from '../MapViewScreen'
import MyOfferDetailScreen from '../MyOfferDetailScreen'
import NotificationSettingsScreen from '../NotificationSettingsScreen'
import NotificationsScreen from '../NotificationsScreen'
import OfferDetailScreen from '../OfferDetailScreen'
import PostLoginFlow from '../PostLoginFlow'
import ScanQrCodeScreen from '../ScanQrCodeScreen'
import SendMessageScreen from '../SendMessageScreen'
import SetContactsScreen from '../SetContactsScreen'
import ShareProfileScreen from '../ShareProfileScreen'
import TaskRegistryOverviewScreen from '../TaskRegistryOverviewScreen'
import TodoScreen from '../TodoScreen'
import TosScreen from '../TosScreen'
import TradeCalculatorRouter from '../TradeCalculatorRouter'
import TradeChecklistFlow from '../TradeChecklistFlow'
import WhatAreClubsScreen from '../WhatAreClubsScreen'
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
            <Stack.Screen
              name="ChangeCurrency"
              component={ChangeCurrencyScreen}
            />
            <Stack.Screen name="MapView" component={MapViewScreen} />
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
                presentation: 'card',
              }}
              component={ChatInfoScreen}
            />
            <Stack.Screen
              name="ChatOfferDetail"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'card',
              }}
              component={ChatOfferDetailScreen}
            />
            <Stack.Screen
              name="ChatReceivedMessagesDebug"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'card',
              }}
              component={ChatReceivedMessagesDebugScreen}
            />
            <Stack.Screen
              name="ChatInfoJsonDebug"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'card',
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
            <Stack.Screen name="ClubDetail" component={ClubDetail} />
            <Stack.Screen
              name="ScanClubAdmissionQrCode"
              component={ScanClubAdmissionQrCodeScreen}
              options={{
                animation: 'slide_from_bottom',
                presentation: 'card',
              }}
            />
            <Stack.Screen name="ClubOffers" component={ClubOffersScreen} />
            <Stack.Screen name="WhatAreClubs" component={WhatAreClubsScreen} />
            <Stack.Screen name="SetContacts" component={SetContactsScreen} />
            <Stack.Screen name="DonationsFlow" component={DonationsFlow} />
            {/* <Stack.Screen
              name="NotificationPermissionsMissing"
              component={NotificationPermissionsScreen}
            /> */}
            <Stack.Screen
              name="TradeCalculatorFlow"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'containedTransparentModal',
              }}
              component={TradeCalculatorRouter}
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
            <Stack.Screen name="Account" component={AccountScreen} />
            <Stack.Screen
              name="ScanQrCode"
              component={ScanQrCodeScreen}
              options={{
                animation: 'slide_from_bottom',
                presentation: 'card',
              }}
            />
            <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
            <Stack.Screen
              name="ShareProfile"
              component={ShareProfileScreen}
              options={{
                animation: 'slide_from_bottom',
                presentation: 'card',
              }}
            />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="EditIdentity" component={EditIdentityScreen} />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
            />
          </Stack.Group>
        )}
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
        />
        <Stack.Screen
          name="TermsAndConditions"
          component={TosScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="Faqs"
          component={FaqsScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'card',
          }}
        />
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
