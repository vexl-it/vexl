import {Array, Schema, pipe} from 'effect'
import assert from 'node:assert/strict'
import {execFile, spawn} from 'node:child_process'
import {once} from 'node:events'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {DatabaseSync} from 'node:sqlite'
import {test, type TestContext} from 'node:test'
import {setTimeout} from 'node:timers/promises'
import {fileURLToPath} from 'node:url'
import {promisify} from 'node:util'

const exec = promisify(execFile)
const root = fileURLToPath(new URL('../', import.meta.url))
const secret = 'synthetic-access-token'
const Row = Schema.Struct({
  user_id: Schema.String,
  expo_token: Schema.String,
  attempted_at: Schema.NullOr(Schema.String),
  send_status: Schema.String,
  send_response_json: Schema.NullOr(Schema.String),
  receipt_id: Schema.NullOr(Schema.String),
  receipt_status: Schema.NullOr(Schema.String),
  receipt_response_json: Schema.NullOr(Schema.String),
})

interface Fixture {
  folder: string
  db: string
  csv: string
  log: string
  run: (
    command: string[],
    scenario?: string
  ) => Promise<{stdout: string; stderr: string}>
  rows: () => ReadonlyArray<typeof Row.Type>
  writeCsv: (count: number) => void
  requests: () => string[]
  args: (command: string[]) => string[]
  environment: (scenario?: string) => NodeJS.ProcessEnv
}

function fixture(t: TestContext): Fixture {
  const folder = mkdtempSync(join(tmpdir(), 'expo-notifier-test-'))
  t.after(() => {
    rmSync(folder, {recursive: true, force: true})
  })
  const db = join(folder, 'state.sqlite')
  const csv = join(folder, 'users.csv')
  const log = join(folder, 'requests.jsonl')
  const environment: Fixture['environment'] = (scenario = 'success') => ({
    ...process.env,
    EXPO_ACCESS_TOKEN: secret,
    MOCK_EXPO_SCENARIO: scenario,
    MOCK_EXPO_LOG: log,
  })
  const args: Fixture['args'] = (command) => [
    '--import',
    './test/mock-expo.ts',
    './src/cli.ts',
    ...command,
    '--db',
    db,
  ]
  const run: Fixture['run'] = async (command, scenario) =>
    await exec(process.execPath, args(command), {
      cwd: root,
      env: environment(scenario),
      timeout: 20_000,
    })
  function rows(): ReadonlyArray<typeof Row.Type> {
    const connection = new DatabaseSync(db, {readOnly: true})
    try {
      return Schema.decodeUnknownSync(Schema.Array(Row))(
        connection.prepare('SELECT * FROM recipients ORDER BY user_id').all()
      )
    } finally {
      connection.close()
    }
  }
  function writeCsv(count: number): void {
    writeFileSync(
      csv,
      'id,expo_token\n' +
        pipe(
          Array.range(1, count),
          Array.map((id) => `${id},ExpoPushToken[test-${id}]`)
        ).join('\n') +
        '\n'
    )
  }
  const requests: Fixture['requests'] = () =>
    existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : []
  return {
    folder,
    db,
    csv,
    log,
    run,
    rows,
    writeCsv,
    requests,
    args,
    environment,
  }
}

const sendArgs = (limit: number): string[] => [
  'send',
  '--title',
  'Update Vexl',
  '--body',
  'Please update.\nDíky!',
  '--chunk-size',
  String(limit),
]

await test('CSV validation is atomic; quoted BOM CSV preserves large IDs; populated database rejects import', async (t) => {
  const f = fixture(t)
  for (const input of [
    'id,expo_token\n1,ExpoPushToken[a]\n2,ExpoPushToken[a]\n',
    'id,expo_token\n1,ExpoPushToken[a]\n1,ExpoPushToken[b]\n',
    'id,expo_token\n1,ExpoPushToken[a]\n2,invalid\n',
    'id,expo_token\n1,ExpoPushToken[a]\n2,"unfinished\n',
    'id,expo_token\n1,ExpoPushToken[a]\n2,ExpoPushToken[]\n',
    'id,expo_token,hash\n1,ExpoPushToken[a],private\n',
    'id,expo_token\n',
  ]) {
    writeFileSync(f.csv, input)
    await assert.rejects(f.run(['import', '--csv', f.csv]))
    assert.equal(f.rows().length, 0)
  }
  writeFileSync(
    f.csv,
    '\uFEFF"expo_token","id"\r\n"ExponentPushToken[abc]","9007199254740993"\r\n'
  )
  await f.run(['import', '--csv', f.csv])
  assert.equal(f.rows()[0]?.user_id, '9007199254740993')
  await assert.rejects(
    f.run(['import', '--csv', f.csv]),
    /empty recipients table/
  )
  assert.equal(f.rows().length, 1)
  assert.equal(statSync(f.db).mode & 0o077, 0)
})

