import type { Election, VoteReceipt } from "./types"

export function getTurnoutPercentage(ballotsCast: number, totalVoters: number) {
  if (totalVoters <= 0) {
    return 0
  }

  return Math.round((ballotsCast / totalVoters) * 100)
}

export function getCandidatePercent(votes: number, ballotsCast: number) {
  if (ballotsCast <= 0) {
    return 0
  }

  return Number(((votes / ballotsCast) * 100).toFixed(1))
}

export function getElectionResults(election: Election) {
  return {
    electionId: election.id,
    title: election.title,
    totalVoters: election.totalVoters,
    ballotsCast: election.ballotsCast,
    turnoutPercentage: getTurnoutPercentage(election.ballotsCast, election.totalVoters),
    verificationStatus: "modeled-proof",
    candidates: election.candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      party: candidate.party,
      votes: candidate.votes,
      percent: getCandidatePercent(candidate.votes, election.ballotsCast)
    }))
  }
}

export function createReceipt(candidateId: string, timestamp = new Date()): VoteReceipt {
  const stamp = timestamp.toISOString()
  const compact = `${candidateId}:${stamp}`
  const encoded = btoa(compact)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "")
    .slice(0, 28)
    .toUpperCase()

  return {
    candidateId,
    encryptedBallot: `EG-${encoded}`,
    proofLabel: "Homomorphic tally model",
    createdAt: stamp
  }
}

export function applyLocalVote(election: Election, candidateId: string): Election {
  return {
    ...election,
    ballotsCast: election.ballotsCast + 1,
    candidates: election.candidates.map((candidate) =>
      candidate.id === candidateId
        ? { ...candidate, votes: candidate.votes + 1 }
        : candidate
    )
  }
}
