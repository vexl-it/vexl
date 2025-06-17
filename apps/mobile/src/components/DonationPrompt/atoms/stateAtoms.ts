import {atom} from 'jotai'

export const MAX_DONATION_AMOUNT = 1000 // Maximum donation amount in EUR
export const DONATION_PROMPT_DAYS_THRESHOLD_COUNT = 2
export const DONATION_PROMPT_CHAT_MESSAGES_THRESHOLD_COUNT = 10

export const donationAmountAtom = atom<string | undefined>(undefined)
export const donationPaymentMethodAtom = atom<'BTC-CHAIN' | 'BTC-LN'>('BTC-LN')
