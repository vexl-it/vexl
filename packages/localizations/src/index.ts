import en from "./en"
import sk from "./sk"
import cs from "./cs"
import de from "./de"
import it from "./it"
import fr from "./fr"
import pt from "./pt"
import sp from "./sp"
import {type PathInto} from "./PathInto"

export const translations = {
  en,
  cs,
  sk,
  de,
  it,
  fr,
  sp,
  pt
}
export type LocaleKeys = PathInto<typeof en>
