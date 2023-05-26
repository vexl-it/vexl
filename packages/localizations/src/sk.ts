import otherSk from "./chunks/other.sk"
import termsOfUse from "./chunks/termsOfUse.sk"
import privacyPolicy from "./chunks/privacyPolicy.sk"
import {type chunks as enChunks} from "./en"

const chunks: typeof enChunks = {
  "termsOfUseMD": termsOfUse,
  "privacyPolicyMD": privacyPolicy
}

const skLocale = {
  ...otherSk,
  ...chunks
}
export default skLocale
