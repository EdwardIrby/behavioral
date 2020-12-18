interface SelectionStrategies {
  chaos: 'chaos'
  random: 'randomizedPriority'
  priority: 'priority'
}
export const selectionStrategies: SelectionStrategies = {
  chaos: 'chaos',
  random: 'randomizedPriority',
  priority: 'priority',
}
export interface BaseDynamics {
  objectObject:'object-object'
  objectPerson:'object-person'
  personPerson:'person-person'
}
export const baseDynamics: BaseDynamics = {
  objectObject: 'object-object',
  objectPerson: 'object-person',
  personPerson: 'person-person',
}

interface StreamEvents {
  trigger: 'triggerEvent'
  select: 'selectEvent'
  state: 'stateSnapshot'
  assert: 'assertEvent'
}
export const streamEvents: StreamEvents = {
  trigger: 'triggerEvent',
  select: 'selectEvent',
  state: 'stateSnapshot',
  assert: 'assertEvent',
}
