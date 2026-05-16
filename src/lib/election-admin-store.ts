import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { MongoClient, type Collection } from "mongodb"
import { election as seedElection } from "@/features/voting/election-data"
import type { Election } from "@/features/voting/types"

type ElectionDocument = Election & {
  _id: string
  updatedAt: string
}

let cachedClient: MongoClient | null = null
const localStatePath = path.join(process.cwd(), ".data", "election-state.json")

type ElectionStateFile = {
  election: Election
  history: Election[]
}

export async function getElectionState() {
  const collection = await getElectionCollection()
  const historyCollection = await getElectionHistoryCollection()

  if (!collection || !historyCollection) {
    const fileState = await readLocalElectionState()

    return {
      election: fileState.election,
      history: fileState.history,
      persistence: "local-file" as const
    }
  }

  const existing = await collection.findOne({ _id: seedElection.id })
  const history = (await historyCollection
    .find({})
    .sort({ updatedAt: -1 })
    .toArray()).map(stripMongoFields)

  if (existing) {
    return {
      election: stripMongoFields(existing),
      history,
      persistence: "mongodb" as const
    }
  }

  await collection.insertOne({
    ...seedElection,
    _id: seedElection.id,
    updatedAt: new Date().toISOString()
  })

  return {
    election: seedElection,
    history,
    persistence: "mongodb" as const
  }
}

export async function saveElectionState(nextElection: Election) {
  const collection = await getElectionCollection()
  const historyCollection = await getElectionHistoryCollection()

  if (!collection || !historyCollection) {
    const fileState = await readLocalElectionState()
    const nextState = {
      election: nextElection,
      history: fileState.history
    }
    await writeLocalElectionState(nextState)

    return {
      election: nextState.election,
      history: nextState.history,
      persistence: "local-file" as const
    }
  }

  await collection.updateOne(
    { _id: nextElection.id },
    {
      $set: {
        ...nextElection,
        updatedAt: new Date().toISOString()
      }
    },
    { upsert: true }
  )
  const history = (await historyCollection
    .find({})
    .sort({ updatedAt: -1 })
    .toArray()).map(stripMongoFields)

  return {
    election: nextElection,
    history,
    persistence: "mongodb" as const
  }
}

export async function archiveElectionState(electionToArchive: Election) {
  const collection = await getElectionCollection()
  const historyCollection = await getElectionHistoryCollection()
  const archivedElection = {
    ...electionToArchive,
    id: `${electionToArchive.id}-${Date.now()}`
  }

  if (!collection || !historyCollection) {
    const fileState = await readLocalElectionState()
    const nextState = {
      election: cloneElection(seedElection),
      history: [archivedElection, ...fileState.history]
    }
    await writeLocalElectionState(nextState)

    return {
      election: nextState.election,
      history: nextState.history,
      persistence: "local-file" as const
    }
  }

  await historyCollection.insertOne({
    ...archivedElection,
    _id: archivedElection.id,
    updatedAt: new Date().toISOString()
  })
  await collection.updateOne(
    { _id: seedElection.id },
    {
      $set: {
        ...seedElection,
        updatedAt: new Date().toISOString()
      }
    },
    { upsert: true }
  )

  const history = (await historyCollection
    .find({})
    .sort({ updatedAt: -1 })
    .toArray()).map(stripMongoFields)

  return {
    election: seedElection,
    history,
    persistence: "mongodb" as const
  }
}

export async function recordElectionVote({
  electionId,
  voterIdentifier,
  candidateId
}: {
  electionId: string
  voterIdentifier: string
  candidateId: string
}) {
  const state = await getElectionState()
  const currentElection = state.election

  if (currentElection.id !== electionId) {
    return { ok: false as const, message: "Election not found", status: 404 }
  }

  if (currentElection.status !== "open") {
    return { ok: false as const, message: "Election is not open", status: 409 }
  }

  const normalizedIdentifier = voterIdentifier.trim().toLowerCase()
  const voter = currentElection.authorizedVoters.find((candidateVoter) =>
    [candidateVoter.identifier, candidateVoter.id, candidateVoter.email]
      .filter(Boolean)
      .some((value) => value.toLowerCase() === normalizedIdentifier)
  )

  if (!voter) {
    return { ok: false as const, message: "Voter is not in DPT", status: 403 }
  }

  if (voter.hasVoted) {
    return { ok: false as const, message: "Voter has already voted", status: 409 }
  }

  const candidateExists = currentElection.candidates.some((candidate) => candidate.id === candidateId)

  if (!candidateExists) {
    return { ok: false as const, message: "Candidate not found", status: 404 }
  }

  const votedAt = new Date().toISOString()
  const nextElection: Election = {
    ...currentElection,
    ballotsCast: currentElection.ballotsCast + 1,
    candidates: currentElection.candidates.map((candidate) =>
      candidate.id === candidateId
        ? { ...candidate, votes: candidate.votes + 1 }
        : candidate
    ),
    authorizedVoters: currentElection.authorizedVoters.map((candidateVoter) =>
      candidateVoter.id === voter.id
        ? { ...candidateVoter, hasVoted: true, votedAt }
        : candidateVoter
    )
  }
  const saved = await saveElectionState(nextElection)

  return {
    ok: true as const,
    election: saved.election,
    persistence: saved.persistence
  }
}

async function getElectionCollection(): Promise<Collection<ElectionDocument> | null> {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    return null
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(uri)
    await cachedClient.connect()
  }

  return cachedClient
    .db(process.env.MONGODB_DB ?? "cryptovote")
    .collection<ElectionDocument>("elections")
}

async function getElectionHistoryCollection(): Promise<Collection<ElectionDocument> | null> {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    return null
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(uri)
    await cachedClient.connect()
  }

  return cachedClient
    .db(process.env.MONGODB_DB ?? "cryptovote")
    .collection<ElectionDocument>("election_history")
}

function stripMongoFields(document: ElectionDocument): Election {
  const election = { ...document }
  delete (election as Partial<ElectionDocument>)._id
  delete (election as Partial<ElectionDocument>).updatedAt

  return election
}

async function readLocalElectionState(): Promise<ElectionStateFile> {
  try {
    const content = await readFile(localStatePath, "utf8")
    const state = JSON.parse(content) as Partial<ElectionStateFile>

    return {
      election: state.election ?? cloneElection(seedElection),
      history: state.history ?? []
    }
  } catch {
    const initialState = {
      election: cloneElection(seedElection),
      history: []
    }
    await writeLocalElectionState(initialState)

    return initialState
  }
}

async function writeLocalElectionState(state: ElectionStateFile) {
  await mkdir(path.dirname(localStatePath), { recursive: true })
  await writeFile(localStatePath, `${JSON.stringify(state, null, 2)}\n`, "utf8")
}

function cloneElection(election: Election): Election {
  return JSON.parse(JSON.stringify(election)) as Election
}
