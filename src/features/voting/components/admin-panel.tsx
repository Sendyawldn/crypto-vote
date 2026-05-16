"use client"

import { useMemo, useState } from "react"
import {
  KeyRound,
  LockKeyhole,
  Play,
  Plus,
  Settings,
  ShieldCheck,
  Square,
  Trash2,
  UserCheck
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import type { Candidate, Election, ElectionStatus } from "../types"
import {
  aggregateEncryptedChoices,
  decryptAggregatedVote,
  type VoteLedgerEntry
} from "@/lib/elgamal-vote"

type AdminPanelProps = {
  election: Election
}

const adminEmail = "admin@kampus.test"
const adminPassword = "admin123"

export function AdminPanel({ election }: AdminPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginEmail, setLoginEmail] = useState(adminEmail)
  const [password, setPassword] = useState("")
  const [loginMessage, setLoginMessage] = useState("Login admin diperlukan untuk membuka kontrol penuh.")
  const [managedElection, setManagedElection] = useState(election)
  const [voteLedger] = useState<VoteLedgerEntry[]>([])
  const [candidateDraft, setCandidateDraft] = useState({
    name: "",
    party: "",
    platform: ""
  })
  const [voterNameDraft, setVoterNameDraft] = useState("")
  const [adminMessage, setAdminMessage] = useState("Admin memiliki full access atas konfigurasi demo.")
  const [finalTally, setFinalTally] = useState<Record<string, number> | null>(null)

  const votedNames = useMemo(
    () =>
      managedElection.authorizedVoters
        .filter((voter) => voter.hasVoted)
        .map((voter) => voter.name ?? voter.email),
    [managedElection.authorizedVoters]
  )

  async function loadElectionState() {
    const response = await fetch("/api/admin/election", { cache: "no-store" })

    if (!response.ok) {
      return
    }

    const body = (await response.json()) as { election: Election }
    setManagedElection(body.election)
  }

  function login() {
    if (loginEmail.trim().toLowerCase() === adminEmail && password === adminPassword) {
      setIsLoggedIn(true)
      setLoginMessage("Login berhasil. Admin panel terbuka.")
      loadElectionState()
      return
    }

    setLoginMessage("Email atau password admin salah.")
  }

  function updateElectionStatus(status: ElectionStatus) {
    if (
      status === "open" &&
      (!managedElection.title.trim() ||
        !managedElection.description.trim() ||
        !managedElection.region.trim() ||
        managedElection.candidates.length < 2)
    ) {
      setAdminMessage("Isi judul, deskripsi, region, dan minimal dua kandidat sebelum membuka pemilihan.")
      return
    }

    setManagedElection((current) => ({ ...current, status }))
    setAdminMessage(
      status === "open"
        ? "Pemilihan dibuka. User bisa langsung voting dengan nama."
        : status === "closed"
          ? "Pemilihan selesai. Admin dapat mendekripsi hasil akhir."
          : "Pemilihan dikembalikan ke draft untuk pengaturan."
    )

    if (status === "closed") {
      decryptFinalTally()
    }
  }

  function addCandidate() {
    if (!candidateDraft.name.trim() || !candidateDraft.party.trim()) {
      setAdminMessage("Nama dan kelompok kandidat wajib diisi.")
      return
    }

    const nextCandidate: Candidate = {
      id: candidateDraft.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      name: candidateDraft.name.trim(),
      party: candidateDraft.party.trim(),
      platform: candidateDraft.platform.trim() || "Platform belum diisi admin.",
      color: `var(--chart-${(managedElection.candidates.length % 4) + 1})`,
      votes: 0
    }

    setManagedElection((current) => ({
      ...current,
      candidates: [...current.candidates, nextCandidate]
    }))
    setCandidateDraft({ name: "", party: "", platform: "" })
    setAdminMessage("Kandidat ditambahkan.")
  }

  function removeCandidate(candidateId: string) {
    setManagedElection((current) => ({
      ...current,
      candidates: current.candidates.filter((candidate) => candidate.id !== candidateId)
    }))
    setAdminMessage("Kandidat dihapus dari konfigurasi admin.")
  }

  function addVoterName() {
    if (!voterNameDraft.trim()) {
      setAdminMessage("Masukkan nama pemilih.")
      return
    }

    setManagedElection((current) => ({
      ...current,
      totalVoters: current.totalVoters + 1,
      authorizedVoters: [
        ...current.authorizedVoters,
        {
          id: `NAME-${current.authorizedVoters.length + 1}`,
          email: `${voterNameDraft.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}@guest.vote`,
          name: voterNameDraft.trim(),
          hasVoted: false
        }
      ]
    }))
    setVoterNameDraft("")
    setAdminMessage("Nama pemilih ditambahkan ke daftar monitoring admin.")
  }

  async function syncAdminState() {
    const response = await fetch("/api/admin/election", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-cryptovote-admin": "true"
      },
      body: JSON.stringify(managedElection)
    })
    const body = await response.json()

    if (!response.ok) {
      setAdminMessage(body.title ?? "Gagal menyimpan state admin.")
      return
    }

    setAdminMessage(`State admin disimpan ke ${body.persistence}.`)
  }

  function decryptFinalTally() {
    const aggregates = aggregateEncryptedChoices(voteLedger)
    const decrypted = Object.fromEntries(
      managedElection.candidates.map((candidate) => {
        const aggregate = aggregates.get(candidate.id)

        return [
          candidate.id,
          aggregate ? decryptAggregatedVote(aggregate, voteLedger.length) : candidate.votes
        ]
      })
    )

    setFinalTally(decrypted)
  }

  if (!isLoggedIn) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8">
        <Card className="seal-panel w-full border-primary/20">
          <CardHeader>
            <Badge variant="secondary" className="mb-2 w-fit gap-2">
              <LockKeyhole className="size-3.5" aria-hidden="true" />
              /admin
            </Badge>
            <CardTitle className="text-3xl font-black">Login Admin</CardTitle>
            <CardDescription>
              Masuk untuk mengelola kandidat, status pemilihan, dan dekripsi hasil akhir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="grid gap-2 text-sm font-medium">
              Email admin
              <input
                className="h-11 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Password
              <input
                className="h-11 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="admin123"
              />
            </label>
            <Button type="button" className="w-full" onClick={login}>
              <ShieldCheck className="size-4" aria-hidden="true" />
              Masuk Admin
            </Button>
            <p className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
              {loginMessage}
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[92rem] flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
      <header className="counting-table rounded-lg border p-5 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="verified" className="mb-4 gap-2">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Admin authorized
            </Badge>
            <h1 className="text-4xl font-black sm:text-6xl">Admin CryptoVote</h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Full access untuk mengatur kandidat, status pemilihan, monitoring pemilih, dan dekripsi hasil.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => updateElectionStatus("open")}>
              <Play className="size-4" aria-hidden="true" />
              Mulai Pemilihan
            </Button>
            <Button type="button" variant="outline" onClick={() => updateElectionStatus("closed")}>
              <Square className="size-4" aria-hidden="true" />
              Selesaikan Pemilihan
            </Button>
            <Button type="button" onClick={syncAdminState}>
              <UserCheck className="size-4" aria-hidden="true" />
              Simpan State
            </Button>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Identitas Pemilihan</CardTitle>
          <CardDescription>
            Data ini kosong di awal dan harus diisi admin sebelum pemilihan dibuka.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium">
            Judul
            <input
              className="h-11 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={managedElection.title}
              onChange={(event) =>
                setManagedElection((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Judul pemilihan"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Region
            <input
              className="h-11 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={managedElection.region}
              onChange={(event) =>
                setManagedElection((current) => ({ ...current, region: event.target.value }))
              }
              placeholder="Nama kampus/organisasi"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium md:col-span-3">
            Deskripsi
            <textarea
              className="min-h-20 rounded-md border bg-background p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={managedElection.description}
              onChange={(event) =>
                setManagedElection((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Deskripsi pemilihan"
            />
          </label>
        </CardContent>
      </Card>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5 text-primary" aria-hidden="true" />
              Manajemen Kandidat
            </CardTitle>
            <CardDescription>Admin bisa menambah atau menghapus kandidat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <input
                className="h-11 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Nama kandidat"
                value={candidateDraft.name}
                onChange={(event) =>
                  setCandidateDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
              <input
                className="h-11 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Kelompok atau partai"
                value={candidateDraft.party}
                onChange={(event) =>
                  setCandidateDraft((current) => ({ ...current, party: event.target.value }))
                }
              />
              <textarea
                className="min-h-20 rounded-md border bg-background p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Platform kandidat"
                value={candidateDraft.platform}
                onChange={(event) =>
                  setCandidateDraft((current) => ({ ...current, platform: event.target.value }))
                }
              />
              <Button type="button" variant="secondary" onClick={addCandidate}>
                <Plus className="size-4" aria-hidden="true" />
                Tambah Kandidat
              </Button>
            </div>

            <div className="space-y-2">
              {managedElection.candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-start justify-between gap-3 rounded-md border bg-background p-3"
                >
                  <div>
                    <p className="font-semibold">{candidate.name}</p>
                    <p className="text-sm text-muted-foreground">{candidate.party}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCandidate(candidate.id)}
                    aria-label={`Hapus ${candidate.name}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monitoring Pemilih</CardTitle>
            <CardDescription>
              User tidak perlu akun. Admin dapat mencatat nama dan melihat siapa yang sudah memilih.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                className="h-11 min-w-0 flex-1 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Nama pemilih"
                value={voterNameDraft}
                onChange={(event) => setVoterNameDraft(event.target.value)}
              />
              <Button type="button" variant="secondary" onClick={addVoterName}>
                <Plus className="size-4" aria-hidden="true" />
                Tambah
              </Button>
            </div>
            <div className="max-h-80 space-y-2 overflow-auto pr-1">
              {managedElection.authorizedVoters.map((voter) => (
                <div
                  key={voter.id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-background p-3"
                >
                  <div>
                    <p className="font-semibold">{voter.name ?? voter.id}</p>
                    <p className="text-sm text-muted-foreground">{voter.email}</p>
                  </div>
                  <Badge variant={voter.hasVoted ? "verified" : "outline"}>
                    {voter.hasVoted ? "Sudah memilih" : "Belum"}
                  </Badge>
                </div>
              ))}
              {votedNames.length === 0 ? (
                <p className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
                  Belum ada pemilih yang tercatat memilih di panel admin ini.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="seal-panel border-crypto/25">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-crypto" aria-hidden="true" />
            Dekripsi Hasil Akhir
          </CardTitle>
          <CardDescription>
            Private key dan fungsi dekripsi hanya berada di area admin setelah pemilihan selesai.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            onClick={decryptFinalTally}
            disabled={managedElection.status !== "closed"}
          >
            <KeyRound className="size-4" aria-hidden="true" />
            Dekripsi Tally Agregat
          </Button>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {managedElection.candidates.map((candidate) => (
              <ProofTile
                key={candidate.id}
                label={candidate.name}
                value={`${finalTally?.[candidate.id] ?? candidate.votes} suara`}
              />
            ))}
          </div>
          <p className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
            {adminMessage}
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

function ProofTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words font-mono text-lg font-black">{value}</p>
    </div>
  )
}
