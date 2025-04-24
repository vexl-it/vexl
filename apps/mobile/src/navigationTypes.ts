import {type MaterialTopTabScreenProps} from '@react-navigation/material-top-tabs'
import {
  type CompositeScreenProps,
  type NavigatorScreenParams,
} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {type KeyHolder} from '@vexl-next/cryptography'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {
  type AmountData,
  type AvailableDateTimeOption,
  type MeetingLocationData,
  type NetworkData,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {
  type InitPhoneVerificationResponse,
  type VerifyPhoneNumberResponse,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {type FaqType} from './components/FaqScreen/useContent'
import {type ChatIds} from './state/chat/domain'
import {type ContactsFilter} from './state/contacts/domain'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RootStackParamsList = {
  LoginFlow: NavigatorScreenParams<LoginStackParamsList>

  PostLoginFlow: NavigatorScreenParams<PostLoginFlowStackParamsList>

  InsideTabs: NavigatorScreenParams<InsideTabParamsList>

  TradeChecklistFlow: NavigatorScreenParams<TradeChecklistStackParamsList> &
    ChatIds

  CRUDOfferFlow: NavigatorScreenParams<CRUDOfferStackParamsList> & {
    offerId?: OfferId | undefined
  }
  FilterOffers: undefined
  MyOffers: undefined

  OfferDetail: {offerId: OfferId}

  ChatDetail: {otherSideKey: PublicKeyPemBase64; inboxKey: PublicKeyPemBase64}

  NotificationPermissionsMissing: undefined

  TermsAndConditions: undefined

  Faqs:
    | {
        pageType?: FaqType | undefined
      }
    | undefined

  EditName: undefined
  ChangeProfilePicture: undefined

  TodoScreen: undefined

  TradeCalculatorFlow: NavigatorScreenParams<TradeCalculatorStackParamsList>

  SetContacts: {filter?: ContactsFilter | undefined} | undefined

  CommonFriends: {contactsHashes: readonly HashedPhoneNumber[]}

  NotificationSettings: undefined

  AppLogs: undefined

  DebugScreen: undefined

  EventsAndClubs: NavigatorScreenParams<EventsAndClubsParamsList>

  JoinClubFlow: NavigatorScreenParams<JoinClubFlowParamsList>

  BlogArticlesList: undefined
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type EventsAndClubsParamsList = {
  Events: undefined
  Clubs: undefined
}

export type EventsAndClubsTabsScreenProps<
  T extends keyof EventsAndClubsParamsList,
> = CompositeScreenProps<
  MaterialTopTabScreenProps<EventsAndClubsParamsList, T>,
  RootStackScreenProps<keyof RootStackParamsList>
>

export type RootStackScreenProps<T extends keyof RootStackParamsList> =
  NativeStackScreenProps<RootStackParamsList, T>

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type LoginStackParamsList = {
  AnonymizationAnimation: {
    readonly realUserData: RealLifeInfo
  }
  AnonymizationNotice: undefined
  Intro: undefined
  Name: undefined
  PhoneNumber: undefined
  Photo: {userName: UserName}
  Start: undefined
  SuccessLogin: {
    readonly verifyPhoneNumberResponse: VerifyPhoneNumberResponse
    readonly privateKey: KeyHolder.PrivateKeyHolder
    readonly phoneNumber: E164PhoneNumber
  }
  VerificationCode: {
    readonly phoneNumber: E164PhoneNumber
    readonly initPhoneVerificationResponse: InitPhoneVerificationResponse
  }
}

export type LoginStackScreenProps<T extends keyof LoginStackParamsList> =
  CompositeScreenProps<
    NativeStackScreenProps<LoginStackParamsList, T>,
    RootStackScreenProps<keyof RootStackParamsList>
  >

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type PostLoginFlowStackParamsList = {
  ImportContactsExplanationScreen: undefined
  ImportContacts: undefined
  AllowNotificationsExplanation: undefined
  FindOffersInVexlClubsScreen: undefined
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type PostLoginFlowStackScreenProps<
  T extends keyof PostLoginFlowStackParamsList,
> = CompositeScreenProps<
  NativeStackScreenProps<PostLoginFlowStackParamsList, T>,
  RootStackScreenProps<keyof RootStackParamsList>
>

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type InsideTabParamsList = {
  Marketplace: undefined
  MyOffers: undefined
  Messages: undefined
  Settings: undefined
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type CRUDOfferStackParamsList = {
  ListingAndOfferType: undefined
  CurrencyAndAmount: undefined
  OfferDescriptionAndSpokenLanguagesScreen: undefined
  LocationPaymentMethodAndNetworkScreen: undefined
  FriendLevelScreen: undefined
  DeliveryMethodAndNetworkScreen: undefined
  PriceScreen: undefined
  SummaryScreen: undefined
}

export type CRUDOfferStackScreenProps<
  T extends keyof CRUDOfferStackParamsList,
> = CompositeScreenProps<
  NativeStackScreenProps<CRUDOfferStackParamsList, T>,
  RootStackScreenProps<keyof RootStackParamsList>
>

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ContactsTabParamsList = {
  Submitted: {filter: ContactsFilter}
  NonSubmitted: {filter: ContactsFilter}
  New: {filter: ContactsFilter}
  All: {filter: ContactsFilter}
}

export type ContactsTabScreenProps<T extends keyof ContactsTabParamsList> =
  CompositeScreenProps<
    MaterialTopTabScreenProps<ContactsTabParamsList, T>,
    RootStackScreenProps<keyof RootStackParamsList>
  >

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type TradeCalculatorStackParamsList = {
  TradeCalculator: undefined
  PremiumOrDiscount: undefined
  SetYourOwnPrice: undefined
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type TradeCalculatorStackScreenProps<
  T extends keyof TradeCalculatorStackParamsList,
> = CompositeScreenProps<
  NativeStackScreenProps<TradeCalculatorStackParamsList, T>,
  RootStackScreenProps<keyof RootStackParamsList>
>

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type TradeChecklistStackParamsList = {
  AgreeOnTradeDetails: undefined
  ChooseAvailableDays: {
    readonly chosenDateTimes: AvailableDateTimeOption[] | undefined
  }
  PickDateFromSuggestions: {
    readonly chosenDateTimes: AvailableDateTimeOption[]
  }
  PickTimeFromSuggestions: {
    readonly pickedOption: AvailableDateTimeOption
    readonly chosenDateTimes: AvailableDateTimeOption[]
  }
  AddTimeOptions: undefined
  CalculateAmount: {
    readonly amountData: AmountData | undefined
  }
  SetYourOwnPrice: undefined
  PremiumOrDiscount: undefined
  Network: {
    readonly networkData: NetworkData | undefined
  }
  BtcAddress: undefined

  LocationMapPreview: {
    readonly selectedLocation: MeetingLocationData
  }
  LocationMapSelect: {
    readonly selectedLocation: LocationSuggestion
    readonly searchQuery: string
  }
  LocationSearch: undefined
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type TradeChecklistStackScreenProps<
  T extends keyof TradeChecklistStackParamsList,
> = CompositeScreenProps<
  NativeStackScreenProps<TradeChecklistStackParamsList, T>,
  RootStackScreenProps<keyof RootStackParamsList>
>

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type JoinClubFlowParamsList = {
  ScanClubQrCodeScreen: undefined
  FillClubAccessCodeScreen: undefined
}

export type JoinClubFlowStackScreenProps<
  T extends keyof JoinClubFlowParamsList,
> = CompositeScreenProps<
  NativeStackScreenProps<JoinClubFlowParamsList, T>,
  RootStackScreenProps<keyof RootStackParamsList>
>

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamsList {}
  }
}
