import { NextResponse } from "next/server"
import { election } from "@/features/voting/election-data"
import { getElectionResults } from "@/features/voting/tally"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ electionId: string }> }
) {
  const { electionId } = await params

  if (electionId !== election.id) {
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

  return NextResponse.json(getElectionResults(election), {
    headers: {
      "Cache-Control": "no-store"
    }
  })
}
