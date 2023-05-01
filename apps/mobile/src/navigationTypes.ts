import {type UserNameAndAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'
import {type UserName} from '@vexl-next/domain/dist/general/UserName.brand'
import {
  type InitPhoneNumberVerificationResponse,
  type VerifyPhoneNumberResponse,
} from '@vexl-next/rest-api/dist/services/user/contracts'
import {type E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {type BottomTabScreenProps} from '@react-navigation/bottom-tabs'
import {type MaterialTopTabScreenProps} from '@react-navigation/material-top-tabs'
import {
  type CompositeScreenProps,
  type NavigatorScreenParams,
} from '@react-navigation/native'
import {
  type OfferId,
  type OfferType,
} from '@vexl-next/domain/dist/general/offers'
import {type ChatId} from '@vexl-next/domain/dist/general/messaging'
import {type KeyHolder} from '@vexl-next/cryptography'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RootStackParamsList = {
  LoginFlow: NavigatorScreenParams<LoginStackParamsList>

  PostLoginFlow: NavigatorScreenParams<PostLoginStackParamsList>

  InsideTabs: NavigatorScreenParams<InsideTabParamsList>

  CreateOffer: undefined

  OfferDetail: {offerId: OfferId}

  ChatDetail: {chatId: ChatId; inboxKey: PublicKeyPemBase64}

  NotificationPermissionsMissing: undefined

  TermsAndConditions: undefined

  Faqs: undefined

  TodoScreen: undefined

  SetContacts: undefined

  DebugScreen: undefined
}

export type RootStackScreenProps<T extends keyof RootStackParamsList> =
  NativeStackScreenProps<RootStackParamsList, T>

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type LoginStackParamsList = {
  AnonymizationAnimation: {
    readonly realUserData: UserNameAndAvatar
  }
  AnonymizationNotice: undefined
  Intro: undefined
  Name: undefined
  PhoneNumber: {
    readonly realUserData: UserNameAndAvatar
    readonly anonymizedUserData: UserNameAndAvatar
  }
  Photo: {userName: UserName}
  Start: undefined
  SuccessLogin: {
    readonly verifyPhoneNumberResponse: VerifyPhoneNumberResponse
    readonly privateKey: KeyHolder.PrivateKeyHolder
    readonly realUserData: UserNameAndAvatar
    readonly anonymizedUserData: UserNameAndAvatar
    readonly phoneNumber: E164PhoneNumber
  }
  VerificationCode: {
    readonly realUserData: UserNameAndAvatar
    readonly anonymizedUserData: UserNameAndAvatar
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
  Messages: undefined
  Settings: undefined
}

export type InsideTabScreenProps<T extends keyof InsideTabParamsList> =
  CompositeScreenProps<
    BottomTabScreenProps<InsideTabParamsList, T>,
    RootStackScreenProps<keyof RootStackParamsList>
  >

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type MarketplaceTabParamsList = {
  Buy: {type: OfferType}
  Sell: {type: OfferType}
}

export type MarketplaceTabScreenProps<
  T extends keyof MarketplaceTabParamsList
> = CompositeScreenProps<
  MaterialTopTabScreenProps<MarketplaceTabParamsList, T>,
  InsideTabScreenProps<keyof InsideTabParamsList>
>

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamsList {}
  }
}
