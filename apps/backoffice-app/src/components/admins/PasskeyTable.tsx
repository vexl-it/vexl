'use client'

import {
  Badge,
  Button,
  Card,
  EmptyState,
  PencilIcon,
  SearchInput,
  Select,
  ShieldIcon,
  type SortState,
  SortTh,
  Table,
  Td,
  TdActions,
  Th,
  Tr,
  TrashIcon,
} from '@/src/components/ui'
import {
  ALL_SECTIONS,
  BackofficeSection,
  type Passkey,
  SECTION_NAMES,
} from '@/src/services/access/domain'
import {formatDate, formatDateTime} from '@/src/services/format'
import {Array, Option, Order, pipe, Schema} from 'effect'
import {type ReactNode, useState} from 'react'
import {isAdmin, SectionBadges} from './sections'
import {formatRelative, useNow} from './time'

const decodeSection = Schema.decodeUnknownOption(BackofficeSection)

type SortKey = 'label' | 'createdAt' | 'lastUsedAt'

// ISO timestamps sort as text; a passkey that was never used counts as the oldest.
const ORDERS: Record<SortKey, Order.Order<Passkey>> = {
  label: Order.mapInput(Order.string, (passkey) => passkey.label.toLowerCase()),
  createdAt: Order.mapInput(Order.string, (passkey) => passkey.createdAt),
  lastUsedAt: Order.mapInput(
    Order.string,
    (passkey) => passkey.lastUsedAt ?? ''
  ),
}

export function PasskeyTable({
  passkeys,
  loading,
  ownId,
  lastAdminId,
  revokingId,
  inviteAction,
  onEdit,
  onRevoke,
}: {
  readonly passkeys: readonly Passkey[]
  readonly loading: boolean
  readonly ownId: string | null
  /** Set while exactly one passkey has Admins: that one cannot be revoked. */
  readonly lastAdminId: string | null
  readonly revokingId: string | null
  readonly inviteAction: ReactNode
  readonly onEdit: (passkey: Passkey) => void
  readonly onRevoke: (passkey: Passkey) => void
}) {
  const now = useNow(60_000)
  const [search, setSearch] = useState('')
  const [sectionFilter, setSectionFilter] = useState(
    Option.none<BackofficeSection>()
  )
  const [sort, setSort] = useState<SortState<SortKey>>({
    key: 'createdAt',
    descending: false,
  })

  const query = search.trim().toLowerCase()
  const order = ORDERS[sort.key]
  const visiblePasskeys = pipe(
    passkeys,
    Array.filter(
      (passkey) =>
        passkey.label.toLowerCase().includes(query) &&
        (Option.isNone(sectionFilter) ||
          Array.contains(passkey.sections, sectionFilter.value))
    ),
    Array.sort(sort.descending ? Order.reverse(order) : order)
  )

  return (
    <Card
      flush
      title="Passkeys"
      description={
        loading
          ? undefined
          : `${passkeys.length} in total, ${Array.filter(passkeys, isAdmin).length} with the Admins section`
      }
      actions={
        <>
          <SearchInput
            className="w-full sm:w-52"
            aria-label="Search passkeys by label"
            placeholder="Search by label"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
            }}
          />
          <div className="w-full sm:w-52">
            <Select
              aria-label="Filter by section"
              value={Option.getOrElse(sectionFilter, () => '')}
              onChange={(event) => {
                setSectionFilter(decodeSection(event.target.value))
              }}
            >
              <option value="">Any section</option>
              {Array.map(ALL_SECTIONS, (section) => (
                <option key={section} value={section}>
                  Can open {SECTION_NAMES[section]}
                </option>
              ))}
            </Select>
          </div>
        </>
      }
    >
      <Table
        loading={loading}
        head={
          <>
            <SortTh sortKey="label" sort={sort} onSort={setSort}>
              Passkey
            </SortTh>
            <Th>Sections</Th>
            <SortTh sortKey="createdAt" sort={sort} onSort={setSort}>
              Created
            </SortTh>
            <SortTh sortKey="lastUsedAt" sort={sort} onSort={setSort}>
              Last used
            </SortTh>
            <Th />
          </>
        }
        empty={
          Array.isNonEmptyReadonlyArray(passkeys) ? (
            <EmptyState
              title="No passkey matches"
              description="Try another label or section."
              action={
                <Button
                  onClick={() => {
                    setSearch('')
                    setSectionFilter(Option.none())
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<ShieldIcon className="size-5" />}
              title="No passkeys yet"
              description="Admins show up here once they register a passkey from an invite link."
              action={inviteAction}
            />
          )
        }
      >
        {Array.map(visiblePasskeys, (passkey) => (
          <Tr key={passkey.id}>
            <Td className="min-w-48">
              <span className="mr-2 font-medium">{passkey.label}</span>
              {passkey.id === ownId ? <Badge tone="info">You</Badge> : null}
            </Td>
            <Td className="min-w-56">
              <SectionBadges sections={passkey.sections} />
            </Td>
            <Td
              className="whitespace-nowrap"
              title={formatDateTime(passkey.createdAt)}
            >
              <span className="text-ink-muted">
                {formatDate(passkey.createdAt)}
              </span>
            </Td>
            {passkey.lastUsedAt === null ? (
              <Td title="Nobody has signed in with this passkey since it was created">
                <span className="text-ink-subtle">Never</span>
              </Td>
            ) : (
              <Td
                className="whitespace-nowrap"
                title={formatDateTime(passkey.lastUsedAt)}
              >
                <span className="text-ink-muted">
                  {formatRelative(passkey.lastUsedAt, now)}
                </span>
              </Td>
            )}
            <TdActions>
              <Button
                size="sm"
                variant="ghost"
                icon={<PencilIcon />}
                onClick={() => {
                  onEdit(passkey)
                }}
              >
                Edit sections
              </Button>
              {/* Disabled buttons ignore the pointer, so the hint sits on a wrapper. */}
              <span
                title={
                  passkey.id === lastAdminId
                    ? 'This is the only passkey with the Admins section, so it cannot be revoked.'
                    : undefined
                }
              >
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<TrashIcon />}
                  disabled={passkey.id === lastAdminId}
                  loading={passkey.id === revokingId}
                  onClick={() => {
                    onRevoke(passkey)
                  }}
                >
                  Revoke
                </Button>
              </span>
            </TdActions>
          </Tr>
        ))}
      </Table>
    </Card>
  )
}
