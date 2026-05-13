import { MongoClient, type Collection } from "mongodb"
import { election as seedElection } from "@/features/voting/election-data"
import type { Election } from "@/features/voting/types"

type ElectionDocument = Election & {
  _id: string
  updatedAt: string
}

let memoryElection: Election = seedElection
let cachedClient: MongoClient | null = null

export async function getElectionState() {
  const collection = await getElectionCollection()

  if (!collection) {
    return {
      election: memoryElection,
      persistence: "memory" as const
    }
  }

  const existing = await collection.findOne({ _id: seedElection.id })

  if (existing) {
    return {
      election: stripMongoFields(existing),
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
    persistence: "mongodb" as const
  }
}

export async function saveElectionState(nextElection: Election) {
  const collection = await getElectionCollection()

  if (!collection) {
    memoryElection = nextElection
    return {
      election: memoryElection,
      persistence: "memory" as const
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

  return {
    election: nextElection,
    persistence: "mongodb" as const
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

function stripMongoFields(document: ElectionDocument): Election {
  const election = { ...document }
  delete (election as Partial<ElectionDocument>)._id
  delete (election as Partial<ElectionDocument>).updatedAt

  return election
}
