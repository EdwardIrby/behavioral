import {selectionStrategies, streamEvents} from './constants.js'
/** @description a function that checks whether a parameter callback function returns true or that the parameter evenName equals the request event name */
export const requestInParameter = request => parameter =>{
  const {
    strandName,
    priority,
    eventName,
    callback,
    payload,
  } = request
  return  parameter.callback
  ? parameter.callback({
    strandName,
    priority,
    eventName,
    callback,
    payload,
  })
  : request.eventName === parameter.eventName
}
  

const candidatesList = pending => pending
  .filter(({request}) => request)
  .reduce(
    (acc, {request, ...rest}) => acc.concat(
      // Flatten bids' request arrays
      request.map(
        event => ({...rest, ...event}), // create candidates for each request with current bids priority
      ),
    ),
    [],
  )
const blockedList = pending => pending
  .filter(({block}) => block)
  .flatMap(({block}) => block)

const shuffle = array => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}
const randomizedPriority = (candidateEvents, blockedEvents) => {
  const filteredEvents = candidateEvents.filter(
    request => !blockedEvents.some(requestInParameter(request)),
  )
  shuffle(filteredEvents)
  return filteredEvents.sort(
    ({priority: priorityA}, {priority: priorityB}) => priorityA - priorityB,
  )[0]
}
const chaosStrategy = (candidateEvents, blockedEvents) => {
  const randomArrayElement = arr =>
    arr[Math.floor(Math.random() * Math.floor(arr.length))]
  return randomArrayElement(
    candidateEvents.filter(
      request => !blockedEvents.some(requestInParameter(request)),
    ),
  )
}
const priorityStrategy = (candidateEvents, blockedEvents) => {
  return candidateEvents
    .filter(request => !blockedEvents.some(requestInParameter(request)))
    .sort(
      ({priority: priorityA}, {priority: priorityB}) =>
        priorityA - priorityB,
    )[0]
}
const strategies = {
  [selectionStrategies.random]: randomizedPriority,
  [selectionStrategies.priority]: priorityStrategy,
  [selectionStrategies.chaos]: chaosStrategy,
}

export const bProgram = (
  strategy = selectionStrategies.priority,
  send,
) => {
  const eventSelectionStrategy  =
    typeof strategy === 'string'
      ? strategies[strategy]
      : strategy
  const pending = new Set()
  const running = new Set()
  let lastEvent = {}
  const streamAssertion = assert => {
    const {
      strandName,
      priority,
      eventName,
      callback,
      payload,
    } = lastEvent
    send({
      streamEvent: streamEvents.assert,
      eventName: lastEvent.eventName,
      ok: assert({
        strandName,
        priority,
        eventName,
        callback,
        payload,
      }),
    })
  }
    
  function run() {
    running.size && step()
  }
  function step() {
    running.forEach(bid => {
      const {logicStrand, priority, strandName} = bid
      const {value, done} = logicStrand.next(streamAssertion)
      !done &&
        pending.add({
          strandName,
          priority,
          logicStrand,
          ...value,
        })
      running.delete(bid)
    })
    const candidates = candidatesList([...pending])
    const blocked = blockedList([...pending])
    lastEvent = eventSelectionStrategy(candidates, blocked)
    send(stateChart(candidates, blocked))
    lastEvent && nextStep()
  }
  function nextStep() {
    pending.forEach(bid => {
      const {request = [], waitFor = [], logicStrand} = bid
      const waitList = [...request, ...waitFor]
      if (waitList.some(requestInParameter(lastEvent)) && logicStrand) {
        running.add(bid)
        pending.delete(bid)
      }
    })
    const {eventName, payload} = lastEvent
    send({
      streamEvent: streamEvents.select,
      eventName,
      payload,
    })
    run()
  }
  function stateChart(candidates, blocked) {
    const strands = [...pending]
      .filter(({strandName}) => strandName)
      .map(({strandName}) => strandName)
    const Blocked = [
      ...new Set(blocked.map(({eventName}) => eventName).filter(Boolean)),
    ]
    const Requests = [
      ...new Set(
        candidates
          .map(request => ({
            eventName: request.eventName,
            payload: request.payload,
          }))
          .filter(Boolean),
      ),
    ]
    return {
      streamEvent: streamEvents.state,
      logicStrands: [...new Set(strands)],
      requestedEvents: Requests,
      blockedEvents: Blocked,
    }
  }
  const trigger = ({
    eventName, payload, baseDynamic,
  }) => {
    const logicStrand = function* () {
      yield {
        request: [{eventName, payload}],
        waitFor: [{eventName: '', callback: () => true}],
      }
    }
    running.add({
      strandName: `Trigger(${eventName})`,
      priority: 0,
      logicStrand: logicStrand(),
    })
    send({
      streamEvent: streamEvents.trigger,
      baseDynamic,
      eventName: `Trigger(${eventName})`,
      payload,
    })
    run()
  }
  return {running, trigger}
}
