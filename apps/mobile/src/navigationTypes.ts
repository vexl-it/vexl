import {type MaterialTopTabScreenProps} from '@react-navigation/material-top-tabs'
import {
  type CompositeScreenProps,
  type NavigatorScreenParams,
} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {type KeyHolder} from '@vexl-next/cryptography'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
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
  type InitPhoneNumberVerificationResponse,
  type VerifyPhoneNumberResponse,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {type ChatIds} from './state/chat/domain'
import {type ContactsFilter} from './state/contacts/domain'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RootStackParamsList = {
  LoginFlow: NavigatorScreenParams<LoginStackParamsList>

  PostLoginFlow: NavigatorScreenParams<PostLoginStackParamsList>

  InsideTabs: NavigatorScreenParams<InsideTabParamsList>

  TradeChecklistFlow: NavigatorScreenParams<TradeChecklistStackParamsList> &
    ChatIds

  CreateOffer: undefined
  EditOffer: {offerId: OfferId}
  FilterOffers: undefined
  MyOffers: undefined

  OfferDetail: {offerId: OfferId}

  ChatDetail: {otherSideKey: PublicKeyPemBase64; inboxKey: PublicKeyPemBase64}

  NotificationPermissionsMissing: undefined

  TermsAndConditions: undefined

  Faqs: undefined

  EditName: undefined
  ChangeProfilePicture: undefined

  TodoScreen: undefined

  TradeCalculatorFlow: NavigatorScreenParams<TradeCalculatorStackParamsList>

  SetContacts: {showNew?: boolean} | undefined

  CommonFriends: {contactsHashes: readonly string[]}

  NotificationSettings: undefined

  AppLogs: undefined

  DebugScreen: undefined
}

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
    readonly initPhoneVerificationResponse: InitPhoneNumberVerificationResponse
  }
}

export type LoginStackScreenProps<T extends keyof LoginStackParamsList> =
  CompositeScreenProps<
    NativeStackScreenProps<LoginStackParamsList, T>,
    RootStackScreenProps<keyof RootStackParamsList>
  >

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type PostLoginStackParamsList = {
  ImportContactsExplanation: undefined
  ImportContacts: undefined
  AllowNotificationsExplanation: undefined
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type PostLoginFlowScreenProps<T extends keyof PostLoginStackParamsList> =
  CompositeScreenProps<
    NativeStackScreenProps<PostLoginStackParamsList, T>,
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
export type ContactsTabParamsList = {
  Submitted: {filter: ContactsFilter}
  NonSubmitted: {filter: ContactsFilter}
  New: {filter: ContactsFilter}
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
    readonly chosenDays: AvailableDateTimeOption[] | undefined
  }
  PickDateFromSuggestions: {
    readonly chosenDays: AvailableDateTimeOption[]
  }
  PickTimeFromSuggestions: {
    readonly chosenDay: AvailableDateTimeOption
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

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamsList {}
  }
}
