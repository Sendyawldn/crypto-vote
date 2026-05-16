import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { MongoClient, type Collection } from "mongodb"
import { election as seedElection } from "@/features/voting/election-data"
import type { Election } from "@/features/voting/types"
import type { VoteLedgerEntry } from "@/lib/elgamal-vote"

type ElectionDocument = Election & {
  _id: string
  updatedAt: string
}

export type StoredVoteLedgerEntry = VoteLedgerEntry & {
  electionId: string
  voterIdentifier: string
  updatedAt: string
}

type VoteLedgerDocument = StoredVoteLedgerEntry & {
  _id: string
}

let cachedClient: MongoClient | null = null
let mongoUnavailable = false
let lastMongoFailureAt = 0
const localStatePath = path.join(process.cwd(), ".data", "election-state.json")
const localLedgerPath = path.join(process.cwd(), ".data", "vote-ledger.json")
const mongoRetryDelayMs = 5_000

type ElectionStateFile = {
  election: Election
  history: Election[]
}

type VoteLedgerFile = {
  entries: StoredVoteLedgerEntry[]
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
  await archiveVoteLedgerEntries(electionToArchive.id, archivedElection.id)

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
  candidateId,
  ledgerEntry
}: {
  electionId: string
  voterIdentifier: string
  candidateId: string
  ledgerEntry: VoteLedgerEntry
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

  const electionCandidateIds = currentElection.candidates
    .map((candidate) => candidate.id)
    .sort()
  const receiptCandidateIds = ledgerEntry.encryptedChoices
    .map((choice) => choice.candidateId)
    .sort()

  if (JSON.stringify(electionCandidateIds) !== JSON.stringify(receiptCandidateIds)) {
    return { ok: false as const, message: "Receipt candidate vector does not match election", status: 400 }
  }

  const votedAt = new Date().toISOString()
  const storedLedgerEntry: StoredVoteLedgerEntry = {
    ...ledgerEntry,
    electionId: currentElection.id,
    voterIdentifier: normalizedIdentifier,
    updatedAt: votedAt
  }

  try {
    await appendVoteLedgerEntry(storedLedgerEntry)
  } catch {
    return { ok: false as const, message: "Receipt is already recorded", status: 409 }
  }

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
    persistence: saved.persistence,
    ledgerSize: await countVoteLedgerEntries(saved.election.id)
  }
}

export async function listVoteLedgerEntries(electionId: string): Promise<VoteLedgerEntry[]> {
  const collection = await getVoteLedgerCollection()

  if (!collection) {
    const fileState = await readLocalVoteLedger()

    return fileState.entries
      .filter((entry) => entry.electionId === electionId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map(stripLedgerMetadata)
  }

  const entries = await collection
    .find({ electionId })
    .sort({ createdAt: 1 })
    .toArray()

  return entries.map(stripVoteLedgerFields)
}

export async function countVoteLedgerEntries(electionId: string) {
  const collection = await getVoteLedgerCollection()

  if (!collection) {
    const fileState = await readLocalVoteLedger()

    return fileState.entries.filter((entry) => entry.electionId === electionId).length
  }

  return collection.countDocuments({ electionId })
}

async function appendVoteLedgerEntry(entry: StoredVoteLedgerEntry) {
  const collection = await getVoteLedgerCollection()

  if (!collection) {
    const fileState = await readLocalVoteLedger()
    const alreadyExists = fileState.entries.some(
      (ledgerEntry) =>
        ledgerEntry.electionId === entry.electionId &&
        ledgerEntry.receiptHash === entry.receiptHash
    )

    if (alreadyExists) {
      throw new Error("Duplicate receipt")
    }

    await writeLocalVoteLedger({
      entries: [...fileState.entries, entry]
    })
    return
  }

  await collection.insertOne({
    ...entry,
    _id: createLedgerDocumentId(entry.electionId, entry.receiptHash)
  })
}

async function getElectionCollection(): Promise<Collection<ElectionDocument> | null> {
  const database = await getMongoDatabase()

  return database?.collection<ElectionDocument>("elections") ?? null
}

async function getElectionHistoryCollection(): Promise<Collection<ElectionDocument> | null> {
  const database = await getMongoDatabase()

  return database?.collection<ElectionDocument>("election_history") ?? null
}

async function getVoteLedgerCollection(): Promise<Collection<VoteLedgerDocument> | null> {
  const database = await getMongoDatabase()

  return database?.collection<VoteLedgerDocument>("vote_ledger") ?? null
}

async function getMongoDatabase() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    return null
  }

  if (mongoUnavailable && Date.now() - lastMongoFailureAt < mongoRetryDelayMs) {
    return null
  }

  try {
    if (!cachedClient) {
      mongoUnavailable = false
      cachedClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 1200
      })
      await cachedClient.connect()
    }

    return cachedClient.db(process.env.MONGODB_DB ?? "cryptovote")
  } catch {
    cachedClient = null
    mongoUnavailable = true
    lastMongoFailureAt = Date.now()
    return null
  }
}

function stripMongoFields(document: ElectionDocument): Election {
  const election = { ...document }
  delete (election as Partial<ElectionDocument>)._id
  delete (election as Partial<ElectionDocument>).updatedAt

  return election
}

function stripVoteLedgerFields(document: VoteLedgerDocument): VoteLedgerEntry {
  return stripLedgerMetadata(document)
}

function stripLedgerMetadata(entry: StoredVoteLedgerEntry): VoteLedgerEntry {
  return {
    receiptHash: entry.receiptHash,
    token: entry.token,
    createdAt: entry.createdAt,
    candidateId: entry.candidateId,
    voterName: entry.voterName,
    encryptedChoices: entry.encryptedChoices
  }
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

async function readLocalVoteLedger(): Promise<VoteLedgerFile> {
  try {
    const content = await readFile(localLedgerPath, "utf8")
    const state = JSON.parse(content) as Partial<VoteLedgerFile>

    return {
      entries: state.entries ?? []
    }
  } catch {
    const initialState = { entries: [] }
    await writeLocalVoteLedger(initialState)

    return initialState
  }
}

async function writeLocalVoteLedger(state: VoteLedgerFile) {
  await mkdir(path.dirname(localLedgerPath), { recursive: true })
  await writeFile(localLedgerPath, `${JSON.stringify(state, null, 2)}\n`, "utf8")
}

async function archiveVoteLedgerEntries(electionId: string, archivedElectionId: string) {
  const collection = await getVoteLedgerCollection()

  if (!collection) {
    const fileState = await readLocalVoteLedger()

    await writeLocalVoteLedger({
      entries: fileState.entries.map((entry) =>
        entry.electionId === electionId
          ? { ...entry, electionId: archivedElectionId, updatedAt: new Date().toISOString() }
          : entry
      )
    })
    return
  }

  await collection.updateMany(
    { electionId },
    {
      $set: {
        electionId: archivedElectionId,
        updatedAt: new Date().toISOString()
      }
    }
  )
}

function createLedgerDocumentId(electionId: string, receiptHash: string) {
  return `${electionId}:${receiptHash}`
}

function cloneElection(election: Election): Election {
  return JSON.parse(JSON.stringify(election)) as Election
}
