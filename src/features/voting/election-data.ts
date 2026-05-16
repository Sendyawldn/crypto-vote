import type { Election } from "./types"

export const election: Election = {
  id: "campus-2026",
  title: "",
  description: "",
  region: "",
  closesAt: "2026-05-13T17:00:00+07:00",
  status: "draft",
  totalVoters: 0,
  ballotsCast: 0,
  authorizedVoters: [],
  admins: [
    {
      id: "ADM-001",
      email: "admin@kampus.test",
      role: "admin"
    }
  ],
  candidates: []
}
