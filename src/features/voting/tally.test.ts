import { describe, expect, it } from "vitest"
import {
  decrypt,
  decodeSmallExponent,
  encryptExponentVote,
  generateKeyPair,
  multiplyCiphertexts
} from "../../lib/elgamal"
import {
  aggregateEncryptedChoices,
  createEncryptedVoteReceipt,
  createLedgerEntry,
  decryptAggregatedVote,
  verifyVoteToken
} from "../../lib/elgamal-vote"
import type { Election } from "./types"
import {
  applyLocalVote,
  createReceipt,
  getCandidatePercent,
  getTurnoutPercentage
} from "./tally"

const testElection: Election = {
  id: "test-election",
  title: "Test Election",
  description: "Test election",
  region: "Test Region",
  closesAt: "2026-05-13T17:00:00+07:00",
  status: "open",
  totalVoters: 2,
  ballotsCast: 0,
  authorizedVoters: [],
  admins: [],
  candidates: [
    {
      id: "naya",
      name: "Naya Putri",
      party: "Civic Ledger",
      color: "var(--chart-1)",
      platform: "Transparansi anggaran.",
      votes: 0
    },
    {
      id: "reza",
      name: "Reza Mahendra",
      party: "Open Campus",
      color: "var(--chart-2)",
      platform: "Akses kegiatan.",
      votes: 0
    }
  ]
}

describe("voting tally", () => {
  it("calculates turnout and candidate percentages", () => {
    expect(getTurnoutPercentage(874, 1280)).toBe(68)
    expect(getCandidatePercent(342, 874)).toBe(39.1)
    expect(getCandidatePercent(10, 0)).toBe(0)
  })

  it("applies one local vote without mutating the source election", () => {
    const updated = applyLocalVote(testElection, "naya")

    expect(updated.ballotsCast).toBe(testElection.ballotsCast + 1)
    expect(updated.candidates.find((candidate) => candidate.id === "naya")?.votes).toBe(1)
    expect(testElection.candidates.find((candidate) => candidate.id === "naya")?.votes).toBe(0)
  })

  it("creates a deterministic receipt prefix", () => {
    const receipt = createReceipt(
      "naya",
      testElection.candidates.map((candidate) => candidate.id),
      new Date("2026-05-13T09:00:00.000Z")
    )

    expect(receipt.encryptedBallot).toMatch(/^EG-/)
    expect(receipt.verificationToken).toMatch(/^EGV1\./)
    expect(receipt.candidateId).toBe("naya")
  })

  it("encrypts, decrypts, and homomorphically multiplies El Gamal votes", () => {
    const privateKey = generateKeyPair(undefined, 7n)
    const publicKey = privateKey.publicKey
    const encryptedOne = encryptExponentVote(1, publicKey, 11n)
    const encryptedZero = encryptExponentVote(0, publicKey, 13n)
    const aggregate = multiplyCiphertexts(encryptedOne, encryptedZero, publicKey)
    const decrypted = decrypt(aggregate, privateKey)

    expect(decodeSmallExponent(decrypted, publicKey, 2)).toBe(1)
  })

  it("verifies a vote token through the ledger without exposing the selected candidate", () => {
    const candidateIds = testElection.candidates.map((candidate) => candidate.id)
    const encryptedReceipt = createEncryptedVoteReceipt({
      candidateIds,
      selectedCandidateId: "reza",
      timestamp: new Date("2026-05-13T09:00:00.000Z")
    })
    const ledger = [createLedgerEntry(encryptedReceipt, "reza")]
    const verification = verifyVoteToken(encryptedReceipt.token, ledger)

    expect(verification.status).toBe("verified")
    expect(encryptedReceipt.token.includes("reza")).toBe(false)
  })

  it("aggregates encrypted vote vectors by candidate", () => {
    const candidateIds = testElection.candidates.map((candidate) => candidate.id)
    const firstReceipt = createEncryptedVoteReceipt({
      candidateIds,
      selectedCandidateId: "naya",
      timestamp: new Date("2026-05-13T09:00:00.000Z")
    })
    const secondReceipt = createEncryptedVoteReceipt({
      candidateIds,
      selectedCandidateId: "naya",
      timestamp: new Date("2026-05-13T09:01:00.000Z")
    })
    const aggregates = aggregateEncryptedChoices([
      createLedgerEntry(firstReceipt, "naya"),
      createLedgerEntry(secondReceipt, "naya")
    ])
    const nayaAggregate = aggregates.get("naya")

    expect(nayaAggregate ? decryptAggregatedVote(nayaAggregate, 2) : 0).toBe(2)
  })
})
