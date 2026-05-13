export type Candidate = {
  id: string
  name: string
  party: string
  color: string
  platform: string
  votes: number
}

export type Election = {
  id: string
  title: string
  region: string
  closesAt: string
  totalVoters: number
  ballotsCast: number
  candidates: Candidate[]
}

export type VoteReceipt = {
  candidateId: string
  encryptedBallot: string
  proofLabel: string
  createdAt: string
}

