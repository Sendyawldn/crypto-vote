import { NextResponse } from "next/server"
import { getElectionState, saveElectionState } from "@/lib/election-admin-store"
import type { Candidate, Election, ElectionStatus, Voter } from "@/features/voting/types"

const adminHeader = "x-cryptovote-admin"

export async function GET() {
  const state = await getElectionState()

  return NextResponse.json(state, {
    headers: {
      "Cache-Control": "no-store"
    }
  })
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      {
        type: "https://cryptovote.local/problems/forbidden",
        title: "Admin authorization required",
        status: 403,
        code: "ADMIN_REQUIRED"
      },
      { status: 403 }
    )
  }

  const body = (await request.json()) as Partial<Election>
  const validation = validateElectionUpdate(body)

  if (!validation.valid) {
    return NextResponse.json(
      {
        type: "https://cryptovote.local/problems/invalid-election",
        title: validation.message,
        status: 400,
        code: "INVALID_ELECTION_UPDATE"
      },
      { status: 400 }
    )
  }

  const saved = await saveElectionState(validation.election)

  return NextResponse.json(saved, {
    headers: {
      "Cache-Control": "no-store"
    }
  })
}

function isAdminRequest(request: Request) {
  return request.headers.get(adminHeader) === "true"
}

function validateElectionUpdate(body: Partial<Election>):
  | { valid: true; election: Election }
  | { valid: false; message: string } {
  if (!body.id) {
    return { valid: false, message: "Election id is required" }
  }

  if (!isElectionStatus(body.status)) {
    return { valid: false, message: "Election status must be draft, open, or closed" }
  }

  if (!Array.isArray(body.candidates)) {
    return { valid: false, message: "Candidates must be an array" }
  }

  if (!Array.isArray(body.authorizedVoters)) {
    return { valid: false, message: "Voters must be an array" }
  }

  if (body.status === "open") {
    if (!body.title?.trim() || !body.description?.trim() || !body.region?.trim()) {
      return { valid: false, message: "Title, description, and region are required before opening" }
    }

    if (body.candidates.length < 2) {
      return { valid: false, message: "At least two candidates are required before opening" }
    }
  }

  const candidates = body.candidates.map(normalizeCandidate)
  const voters = body.authorizedVoters.map(normalizeVoter)

  return {
    valid: true,
    election: {
      id: body.id,
      title: body.title ?? "",
      description: body.description ?? "",
      region: body.region ?? "",
      closesAt: body.closesAt ?? new Date().toISOString(),
      status: body.status,
      totalVoters: voters.length,
      ballotsCast: voters.filter((voter) => voter.hasVoted).length,
      authorizedVoters: voters,
      admins: body.admins ?? [],
      candidates
    }
  }
}

function normalizeCandidate(candidate: Candidate): Candidate {
  return {
    id: normalizeIdentifier(candidate.id || candidate.name),
    name: candidate.name.trim(),
    party: candidate.party.trim(),
    color: candidate.color || "var(--chart-1)",
    platform: candidate.platform.trim(),
    votes: Math.max(0, Number(candidate.votes) || 0)
  }
}

function normalizeVoter(voter: Voter): Voter {
  const identifier = (voter.identifier || voter.id || voter.email).trim()

  return {
    id: normalizeIdentifier(identifier),
    email: (voter.email || `${normalizeIdentifier(identifier)}@local.voter`).trim().toLowerCase(),
    identifier,
    name: voter.name?.trim(),
    hasVoted: Boolean(voter.hasVoted),
    votedAt: voter.votedAt
  }
}

function normalizeIdentifier(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function isElectionStatus(status: unknown): status is ElectionStatus {
  return status === "draft" || status === "open" || status === "closed"
}
