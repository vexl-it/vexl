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
import {type ClubCode, type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type ChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {
  type LocationPlaceId,
  type OfferId,
} from '@vexl-next/domain/src/general/offers'
import {
  type AmountData,
  type AvailableDateTimeOption,
  type MeetingLocationData,
  type NetworkData,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {type InvoiceId} from '@vexl-next/rest-api/src/services/content/contracts'
import {
  type InitPhoneVerificationResponse,
  type VerifyPhoneNumberResponse,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {type EditableOfferField} from './components/CRUDOfferFlow/offerSetupSteps'
import {type FaqType} from './components/FaqScreen/useContent'
import {type TabType} from './components/TosScreen/useContent'
import {type ChatIds} from './state/chat/domain'
import {type ContactsFilter} from './state/contacts/domain'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RootStackParamsList = {
  LoginFlow: NavigatorScreenParams<LoginFlowStackParamsList>

  PostLoginFlow: NavigatorScreenParams<PostLoginFlowStackParamsList>

  InsideTabs: NavigatorScreenParams<InsideTabParamsList>

  TradeChecklistFlow: NavigatorScreenParams<TradeChecklistStackParamsList> &
    ChatIds

  CRUDOfferFlow: undefined
  MyOfferDetail: {offerId: OfferId}
  EditOfferField: {
    offerId: OfferId
    field: EditableOfferField
  }
  OfferExpirationDate: undefined
  OfferLocationSearch: {randomizeLocation?: boolean} | undefined
  OfferLocationRadius:
    | {
        randomizeLocation?: boolean
        editingLocationPlaceId?: LocationPlaceId
      }
    | undefined
  FilterLocationSearch: undefined
  FilterLocationRadius: undefined
  FilterOffers: undefined
  ChangeCurrency: undefined

  MapView: undefined

  OfferDetail: {offerId: OfferId}

  SendMessage: {offerId: OfferId; mode?: 'request' | 'rerequest'}

  ChatDetail: {
    otherSideKey: PublicKeyPemBase64
    inboxKey: PublicKeyPemBase64
    targetMessageId?: ChatMessageId | undefined
  }

  DeclineChatRequest: {
    otherSideKey: PublicKeyPemBase64
    inboxKey: PublicKeyPemBase64
  }

  ChatInfo: {
    otherSideKey: PublicKeyPemBase64
    inboxKey: PublicKeyPemBase64
  }

  ChatImagePreview: {
    imageUri: UriString
  }

  ChatReceivedMessagesDebug: {
    otherSideKey: PublicKeyPemBase64
    inboxKey: PublicKeyPemBase64
  }

  ChatInfoJsonDebug: {
    otherSideKey: PublicKeyPemBase64
    inboxKey: PublicKeyPemBase64
  }

  ChatOfferDetail: {
    otherSideKey: PublicKeyPemBase64
    inboxKey: PublicKeyPemBase64
  }

  ChatSearch: undefined

  CommonFriends: {
    readonly contactsHashes: readonly HashedPhoneNumber[]
    readonly verifiedHashes?: readonly HashedPhoneNumber[]
  }

  ClubDetail: {clubUuid: ClubUuid}

  ScanClubAdmissionQrCode: undefined

  ClubOffers: {clubUuid: ClubUuid}

  WhatAreClubs: undefined

  NotificationPermissionsMissing: undefined

  TermsAndConditions:
    | {
        activeTab: TabType
      }
    | undefined

  Faqs:
    | {
        pageType?: FaqType | undefined
      }
    | undefined

  TodoScreen: undefined

  TradeCalculatorFlow: NavigatorScreenParams<TradeCalculatorStackParamsList>

  DonationsFlow: NavigatorScreenParams<DonationsFlowParamsList>

  ContactPreferences: {filter?: ContactsFilter | undefined} | undefined
  AddNewContact:
    | {
        readonly editContactNumber?: E164PhoneNumber | undefined
      }
    | undefined
  AddNewContactCountryPicker: undefined

  NotificationSettings: undefined

  Notifications: undefined

  AppLogs: undefined

  DebugScreen: undefined

  TaskRegistryOverview: undefined

  JoinClubFlow: NavigatorScreenParams<JoinClubFlowParamsList>

  Account: undefined
  ScanQrCode: undefined
  AppSettings: NavigatorScreenParams<AppSettingsStackParamsList> | undefined
  ShareProfile: undefined
  EditProfile: NavigatorScreenParams<EditProfileStackParamsList> | undefined
  EditIdentity: NavigatorScreenParams<EditIdentityStackParamsList> | undefined
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type CommunityParamsList = {
  Discover: undefined
  Events: undefined
  Clubs: undefined
  Board: undefined
  Blog: undefined
}

export type CommunityTabsScreenProps<T extends keyof CommunityParamsList> =
  CompositeScreenProps<
    MaterialTopTabScreenProps<CommunityParamsList, T>,
    RootStackScreenProps<keyof RootStackParamsList>
  >

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type EditProfileStackParamsList = {
  EditProfileDefault: undefined
  EditProfileSpokenLanguages: undefined
}

export type EditProfileStackScreenProps<
  T extends keyof EditProfileStackParamsList,
> = CompositeScreenProps<
  NativeStackScreenProps<EditProfileStackParamsList, T>,
  RootStackScreenProps<keyof RootStackParamsList>
>

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type EditIdentityStackParamsList = {
  EditIdentityPhoto: undefined
  EditIdentityNickname: undefined
  EditIdentitySummary: undefined
}

export type EditIdentityStackScreenProps<
  T extends keyof EditIdentityStackParamsList,
> = CompositeScreenProps<
  NativeStackScreenProps<EditIdentityStackParamsList, T>,
  RootStackScreenProps<keyof RootStackParamsList>
>

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type AppSettingsStackParamsList = {
  AppSettingsDefault: undefined
  AppSettingsLanguage: undefined
  AppSettingsCurrency: undefined
  AppSettingsAppearance: undefined
}

export type AppSettingsStackScreenProps<
  T extends keyof AppSettingsStackParamsList,
> = CompositeScreenProps<
  NativeStackScreenProps<AppSettingsStackParamsList, T>,
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
export type LoginFlowStackParamsList = {
  Intro1: undefined
  Intro2: undefined
  PhoneNumber: undefined
  CountryPicker: undefined
  VerificationCode: {
    readonly phoneNumber: E164PhoneNumber
    readonly initPhoneVerificationResponse: InitPhoneVerificationResponse
  }
}

export type LoginFlowStackScreenProps<
  T extends keyof LoginFlowStackParamsList,
> = CompositeScreenProps<
  NativeStackScreenProps<LoginFlowStackParamsList, T>,
  RootStackScreenProps<keyof RootStackParamsList>
>

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type PostLoginFlowStackParamsList = {
  ContactsImport: undefined
  NotificationSetup: undefined
  UsageInfo: undefined
}

export type PostLoginFlowStackScreenProps<
  T extends keyof PostLoginFlowStackParamsList,
> = CompositeScreenProps<
  NativeStackScreenProps<PostLoginFlowStackParamsList, T>,
  RootStackScreenProps<keyof RootStackParamsList>
>

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type InsideTabParamsList = {
  Marketplace:
    | {initialTab?: 'allOffers' | 'myOffers'; tabSwitchRequestId?: string}
    | undefined
  Messages: undefined
  Community: NavigatorScreenParams<CommunityParamsList> | undefined
}

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
}

export type TradeCalculatorStackScreenProps<
  T extends keyof TradeCalculatorStackParamsList,
> = CompositeScreenProps<
  NativeStackScreenProps<TradeCalculatorStackParamsList, T>,
  RootStackScreenProps<keyof RootStackParamsList>
>

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type DonationsFlowParamsList = {
  MyDonations: undefined
  SetDonation: undefined
  DonationDetails: {readonly invoiceId: InvoiceId}
}

export type DonationsFlowScreenProps<T extends keyof DonationsFlowParamsList> =
  CompositeScreenProps<
    NativeStackScreenProps<DonationsFlowParamsList, T>,
    RootStackScreenProps<keyof RootStackParamsList>
  >

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type TradeChecklistStackParamsList = {
  AgreeOnTradeDetails: undefined
  RevealIdentityPhoto: undefined
  RevealIdentityNickname: undefined
  RevealIdentitySummary: undefined
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
  ConfirmAmount: {
    readonly amountData: AmountData | undefined
  }
  PremiumOrDiscount: undefined
  Network: {
    readonly networkData: NetworkData | undefined
  }
  BtcAddress: undefined

  LocationMapPreview: {
    readonly selectedLocation: MeetingLocationData
  }
  LocationMapSelect:
    | {
        readonly initialLocation?: MeetingLocationData
        readonly selectedLocation?: MeetingLocationData
      }
    | undefined
  LocationSearch: undefined
}

export type TradeChecklistStackScreenProps<
  T extends keyof TradeChecklistStackParamsList,
> = CompositeScreenProps<
  NativeStackScreenProps<TradeChecklistStackParamsList, T>,
  RootStackScreenProps<keyof RootStackParamsList>
>

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type JoinClubFlowParamsList = {
  ScanClubQrCodeScreen: undefined
  FillClubAccessCodeScreen: {autoSubmit?: boolean; code?: ClubCode} | undefined
  MakingSureScreen: {code: ClubCode}
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
