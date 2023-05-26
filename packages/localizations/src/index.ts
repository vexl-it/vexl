import en from "./en"
import sk from "./sk"
import cs from "./cs"
import {type PathInto} from "./PathInto"

export const translations = {
  en,
  cs,
  sk
}
export type LocaleKeys = PathInto<typeof en>
