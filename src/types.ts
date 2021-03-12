import {streamEvents, selectionStrategies, baseDynamics} from './constants'

export type ValueOf<T> = T[keyof T]

export type CallbackArgs<T> = { eventName?: string, payload?: T}
export type Callback = (args: CallbackArgs<any>) => boolean;
export interface RuleParameterValue {
  eventName?: string
  payload?: unknown
  callback?: Callback
}

export interface IdiomSet {
  waitFor?: RuleParameterValue[]
  request?: RuleParameterValue[]
  block?: RuleParameterValue[]
}

export type ListenerMessage = {
  streamEvent: ValueOf<typeof streamEvents>
  eventName?: string
  [key: string]: unknown
}
export type Listener = (msg: ListenerMessage) => ListenerMessage | void
export interface CreatedStream {
  (value: ListenerMessage): void
  subscribe: (listener: Listener) => CreatedStream
}
export type Trigger =
  (args: {
    eventName?: string;
    payload?: unknown;
    baseDynamic?: ValueOf<typeof baseDynamics>;
  }) =>void

export type RuleGenerator =  Generator<IdiomSet, void, unknown>
export type RulesFunc = () => RuleGenerator

export type FeedbackMessage = {eventName?: string, payload?: unknown}

export type RunningBid = {
  strandName: string
  priority: number
  logicStrand: RuleGenerator
}
export type PendingBid = IdiomSet & RunningBid

export type CandidateBid =  RunningBid & RuleParameterValue & Omit<IdiomSet, 'request'>

export type Strategy = ((candidateEvents: CandidateBid[], blockedEvents: RuleParameterValue[]) => CandidateBid)
export type SelectionStrategies = ValueOf<typeof selectionStrategies> | Strategy

export interface Track {
  (strand: Record<string, RulesFunc>, options?: {strategy: SelectionStrategies, debug?: boolean}):  {
    trigger:Trigger
    feedback: (actions: Record<string, (obj: FeedbackMessage) => void
    >) => CreatedStream
    stream: CreatedStream;
    add: (logicStands: Record<string, RulesFunc>) => void;
  }
}
export interface BProgram {
  (
    props: {strategy?: SelectionStrategies,
    stream: CreatedStream,
    debug?: boolean}
  ):{
    running: Set<RunningBid>;
    trigger: Trigger
  } 
} 

// stateChart.ts 
export interface StateChart {
  (props: {candidates: CandidateBid[], blocked: RuleParameterValue[], pending: Set<PendingBid>}): {
    streamEvent: 'stateSnapshot';
    logicStrands: string[];
    requestedEvents: {
        eventName: string | undefined;
        payload: unknown;
    }[];
    blockedEvents: (string | undefined)[];
  }
}
