import {CandidateBid, PendingBid, RuleParameterValue} from './types'
export const candidatesList = (pending: PendingBid[]) => pending.reduce<CandidateBid[]>(
  (acc, {request, priority}) => acc.concat(
      // Flatten bids' request arrays
      request ? request.map(
        event => ({priority, ...event}), // create candidates for each request with current bids priority
      ) : [],
  ),
  [],
)
export const blockedList = (pending: PendingBid[]) => pending.flatMap<RuleParameterValue>(({block}) => block || [])
