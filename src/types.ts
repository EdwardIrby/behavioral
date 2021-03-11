import {streamEvents, selectionStrategies, baseDynamics} from './constants'

// util
export type ValueOf<T> = T[keyof T]

// rules.ts
export interface Callback {
  <P>(payload:P): boolean;
}
export interface RuleParameterValue {
  eventName: string
  payload?: unknown
  callback?: Callback
}

export interface IdiomSet {
  waitFor?: RuleParameterValue[]
  request?: RuleParameterValue[]
  block?: RuleParameterValue[]
}

// stream.ts
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


// track.ts
export type RuleGenerator =  Generator<IdiomSet, void, unknown>
export type RulesFunc = () => RuleGenerator
export interface TrackReturn {
  trigger: <T>({eventName, payload, baseDynamic}: {
      eventName: string;
      payload?: T | undefined;
      baseDynamic: ValueOf<typeof baseDynamics>;
  }) => void;
  feedback: (actions: Record<string, (payload: unknown) => void
  >) => CreatedStream
  stream: CreatedStream;
  add: (logicStands: Record<string, RulesFunc>) => void;
}

// bProgram.ts
export type RunningBid = {
  strandName: string
  priority: number
  logicStrand: RuleGenerator
}
export type PendingBid = IdiomSet & RunningBid

export type CandidateBid =  RunningBid & RuleParameterValue & Omit<IdiomSet, 'request'>

export type Strategy = ((candidateEvents: CandidateBid[], blockedEvents: RuleParameterValue[]) => CandidateBid)
export type SelectionStrategies = ValueOf<typeof selectionStrategies> | Strategy
