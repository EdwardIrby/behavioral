/* eslint-disable no-console */
import {
  track,
  baseDynamics,
  loop,
  strand,
  selectionStrategies,
} from './index'

const winConditions = [
  //rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // diagonals
  [0, 4, 8],
  [2, 4, 6],
]

const squares = [0, 1, 2, 3, 4, 5, 6, 7, 8]
const squaresTaken = squares.reduce((acc: Record<string, unknown>, square) => {
  acc[`(${square}) taken`] = strand(
    {
      waitFor: [{callback: ({payload}) => square === payload}], // [{ eventName: string, callback?: function | undefined, payload?: Transferable | undefined}]
    },
    {
      block: [{callback: ({payload}) => square === payload}],
    },
  )

  return acc
}, {})

const playerWins = (player: string) =>
  winConditions.reduce((acc: Record<string, unknown>, win) => {
    acc[`${player}Wins (${win})`] = strand(
      {
        waitFor: [
          {
            callback: ({eventName, payload}) =>
              eventName === player && win.includes(payload as number),
          },
        ],
      },
      {
        waitFor: [
          {
            callback: ({eventName, payload}) =>
              eventName === player && win.includes(payload as number),
          },
        ],
      },
      {
        waitFor: [
          {
            callback: ({eventName, payload}) =>
              eventName === player && win.includes(payload as number),
          },
        ],
      },
      {
        request: [{eventName: `${player} Wins`, payload: win}],
      },
    )
    return acc
  }, {})

const enforceTurns = loop(
  strand(
    {waitFor: [{eventName: 'X'}], block: [{eventName: 'O'}]},
    {waitFor: [{eventName: 'O'}], block: [{eventName: 'X'}]},
  ),
)

const playerMove = (player: string) =>
  loop(
    strand({
      request: squares.map(move => ({eventName: player, payload: move})),
    }),
  )

const stopGame = strand(
  {
    waitFor: [
      {
        eventName: 'X Wins',
      },
      {
        eventName: 'O Wins',
      },
    ],
  },
  {block: [{eventName: 'X'}, {eventName: 'O'}]},
)

const strands = {
  stopGame,
  ...squaresTaken,
  enforceTurns,
  ...playerWins('X'),
  ...playerWins('O'),
}

const xStrands = {
  ...strands,
  xMoves: playerMove('X'),
}

const oStrands = {
  ...strands,
  oMoves: playerMove('O'),
}

const {trigger: xTrigger, feedback: xFeedback} = track(xStrands, {
  strategy: selectionStrategies.random,
  track: 'playerX',
})

const {trigger: oTrigger, feedback: oFeedback} = track(oStrands, {
  strategy: selectionStrategies.random,
  track: 'playerO',
})

xFeedback.subscribe(msg => {
  if (msg.eventName === 'X') {
    console.log(msg)
    oTrigger({
      eventName: msg.eventName,
      payload: msg.payload,
      baseDynamic: baseDynamics.objectObject,
    })
  }
  if (msg.eventName === 'X Wins') console.log(msg)
})

oFeedback.subscribe(msg => {
  if (msg.eventName === 'O') {
    console.log(msg)
    xTrigger({
      eventName: msg.eventName,
      payload: msg.payload,
      baseDynamic: baseDynamics.objectObject,
    })
  }
  if (msg.eventName === 'O Wins') console.log(msg)
})

xTrigger({eventName: 'start', baseDynamic: baseDynamics.objectObject})
