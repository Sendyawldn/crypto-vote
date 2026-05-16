import { NextResponse } from "next/server"
import { getElectionState, listVoteLedgerEntries } from "@/lib/election-admin-store"
import {
  aggregateEncryptedChoices,
  decryptAggregatedVote
} from "@/lib/elgamal-vote"

const adminHeader = "x-cryptovote-admin"

export async function GET(request: Request) {
  if (request.headers.get(adminHeader) !== "true") {
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

  const state = await getElectionState()

  if (state.election.status !== "closed") {
    return NextResponse.json(
      {
        type: "https://cryptovote.local/problems/election-open",
        title: "Election must be closed before aggregation",
        status: 409,
        code: "ELECTION_NOT_CLOSED"
      },
      { status: 409 }
    )
  }

  const ledger = await listVoteLedgerEntries(state.election.id)
  const aggregates = aggregateEncryptedChoices(ledger)
  const tally = Object.fromEntries(
    state.election.candidates.map((candidate) => {
      const aggregate = aggregates.get(candidate.id)

      return [
        candidate.id,
        aggregate ? decryptAggregatedVote(aggregate, ledger.length) : 0
      ]
    })
  )

  return NextResponse.json({
    tally,
    ledgerSize: ledger.length,
    logs: [
      `Mengambil ${ledger.length} suara terenkripsi dari ledger.`,
      "Mengalikan ciphertext per kandidat dengan operasi homomorphic.",
      "Mendekripsi hasil agregat memakai private key di sisi server.",
      "Selesai. Hasil akhir siap dibaca admin."
    ]
  })
}
