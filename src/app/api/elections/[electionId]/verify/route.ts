import { NextResponse } from "next/server"
import { getElectionState, listVoteLedgerEntries } from "@/lib/election-admin-store"
import { verifyVoteToken } from "@/lib/elgamal-vote"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ electionId: string }> }
) {
  const { electionId } = await params
  const body = (await request.json()) as { token?: string }
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

  if (!body.token?.trim()) {
    return NextResponse.json(
      {
        type: "https://cryptovote.local/problems/invalid-token",
        title: "Verification token is required",
        status: 400,
        code: "INVALID_VERIFICATION_TOKEN"
      },
      { status: 400 }
    )
  }

  const ledger = await listVoteLedgerEntries(electionId)
  const result = verifyVoteToken(body.token.trim(), ledger)

  return NextResponse.json({
    ...result,
    ledgerSize: ledger.length
  })
}