await test('dry run does not mutate state; chunk limit, ticket errors, and repeated sends preserve attempts', async (t) => {
  const f = fixture(t)
  f.writeCsv(3)
  await f.run(['import', '--csv', f.csv])
  const before = f.rows()
  const preview = await f.run([...sendArgs(2), '--dry-run'])
  assert.match(preview.stdout, /"selected": 2/)
  assert.deepEqual(f.rows(), before)
  assert.equal(f.requests().length, 0)
  await assert.rejects(f.run(sendArgs(0)), /positive safe integer/)
  await f.run(sendArgs(2), 'mixed')
  let rows = f.rows()
  assert.equal(rows[0]?.send_status, 'error')
  assert.match(rows[0]?.send_response_json ?? '', /DeviceNotRegistered/)
  assert.equal(rows[1]?.send_status, 'accepted')
  assert.equal(rows[1]?.receipt_id, 'receipt:ExpoPushToken[test-2]')
  assert.equal(rows[2]?.send_status, 'pending')
  const sentRows = pipe(rows, Array.take(2))
  await f.run(sendArgs(100))
  await f.run(sendArgs(100))
  rows = f.rows()
  assert.deepEqual(pipe(rows, Array.take(2)), sentRows)
  assert.equal(rows[2]?.send_status, 'accepted')
  assert.equal(f.requests().length, 2)
  assert.doesNotMatch(
    f.requests().join('\n'),
    /user_id|_contentAvailable|mutableContent|"data"/
  )
  await assert.rejects(f.run(['import', '--csv', f.csv]))
  assert.deepEqual(f.rows(), rows)
})

await test('invocation chunk size is independent of Expo batch size', async (t) => {
  const f = fixture(t)
  f.writeCsv(205)
  await f.run(['import', '--csv', f.csv])
  await f.run(sendArgs(150))
  assert.equal(
    pipe(
      f.rows(),
      Array.filter((row) => row.attempted_at !== null)
    ).length,
    150
  )
  const sizes = pipe(
    f.requests(),
    Array.map(
      (line) =>
        Schema.decodeUnknownSync(
          Schema.Struct({body: Schema.Array(Schema.Unknown)})
        )(JSON.parse(line)).body.length
    )
  )
  assert.deepEqual(sizes, [100, 50])
})

await test('request rejection is persisted and halts before later batches; access token is redacted', async (t) => {
  const f = fixture(t)
  f.writeCsv(120)
  await f.run(['import', '--csv', f.csv])
  await assert.rejects(
    f.run(sendArgs(120), 'reject'),
    /100 records saved as error/
  )
  const rows = f.rows()
  assert.equal(
    pipe(
      rows,
      Array.filter((row) => row.send_status === 'error')
    ).length,
    100
  )
  assert.equal(
    pipe(
      rows,
      Array.filter((row) => row.send_status === 'pending')
    ).length,
    20
  )
  assert.doesNotMatch(JSON.stringify(rows), new RegExp(secret))
  assert.match(JSON.stringify(rows), /REDACTED/)
  await f.run(sendArgs(120))
  assert.equal(f.requests().length, 2)
})

await test('outage after a successful batch preserves successes and leaves later batches pending', async (t) => {
  const f = fixture(t)
  f.writeCsv(250)
  await f.run(['import', '--csv', f.csv])
  await assert.rejects(
    f.run(sendArgs(250), 'outage'),
    /100 records saved as unknown/
  )
  const states = (state: string): number =>
    pipe(
      f.rows(),
      Array.filter((row) => row.send_status === state)
    ).length
  assert.equal(states('accepted'), 100)
  assert.equal(states('unknown'), 100)
  assert.equal(states('pending'), 50)
  assert.equal(f.requests().length, 2)
})

