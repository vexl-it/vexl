// Fake passkeys for /admins. While they exist /login no longer offers the first-admin setup (it needs zero passkeys); remove them with:
// docker exec vexl-postgres psql -U postgres -d backoffice -c "DELETE FROM backoffice_passkeys WHERE credential_id LIKE 'dev-seed-%'"
import {Array, Schema} from 'effect'
import {
  ALL_SECTIONS,
  type BackofficeSection,
  PasskeyListResponse,
} from '../../src/services/access/domain'
import {BACKOFFICE_URL, psql} from './shared'

const CREDENTIAL_ID_PREFIX = 'dev-seed-'

interface SeedPasskey {
  readonly label: string
  readonly sections: readonly BackofficeSection[]
  /** Postgres intervals counted back from now; `null` means never used. */
  readonly createdAgo: string
  readonly usedAgo: string | null
}

const PASSKEYS: readonly SeedPasskey[] = [
  {
    // The label of the session the backoffice hands out with auth disabled, so one row is marked as "You".
    label: 'Local development (auth disabled)',
    sections: ALL_SECTIONS,
    createdAgo: '350 days',
    usedAgo: '2 minutes',
  },
  {
    label: 'Alice Example – MacBook',
    sections: ['clubs', 'bannedNumbers', 'productNotifications', 'admins'],
    createdAgo: '290 days',
    usedAgo: '3 hours',
  },
  {
    label: 'Bob Placeholder – YubiKey',
    sections: ['clubs', 'bannedNumbers'],
    createdAgo: '212 days',
    usedAgo: '26 hours',
  },
  {
    label: 'Carol Sample – iPhone',
    sections: ['cms'],
    createdAgo: '180 days',
    usedAgo: '6 days',
  },
  {
    label:
      'Heidi Demo – shared marketing security key (office safe, second drawer)',
    sections: ['cms', 'slideshows', 'productNotifications', 'shortLinks'],
    createdAgo: '120 days',
    usedAgo: '40 minutes',
  },
  {
    label: 'Mallory Mock – Android phone',
    sections: ['productNotifications', 'shortLinks'],
    createdAgo: '95 days',
    usedAgo: '70 days',
  },
  {
    label: 'Grace Test – iPad',
    sections: ['shortLinks'],
    createdAgo: '330 days',
    usedAgo: '225 days',
  },
  {
    label: 'Trent Fake – Windows Hello',
    sections: ['slideshows', 'cms'],
    createdAgo: '9 days',
    usedAgo: null,
  },
  {
    label: 'Zed',
    sections: ['bannedNumbers'],
    createdAgo: '5 hours',
    usedAgo: '5 hours',
  },
]

// The key is a placeholder no authenticator matches, so nobody can sign in with these rows.
const sql = `
  DELETE FROM backoffice_passkeys WHERE credential_id LIKE '${CREDENTIAL_ID_PREFIX}%';
  INSERT INTO backoffice_passkeys
    (label, credential_id, public_key, counter, transports, permissions, created_at, last_used_at)
  SELECT label, "credentialId", '\\x00', 0, '[]', sections,
    now() - "createdAgo"::interval, now() - "usedAgo"::interval
  FROM jsonb_to_recordset($seed$${JSON.stringify(
    Array.map(PASSKEYS, (passkey, index) => ({
      ...passkey,
      credentialId: `${CREDENTIAL_ID_PREFIX}${index}`,
    }))
  )}$seed$) AS seed
    (label text, "credentialId" text, sections jsonb, "createdAgo" text, "usedAgo" text);
`

psql('backoffice', sql)

void fetch(`${BACKOFFICE_URL}/api/admin/passkeys`)
  .then(async (response) => await response.json())
  .then(Schema.decodeUnknownSync(PasskeyListResponse))
  .then(({passkeys}) => {
    console.log(
      `Seeded ${PASSKEYS.length} fake passkeys; /admins now lists ${passkeys.length}.`
    )
  })
