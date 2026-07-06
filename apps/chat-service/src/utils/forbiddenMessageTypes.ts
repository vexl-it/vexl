export const forbiddenMessageTypes = [
  'REQUEST_MESSAGING',
  'APPROVE_MESSAGING',
  'DISAPPROVE_MESSAGING',
  'CANCEL_REQUEST_MESSAGING',
  // Local-only client message - must never reach the server or the other side
  'INACTIVITY_REMINDER',
]
