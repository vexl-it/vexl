import {Badge, Checkbox} from '@/src/components/ui'
import {
  ALL_SECTIONS,
  type BackofficeSection,
  type Passkey,
  SECTION_NAMES,
} from '@/src/services/access/domain'
import {Array} from 'effect'

export const isAdmin = (passkey: Passkey): boolean =>
  Array.contains(passkey.sections, 'admins')

const hasEverySection = (sections: readonly BackofficeSection[]): boolean =>
  Array.every(ALL_SECTIONS, (section) => Array.contains(sections, section))

export function SectionBadges({
  sections,
}: {
  readonly sections: readonly BackofficeSection[]
}) {
  if (!Array.isNonEmptyReadonlyArray(sections))
    return <Badge tone="danger">No sections</Badge>
  if (hasEverySection(sections))
    return <Badge tone="accent">All sections</Badge>
  return (
    <div className="flex flex-wrap gap-1">
      {Array.map(sections, (section) => (
        <Badge key={section} tone={section === 'admins' ? 'accent' : 'neutral'}>
          {SECTION_NAMES[section]}
        </Badge>
      ))}
    </div>
  )
}

export function SectionPicker({
  selected,
  onChange,
  adminsLocked = false,
  error,
}: {
  readonly selected: readonly BackofficeSection[]
  readonly onChange: (sections: readonly BackofficeSection[]) => void
  /** Keeps Admins checked: the last passkey that has it must not lose it. */
  readonly adminsLocked?: boolean
  readonly error?: string | null
}) {
  const allSelected = hasEverySection(selected)
  const isLocked = (section: BackofficeSection): boolean =>
    adminsLocked && section === 'admins'

  return (
    <div role="group" aria-label="Sections">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink">Sections</span>
        <button
          type="button"
          onClick={() => {
            onChange(
              allSelected ? Array.filter(selected, isLocked) : ALL_SECTIONS
            )
          }}
          className="cursor-pointer text-xs font-medium text-ink-muted underline underline-offset-2 hover:text-ink"
        >
          {allSelected ? 'Clear all' : 'Select all'}
        </button>
      </div>
      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
        {Array.map(ALL_SECTIONS, (section) => (
          <Checkbox
            key={section}
            label={SECTION_NAMES[section]}
            description={
              section !== 'admins'
                ? undefined
                : adminsLocked
                  ? 'Locked: this is the only passkey that can manage admins.'
                  : 'Can invite admins, change their sections and revoke passkeys.'
            }
            className={section === 'admins' ? 'sm:col-span-2' : undefined}
            checked={Array.contains(selected, section)}
            disabled={isLocked(section)}
            onChange={() => {
              onChange(
                Array.filter(
                  ALL_SECTIONS,
                  (current) =>
                    (current === section) !== Array.contains(selected, current)
                )
              )
            }}
          />
        ))}
      </div>
      {error ? <p className="mt-2 text-xs text-danger-ink">{error}</p> : null}
    </div>
  )
}
