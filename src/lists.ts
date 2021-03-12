import {CandidateBid, PendingBid, RuleParameterValue} from './types'
export const candidatesList = (pending: PendingBid[]) => pending.reduce<CandidateBid[]>(
  (acc, {request, ...rest}) => acc.concat(
      // Flatten bids' request arrays
      request ? request.map(
        event => ({...rest, ...event}), // create candidates for each request with current bids priority
      ) : [],
  ),
  [],
)
export const blockedList = (pending: PendingBid[]) => pending.reduce<RuleParameterValue[]>(
  (acc, {block}) => acc.concat(
      // Flatten bids' block arrays
      block ? block.map(
        event => event, // create candidates for each block with current bids priority
      ) : [],
  ),
  [],
)
