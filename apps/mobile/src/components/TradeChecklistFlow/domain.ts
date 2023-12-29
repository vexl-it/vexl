import {z} from 'zod'

export const TradeChecklistItem = z.enum([
  'DATE_AND_TIME',
  'MEETING_LOCATION',
  'CALCULATE_AMOUNT',
  'SET_NETWORK',
  'REVEAL_IDENTITY',
  'REVEAL_PHONE_NUMBER',
])
export type TradeChecklistItem = z.TypeOf<typeof TradeChecklistItem>
