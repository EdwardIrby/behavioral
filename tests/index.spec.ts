import test from 'ava'

import {
  baseDynamics,
  selectionStrategies,
  loop,
  strand,
  waitFor,
  request,
  block,
  Track,
} from '../src'
const actual: string[] = []
const expected = [
  'Add hot',
  'Add cold',
  'Add hot',
  'Add cold',
  'Add hot',
  'Add cold',
]

const addHot = () => actual.push('Add hot')
const addCold = () => actual.push('Add cold')
const strands = {
  addHot: strand(
    waitFor({
      eventName: 'start',
      callback: () => true,
    }),
    request({eventName: 'hot'}),
    request({eventName: 'hot'}),
    request({eventName: 'hot'}),
  ),
  addCold: strand(
    waitFor({eventName: 'start'}),
    request({eventName: 'cold'}),
    request({eventName: 'cold'}),
    request({eventName: 'cold'}),
  ),
  mixHotCold: loop(
    strand(
      Object.assign(
        waitFor({eventName: 'hot'}),
        block({eventName: 'cold'}),
      ),
      Object.assign(
        waitFor({eventName: 'cold'}),
        block({eventName: 'hot'}),
      ),
    ),
  ),
}
const actions = {
  cold(){
    addCold()
  },
  hot(){
    addHot()
  },
}

test('plait(): priority queue', t => {
  const streamLog: unknown[] = []
  const {trigger, feedback, stream} = new Track(strands, {debug: true})
  feedback(actions)
  stream.subscribe(msg => {
    streamLog.push(msg)
  })
  trigger({
    eventName: 'start',
    payload: ['start'],
    baseDynamic: baseDynamics.objectObject,
  })
  t.deepEqual(actual, expected)
  t.snapshot(streamLog, 'priority log snapshot')
})
test('plait(): randomized priority queue', t => {
  const streamLog: unknown[] = []
  actual.length = 0
  const {trigger, feedback, stream} = new Track(strands, {strategy: selectionStrategies.random, debug: true})
  feedback(actions)
  stream.subscribe(msg => {
    streamLog.push(msg)
  })
  trigger({
    eventName: 'start',
    payload: ['start'],
    baseDynamic: baseDynamics.objectObject,
  })
  t.deepEqual(actual, expected)
  t.snapshot(streamLog, 'randomized priority log snapshot')
})
test('plait(): chaos selection', t => {
  const streamLog: unknown[]  = []
  actual.length = 0
  const {trigger, feedback, stream} = new Track(strands, {strategy: selectionStrategies.chaos, debug: true})
  feedback(actions)
  stream.subscribe(msg => {
    streamLog.push(msg)
  })
  trigger({
    eventName: 'start',
    payload: ['start'],
    baseDynamic: baseDynamics.objectObject,
  })
  t.deepEqual(actual, expected)
  t.snapshot(streamLog, 'chaos log snapshot')
})
