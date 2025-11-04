import {Effect, Record} from 'effect/index'

const json = {
  'Cleanup removed clubs on mount': [
    {
      'startedAt': 1762182564817,
      'endedAt': 1762182564817,
    },
  ],
  'Check and report current version to chats': [
    {
      'startedAt': 1762182564816,
      'endedAt': 1762182564903,
    },
  ],
  'Refresh user on contact': [
    {
      'startedAt': 1762182564810,
      'endedAt': 1762182565084,
    },
    {
      'startedAt': 1762182577536,
      'endedAt': 1762182577732,
    },
  ],
  'Refresh offers': [
    {
      'startedAt': 1762182564812,
      'endedAt': 1762182565085,
    },
    {
      'startedAt': 1762182564806,
      'endedAt': 1762182565251,
      'description': 'Incoming offers: 0. Removed offers: 0',
    },
    {
      'startedAt': 1762182577538,
      'endedAt': 1762182577726,
    },
    {
      'startedAt': 1762182577534,
      'endedAt': 1762182577881,
      'description': 'Incoming offers: 0. Removed offers: 0',
    },
  ],
  'Check offer inboxes': [
    {
      'startedAt': 1762182565085,
      'endedAt': 1762182565085,
    },
    {
      'startedAt': 1762182577726,
      'endedAt': 1762182577726,
    },
  ],
  'Load contacts from device': [
    {
      'startedAt': 1762182564816,
      'endedAt': 1762182565376,
    },
    {
      'startedAt': 1762182577540,
      'endedAt': 1762182577966,
    },
  ],
  'Refresh notification token on contact service': [
    {
      'startedAt': 1762182564809,
      'endedAt': 1762182565581,
    },
    {
      'startedAt': 1762182577535,
      'endedAt': 1762182578315,
    },
  ],
  'Refresh notification tokens': [
    {
      'startedAt': 1762182564812,
      'endedAt': 1762182565584,
    },
    {
      'startedAt': 1762182577537,
      'endedAt': 1762182578324,
    },
  ],
  'Notification tokens': [
    {
      'startedAt': 1762182565085,
      'endedAt': 1762182565585,
      'description': 'Refreshed successfully: 0, failed: 0',
    },
    {
      'startedAt': 1762182565581,
      'endedAt': 1762182565785,
      'description': 'Refreshed successfully: 0, failed: 0',
    },
    {
      'startedAt': 1762182577726,
      'endedAt': 1762182578327,
      'description': 'Refreshed successfully: 0, failed: 0',
    },
    {
      'startedAt': 1762182578315,
      'endedAt': 1762182579384,
      'description': 'Refreshed successfully: 0, failed: 0',
    },
  ],
  'Sync connections': [
    {
      'startedAt': 1762182564814,
      'endedAt': 1762182571401,
    },
    {
      'startedAt': 1762182577539,
      'endedAt': 1762182584241,
    },
  ],
  'check if user needs to import contacts and reencrypt offers': [
    {
      'startedAt': 1762182571402,
      'endedAt': 1762182571408,
    },
    {
      'startedAt': 1762182584241,
      'endedAt': 1762182584250,
    },
  ],
  'Check for clubs admission': [
    {
      'startedAt': 1762182571724,
      'endedAt': 1762182571724,
    },
    {
      'startedAt': 1762182584760,
      'endedAt': 1762182584761,
    },
  ],
  'Sync all clubs': [
    {
      'startedAt': 1762182571724,
      'endedAt': 1762182571725,
    },
    {
      'startedAt': 1762182584761,
      'endedAt': 1762182584761,
    },
  ],
  'Update and reencrypt all offers': [
    {
      'startedAt': 1762182571726,
      'endedAt': 1762182573654,
    },
    {
      'startedAt': 1762182584765,
      'endedAt': 1762182585764,
    },
  ],
  'Fetch all inboxes': [
    {
      'startedAt': 1762182577588,
      'endedAt': 1762182597874,
    },
  ],
}

Effect.runFork(
  Effect.gen(function* (_) {
    const data = Record.toEntries(json)
    for (const [key, runs] of data) {
      const totalTime = runs.map((run) => run.endedAt - run.startedAt)
      console.log(`${key}: ${totalTime.join(', ')} ms over ${runs.length} runs`)
    }
  })
)
