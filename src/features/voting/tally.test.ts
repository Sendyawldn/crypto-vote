import { describe, expect, it } from "vitest"
import { election } from "./election-data"
import {
  applyLocalVote,
  createReceipt,
  getCandidatePercent,
  getTurnoutPercentage
} from "./tally"

describe("voting tally", () => {
  it("calculates turnout and candidate percentages", () => {
    expect(getTurnoutPercentage(874, 1280)).toBe(68)
    expect(getCandidatePercent(342, 874)).toBe(39.1)
    expect(getCandidatePercent(10, 0)).toBe(0)
  })

  it("applies one local vote without mutating the source election", () => {
    const updated = applyLocalVote(election, "naya")

    expect(updated.ballotsCast).toBe(election.ballotsCast + 1)
    expect(updated.candidates.find((candidate) => candidate.id === "naya")?.votes).toBe(343)
    expect(election.candidates.find((candidate) => candidate.id === "naya")?.votes).toBe(342)
  })

  it("creates a deterministic receipt prefix", () => {
    const receipt = createReceipt("naya", new Date("2026-05-13T09:00:00.000Z"))

    expect(receipt.encryptedBallot).toMatch(/^EG-/)
    expect(receipt.candidateId).toBe("naya")
  })
})

