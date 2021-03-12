import {
  ValueOf,
  CandidateBid,
  Strategy,
  RuleParameterValue,
} from './types'
import {selectionStrategies} from './constants'
import {requestInParameter} from './requestInParameter'
const shuffle = (array: unknown[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}
const randomizedPriority = (candidateEvents: CandidateBid[], blockedEvents: RuleParameterValue[]) => {
  const filteredEvents = candidateEvents.filter(
    request => !blockedEvents.some(requestInParameter(request)),
  )
  shuffle(filteredEvents)
  return filteredEvents.sort(
    ({priority: priorityA}, {priority: priorityB}) => priorityA - priorityB,
  )[0]
}
const chaosStrategy = (candidateEvents: CandidateBid[], blockedEvents: RuleParameterValue[]) => {
  const randomArrayElement = (arr: CandidateBid[]) =>
    arr[Math.floor(Math.random() * Math.floor(arr.length))]
  return randomArrayElement(
    candidateEvents.filter(
      request => !blockedEvents.some(requestInParameter(request)),
    ),
  )
}
const priorityStrategy = (candidateEvents: CandidateBid[], blockedEvents: RuleParameterValue[]) => {
  return candidateEvents
    .filter(request => !blockedEvents.some(requestInParameter(request)))
    .sort(
      ({priority: priorityA}, {priority: priorityB}) =>
        priorityA - priorityB,
    )[0]
}
export const strategies: Record<ValueOf<typeof selectionStrategies>, Strategy> = {
  [selectionStrategies.random]: randomizedPriority,
  [selectionStrategies.priority]: priorityStrategy,
  [selectionStrategies.chaos]: chaosStrategy,
}
