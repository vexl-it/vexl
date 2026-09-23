import {type InvoiceStatus} from '@vexl-next/rest-api/src/services/content/contracts'
import {Array, pipe} from 'effect'
import {type MyDonation} from '../../../../state/donations/domain'

type DonationStatusGroup = 'inProgress' | 'paid' | 'unsuccessful'

export type DonationStatusFilter = 'all' | DonationStatusGroup

function donationStatusGroup(status: InvoiceStatus): DonationStatusGroup {
  switch (status) {
    case 'New':
    case 'Processing':
      return 'inProgress'
    case 'Paid':
    case 'Confirmed':
    case 'Complete':
    case 'Settled':
      return 'paid'
    case 'Expired':
    case 'Invalid':
      return 'unsuccessful'
  }
}

export function filterDonationsByStatus(
  donations: readonly MyDonation[],
  status: DonationStatusFilter
): readonly MyDonation[] {
  return status === 'all'
    ? donations
    : pipe(
        donations,
        Array.filter(
          (donation) => donationStatusGroup(donation.status) === status
        )
      )
}
