import {type InvoiceId} from '@vexl-next/rest-api/src/services/content/contracts'
import {Array, Effect, Either, Option, Schema} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import {apiAtom} from '../../api'
import {atomWithParsedMmkvStorageE} from '../../utils/atomUtils/atomWithParsedMmkvStorageE'
import {type FocusAtomType} from '../../utils/atomUtils/FocusAtomType'
import {MyDonation} from './domain'

const myDonationsStorageAtom = atomWithParsedMmkvStorageE(
  'myDonations',
  {data: [], state: 'loaded'},
  Schema.Struct({
    data: Schema.Array(MyDonation).pipe(Schema.mutable),
    state: Schema.Literal('loading', 'loaded'),
  })
)

export const myDonationsAtom = focusAtom(myDonationsStorageAtom, (optic) =>
  optic.prop('data')
)

export const myDonationsSortedAtom = atom((get) =>
  get(myDonationsAtom).sort((a, b) => b.createdTime - a.createdTime)
)

export const myDonationsAtomsAtom = splitAtom(myDonationsSortedAtom)

export const myDonationsStateAtom = focusAtom(myDonationsStorageAtom, (optic) =>
  optic.prop('state')
)

export function singleDonationAtom(
  invoiceid: InvoiceId
): FocusAtomType<MyDonation | undefined> {
  return focusAtom(myDonationsAtom, (optic) =>
    optic.find((myDonation) => myDonation.invoiceId === invoiceid)
  )
}

export const fetchMyDonationsActionAtom = atom(null, (get, set) => {
  return Effect.gen(function* (_) {
    const api = get(apiAtom)
    const myDonations = get(myDonationsAtom)

    const invoiceIdsToFetch = Array.filterMap(myDonations, (donation) =>
      donation.status === 'New' || donation.status === 'Processing'
        ? Option.some(donation.invoiceId)
        : Option.none()
    )

    if (Array.isEmptyArray(invoiceIdsToFetch))
      return Effect.succeed(Effect.void)

    set(myDonationsStateAtom, 'loading')

    // Fetch only donations that were in 'New' or 'Processing' state
    const fetchedDonations = yield* _(
      myDonations,
      Array.map((donation) => {
        return Effect.gen(function* (_) {
          if (!Array.contains(invoiceIdsToFetch, donation.invoiceId)) {
            return yield* _(
              Effect.fail({
                _tag: 'NoNeedToFetchInvoice' as const,
                invoiceId: donation.invoiceId,
              })
            )
          }

          const resp = yield* _(
            api.content.getInvoice({
              invoiceId: donation.invoiceId,
              storeId: donation.storeId,
            }),
            Effect.mapError((e) => ({...e, invoiceId: donation.invoiceId}))
          )

          return {
            ...donation,
            status: resp.status,
          } satisfies MyDonation
        }).pipe(Effect.either)
      }),
      Effect.all
    )

    set(myDonationsStorageAtom, (prev) => ({
      ...prev,
      state: 'loaded',
      data: pipe(
        fetchedDonations,
        Array.filterMap((fetchedDonation) => {
          return Either.match(fetchedDonation, {
            onLeft: (e) => {
              if (e._tag === 'InvoiceNotFoundError') return Option.none()

              return Array.findFirst(
                prev.data,
                (oldDonation) => oldDonation.invoiceId === e.invoiceId
              )
            },
            onRight: Option.some,
          })
        })
      ),
    }))
  })
})
