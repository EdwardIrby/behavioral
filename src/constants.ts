export const enum selectionStrategies {
  chaos = 'chaos',
  random = 'randomizedPriority',
  priority = 'priority',
}

export const enum baseDynamics {
  objectObject = 'object-object',
  objectPerson = 'object-person',
  personPerson = 'person-person',
}
export const enum streamEvents {
  trigger = 'triggerEvent',
  select = 'selectEvent',
  state = 'stateSnapshot',
  assert = 'assertEvent',
}
