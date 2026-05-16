import { NextResponse } from "next/server"
import { getElectionState, recordElectionVote } from "@/lib/election-admin-store"
import { getElectionResults } from "@/features/voting/tally"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ electionId: string }> }
) {
  const { electionId } = await params
  const state = await getElectionState()

  if (electionId !== state.election.id) {
    return NextResponse.json(
      {
        type: "https://cryptovote.local/problems/not-found",
        title: "Election not found",
        status: 404,
        code: "ELECTION_NOT_FOUND"
      },
      { status: 404 }
    )
  }

  return NextResponse.json(getElectionResults(state.election), {
    headers: {
      "Cache-Control": "no-store"
    }
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ electionId: string }> }
) {
  const { electionId } = await params
  const body = (await request.json()) as {
    voterIdentifier?: string
    candidateId?: string
  }

  if (!body.voterIdentifier || !body.candidateId) {
    return NextResponse.json(
      {
        type: "https://cryptovote.local/problems/invalid-vote",
        title: "Voter identifier and candidate id are required",
        status: 400,
        code: "INVALID_VOTE_REQUEST"
      },
      { status: 400 }
    )
  }

  const result = await recordElectionVote({
    electionId,
    voterIdentifier: body.voterIdentifier,
    candidateId: body.candidateId
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        type: "https://cryptovote.local/problems/vote-rejected",
        title: result.message,
        status: result.status,
        code: "VOTE_REJECTED"
      },
      { status: result.status }
    )
  }

  return NextResponse.json({
    election: result.election,
    persistence: result.persistence
  })
}
