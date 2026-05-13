import type { Election } from "./types"

export const election: Election = {
  id: "campus-2026",
  title: "Pemilihan Senat Kampus 2026",
  region: "Universitas Merdeka",
  closesAt: "2026-05-13T17:00:00+07:00",
  totalVoters: 1280,
  ballotsCast: 874,
  candidates: [
    {
      id: "naya",
      name: "Naya Putri",
      party: "Civic Ledger",
      color: "var(--chart-1)",
      platform: "Transparansi anggaran dan kanal aspirasi terbuka.",
      votes: 342
    },
    {
      id: "reza",
      name: "Reza Mahendra",
      party: "Open Campus",
      color: "var(--chart-2)",
      platform: "Akses kegiatan lintas fakultas dan beasiswa mikro.",
      votes: 286
    },
    {
      id: "saira",
      name: "Saira Adelia",
      party: "Forum Riset",
      color: "var(--chart-3)",
      platform: "Pendanaan riset mahasiswa dan klinik proposal.",
      votes: 184
    },
    {
      id: "bima",
      name: "Bima Arkan",
      party: "Ruang Publik",
      color: "var(--chart-4)",
      platform: "Perbaikan ruang belajar dan jam layanan malam.",
      votes: 62
    }
  ]
}

