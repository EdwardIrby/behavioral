import {
  ValueOf,
  CandidateBid,
  Strategy,
} from './types'
import {selectionStrategies} from './constants'
const shuffle = (array: unknown[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}
const randomizedPriority = (filteredEvents: CandidateBid[]) => {
  shuffle(filteredEvents)
  return filteredEvents.sort(
    ({priority: priorityA}, {priority: priorityB}) => priorityA - priorityB,
  )[0]
}
const chaosStrategy = (filteredEvents: CandidateBid[]) => {
  const randomArrayElement = (arr: CandidateBid[]) =>
    arr[Math.floor(Math.random() * Math.floor(arr.length))]
  return randomArrayElement(filteredEvents)
}
const priorityStrategy = (filteredEvents: CandidateBid[]) => {
  return filteredEvents.sort(
    ({priority: priorityA}, {priority: priorityB}) =>
      priorityA - priorityB,
  )[0]
}
export const strategies: Record<ValueOf<typeof selectionStrategies>, Strategy> = {
  [selectionStrategies.random]: randomizedPriority,
  [selectionStrategies.priority]: priorityStrategy,
  [selectionStrategies.chaos]: chaosStrategy,
}
