import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {type UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {Typography} from '@vexl-next/ui'
import {getOtherSideFriendLevel} from '../utils/chat/getOtherSideFriendLevel'
import {useTranslation} from '../utils/localization/I18nProvider'

export function OtherSideNameForChat({
  offerInfo,
  userName,
}: {
  offerInfo: OfferInfo
  userName?: UserName
}): React.ReactElement {
  const {t} = useTranslation()
  const toShow = userName ?? getOtherSideFriendLevel({offerInfo, t})

  return (
    <Typography color="$foregroundPrimary" variant="paragraphSmall">
      {toShow}
    </Typography>
  )
}