await test('network and malformed response outcomes are unknown and never retried by later commands', async (t) => {
  for (const scenario of ['network', 'malformed']) {
    await t.test(scenario, async (t) => {
      const f = fixture(t)
      f.writeCsv(1)
      await f.run(['import', '--csv', f.csv])
      await assert.rejects(f.run(sendArgs(1), scenario), /saved as unknown/)
      const before = f.rows()
      await f.run(sendArgs(1))
      assert.deepEqual(f.rows(), before)
      assert.equal(before[0]?.send_status, 'unknown')
    })
  }
})

await test('SDK handles HTTP 429 retry inside a single saved attempt', async (t) => {
  const f = fixture(t)
  f.writeCsv(1)
  await f.run(['import', '--csv', f.csv])
  await f.run(sendArgs(1), 'rate-limit')
  assert.equal(f.requests().length, 2)
  assert.equal(f.rows()[0]?.send_status, 'accepted')
})

await test('SIGKILL leaves unknown attempts, blocks concurrent writers, and automatically releases the lock', async (t) => {
  const f = fixture(t)
  f.writeCsv(120)
  await f.run(['import', '--csv', f.csv])
  const child = spawn(process.execPath, f.args(sendArgs(120)), {
    cwd: root,
    env: f.environment('crash'),
    stdio: 'ignore',
  })
  t.after(() => {
    child.kill('SIGKILL')
  })
  const exited = once(child, 'exit')
  const deadline = Date.now() + 10_000
  while (!existsSync(f.log) && Date.now() < deadline && child.exitCode === null)
    await setTimeout(50)
  assert.ok(existsSync(f.log), 'child reached the mocked Expo request')
  await assert.rejects(f.run(sendArgs(120)), /Another command/)
  await assert.rejects(f.run(['receipts']), /Another command/)
  const during = await f.run(['status'])
  assert.match(during.stdout, /unknown/)
  child.kill('SIGKILL')
  await exited
  assert.equal(
    pipe(
      f.rows(),
      Array.filter((row) => row.send_status === 'unknown')
    ).length,
    100
  )
  await f.run(sendArgs(120))
  assert.equal(
    pipe(
      f.rows(),
      Array.filter((row) => row.send_status === 'accepted')
    ).length,
    20
  )
  assert.equal(f.requests().length, 2)
})

await test('receipt pass saves raw responses, revisits missing results, and skips completed results', async (t) => {
  const f = fixture(t)
  f.writeCsv(3)
  await f.run(['import', '--csv', f.csv])
  await f.run(sendArgs(3))
  const sends = pipe(
    f.rows(),
    Array.map((row) => row.send_response_json)
  )
  await f.run(['receipts'], 'missing-receipts')
  assert.deepEqual(
    pipe(
      f.rows(),
      Array.map((row) => row.receipt_status)
    ),
    ['ok', 'missing', 'missing']
  )
  assert.equal(f.requests().length, 2)
  await f.run(['receipts'], 'receipt-error')
  assert.deepEqual(
    pipe(
      f.rows(),
      Array.map((row) => row.receipt_status)
    ),
    ['ok', 'error', 'ok']
  )
  assert.match(f.rows()[1]?.receipt_response_json ?? '', /InvalidCredentials/)
  await f.run(['receipts'])
  assert.equal(f.requests().length, 3)
  assert.deepEqual(
    pipe(
      f.rows(),
      Array.map((row) => row.send_response_json)
    ),
    sends
  )
})

await test('receipt failures remain checkable, malformed results fail visibly, and overdue missing receipts appear in status', async (t) => {
  const f = fixture(t)
  f.writeCsv(1)
  await f.run(['import', '--csv', f.csv])
  await f.run(sendArgs(1))
  await assert.rejects(
    f.run(['receipts'], 'receipt-failure'),
    /Receipt lookup failed/
  )
  assert.equal(f.rows()[0]?.receipt_status, 'lookup_failed')
  await assert.rejects(
    f.run(['receipts'], 'malformed-receipts'),
    /malformed receipts/
  )
  const connection = new DatabaseSync(f.db)
  connection
    .prepare('UPDATE recipients SET attempted_at = ?')
    .run(new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString())
  connection.close()
  assert.match(
    (await f.run(['status'])).stdout,
    /"unresolvedReceiptsOlderThan24Hours": 1/
  )
  await f.run(['receipts'])
  assert.equal(f.rows()[0]?.receipt_status, 'ok')
})

await test('send never creates a database for a mistyped path', async (t) => {
  const f = fixture(t)
  await assert.rejects(f.run(sendArgs(1)), /Database does not exist/)
  assert.equal(existsSync(f.db), false)
})
