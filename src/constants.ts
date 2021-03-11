export const selectionStrategies = {
  chaos: 'chaos',
  random: 'randomizedPriority',
  priority: 'priority',
} as const

export const baseDynamics = {
  objectObject: 'object-object',
  objectPerson: 'object-person',
  personPerson: 'person-person',
} as const

export const streamEvents = {
  trigger: 'triggerEvent',
  select: 'selectEvent',
  state: 'stateSnapshot',
  assert: 'assertEvent',
} as const

export const idioms = {
  waitFor:'waitFor',
  request: 'request',
  block: 'block',
} as const
