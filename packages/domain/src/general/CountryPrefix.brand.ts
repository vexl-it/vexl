import {z} from 'zod'

export const CountryPrefix = z.number().int().brand<'CountryPrefix'>()
export type CountryPrefix = z.TypeOf<typeof CountryPrefix>
