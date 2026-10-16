import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {MegaphoneNotifications, MenuItem, Switch} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React, {useMemo} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {nearbyOffersEnabledAtom} from '../../../utils/preferences'
import {createNearbySharingSwitchAtom} from '../atoms'

function NearbySharingMenuItem({
  offerId,
}: {
  readonly offerId: OfferId
}): React.ReactElement | null {
  const {t} = useTranslation()
  const nearbyOffersEnabled = useAtomValue(nearbyOffersEnabledAtom)
  const nearbySharingAtom = useMemo(
    () => createNearbySharingSwitchAtom(offerId),
    [offerId]
  )
  const isSharedNearby = useAtomValue(nearbySharingAtom)

  // Stay visible while sharing so the owner can always turn it off.
  if (!nearbyOffersEnabled && !isSharedNearby) return null

  return (
    <MenuItem
      label={t('editOffer.nearbySharing.label')}
      note={t('editOffer.nearbySharing.note')}
      icon={MegaphoneNotifications}
      showChevron={false}
      tag={<Switch valueAtom={nearbySharingAtom} />}
    />
  )
}

export default NearbySharingMenuItem
