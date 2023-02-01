export type SignedChallenge = {
  challenge: string
  signature: string
}

export type RequestChallengeRequest = {
  publicKey: string
}

export type RequestChallengeResponse = {
  challenge: string
  /**
   * example format: "2022-12-22T12:02:19.260Z"
   */
  expiration: string
}

export type CreateInboxRequest = {
  publicKey: string
  token?: string
  signedChallenge: SignedChallenge
}

export type CreateInboxResponse = {}

export type ApprovalRequestRequest = {
  publicKey: string
  message: string
}

export enum MessageType {
  MESSAGE = 'MESSAGE',
  REQUEST_REVEAL = 'REQUEST_REVEAL',
  APPROVE_REVEAL = 'APPROVE_REVEAL',
  DECLINE_REVEAL = 'DECLINE_REVEAL',
  REQUEST_MESSAGING = 'REQUEST_MESSAGING',
  APPROVE_MESSAGING = 'APPROVE_MESSAGING',
  DISAPPROVE_MESSAGING = 'DISAPPROVE_MESSAGING',
  DELETE_CHAT = 'DELETE_CHAT',
}

export type MessageResponse = {
  id: number
  message: string
  senderPublicKey: string
  messageType: MessageType
}
