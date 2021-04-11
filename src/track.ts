import {selectionStrategies, streamEvents, baseDynamics} from './constants'
import {stateChart} from './stateChart'
import {requestInParameter} from './requestInParameter'
import {stream} from './stream'
import {
  ValueOf,
  CandidateBid,
  RunningBid,
  PendingBid,
  Strategy,
  SelectionStrategies,
  CreatedStream,
  ListenerMessage,
  FeedbackMessage,
  RulesFunc,
} from './types'

import {strategies} from './strategies'
import {blockedList, candidatesList} from './lists'


export class Track {
  eventSelectionStrategy:Strategy  
  pending = new Set<PendingBid>()
  running = new Set<RunningBid>()
  lastEvent:CandidateBid = {} as CandidateBid
  stream: CreatedStream
  debug?: boolean
  constructor(
    strands:  Record<string, RulesFunc>,
    {strategy = selectionStrategies.priority, debug = false}:
    { strategy?: SelectionStrategies; debug?: boolean; } = {},
  ) {
    this.eventSelectionStrategy =
    typeof strategy === 'string'
      ? strategies[strategy as ValueOf<typeof selectionStrategies>]
      : strategy as Strategy
    this.stream = stream()
    this.debug = debug
    this.trigger = this.trigger.bind(this)
    this.feedback = this.feedback.bind(this)
    this.add = this.add.bind(this)
    this.add(strands)
  }
  run(): void {
    this.running.size && this.step()
  }
  step(): void {
    for( const bid of this.running){
      const {logicStrand, priority, strandName} = bid
      const {value, done} = logicStrand.next()
      !done &&
        this.pending.add({
          strandName,
          priority,
          logicStrand,
          ...value,
        })
      this.running.delete(bid)
    }
    const pending = [...this.pending]
    const candidates = candidatesList(pending)
    const blocked = blockedList(pending)
    const filteredBids = candidates.filter(
      request => !blocked.some(requestInParameter(request)),
    )
    this.lastEvent = this.eventSelectionStrategy(filteredBids)
    this.debug && this.stream(stateChart({candidates, blocked, pending}))
    this.lastEvent && this.nextStep()
  }
  nextStep(): void {
    for( const bid of this.pending){
      const {request = [], waitFor = [], logicStrand} = bid
      const waitList = [...request, ...waitFor]
      if (waitList.some(requestInParameter(this.lastEvent)) && logicStrand) {
        this.running.add(bid)
        this.pending.delete(bid)
      }
    }
    const {eventName, payload} = this.lastEvent
    this.stream({
      streamEvent: streamEvents.select,
      eventName,
      payload,
    })
    this.run()
  }
  trigger({
    eventName, payload, baseDynamic,
  }: {
    eventName: string;
    payload?: any;
    baseDynamic?: ValueOf<typeof baseDynamics>;
  }): void{
    const logicStrand = function* () {
      yield {
        request: [{eventName, payload}],
        waitFor: [{eventName: '', callback: () => true}],
      }
    }
    this.running.add({
      strandName: `Trigger(${eventName})`,
      priority: 0,
      logicStrand: logicStrand(),
    })
    this.debug && this.stream({
      streamEvent: streamEvents.trigger,
      baseDynamic,
      eventName: `Trigger(${eventName})`,
      payload,
    })
    this.run()
  }
  feedback(actions: Record<string, (payload?: any) => void>): CreatedStream {
    return this.stream.subscribe(({streamEvent, ...rest}: ListenerMessage) => {
      if (streamEvent !== streamEvents.select) return
      const {eventName, payload} = rest as FeedbackMessage
      actions[eventName] && actions[eventName](payload)
    })
  }   
  add(logicStands: Record<string, RulesFunc>):void{
    for (const strandName in logicStands)
      this.running.add({
        strandName,
        priority: this.running.size + 1,
        logicStrand: logicStands[strandName](),
      })
  }
}
