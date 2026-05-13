import type { Election } from "./types"

export const election: Election = {
  id: "campus-2026",
  title: "Pemilihan Senat Kampus 2026",
  description: "Pemilihan senat berbasis El Gamal untuk demonstrasi e-voting terverifikasi.",
  region: "Universitas Merdeka",
  closesAt: "2026-05-13T17:00:00+07:00",
  status: "draft",
  totalVoters: 4,
  ballotsCast: 0,
  authorizedVoters: [
    {
      id: "VTR-001",
      email: "andi@kampus.test",
      hasVoted: false
    },
    {
      id: "VTR-002",
      email: "sinta@kampus.test",
      hasVoted: false
    },
    {
      id: "VTR-003",
      email: "bagus@kampus.test",
      hasVoted: false
    },
    {
      id: "VTR-004",
      email: "maya@kampus.test",
      hasVoted: false
    }
  ],
  admins: [
    {
      id: "ADM-001",
      email: "admin@kampus.test",
      role: "admin"
    }
  ],
  candidates: [
    {
      id: "naya",
      name: "Naya Putri",
      party: "Civic Ledger",
      color: "var(--chart-1)",
      platform: "Transparansi anggaran dan kanal aspirasi terbuka.",
      votes: 0
    },
    {
      id: "reza",
      name: "Reza Mahendra",
      party: "Open Campus",
      color: "var(--chart-2)",
      platform: "Akses kegiatan lintas fakultas dan beasiswa mikro.",
      votes: 0
    },
    {
      id: "saira",
      name: "Saira Adelia",
      party: "Forum Riset",
      color: "var(--chart-3)",
      platform: "Pendanaan riset mahasiswa dan klinik proposal.",
      votes: 0
    },
    {
      id: "bima",
      name: "Bima Arkan",
      party: "Ruang Publik",
      color: "var(--chart-4)",
      platform: "Perbaikan ruang belajar dan jam layanan malam.",
      votes: 0
    }
  ]
}
