import {CandidateBid} from './types'
const shuffle = (array: unknown[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

/** @description Randomized Priority Queue Selection Strategy */
export const randomizedStrategy = (filteredEvents: CandidateBid[]) => {
  shuffle(filteredEvents)
  return filteredEvents.sort(
    ({priority: priorityA}, {priority: priorityB}) => priorityA - priorityB,
  )[0]
}
/** @description Chaos Selection Strategy */
export const chaosStrategy = (filteredEvents: CandidateBid[]) => {
  const randomArrayElement = (arr: CandidateBid[]) =>
    arr[Math.floor(Math.random() * Math.floor(arr.length))]
  return randomArrayElement(filteredEvents)
}
/** @description Priority Queue Selection Strategy */
export const priorityStrategy = (filteredEvents: CandidateBid[]) => {
  return filteredEvents.sort(
    ({priority: priorityA}, {priority: priorityB}) =>
      priorityA - priorityB,
  )[0]
}
