import {type UserNameAndAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'
import {type UserName} from '@vexl-next/domain/dist/general/UserName.brand'
import {
  type InitPhoneNumberVerificationResponse,
  type VerifyPhoneNumberResponse,
} from '@vexl-next/rest-api/dist/services/user/contracts'
import {type SerializedPrivateKey} from './components/LoginFlow/utils'
import {type E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {
  type CompositeScreenProps,
  type NavigatorScreenParams,
} from '@react-navigation/native'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RootStackParamsList = {
  LoginFlow: NavigatorScreenParams<LoginStackParamsList>

  PostLoginFlow: NavigatorScreenParams<PostLoginStackParamsList>

  InsideTabs: NavigatorScreenParams<InsideTabParamsList>

  // TODO terms and conditions etc
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
    readonly privateKey: SerializedPrivateKey
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
    NativeStackScreenProps<InsideTabParamsList, T>,
    RootStackScreenProps<keyof RootStackParamsList>
  >

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamsList {}
  }
}
