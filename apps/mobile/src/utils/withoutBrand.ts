import {type z} from 'zod'
export type withoutBrand<T> = Omit<T, typeof z.BRAND>
