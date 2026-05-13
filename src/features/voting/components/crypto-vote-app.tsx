"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import {
  BadgeCheck,
  Check,
  Clock,
  KeyRound,
  LockKeyhole,
  ReceiptText,
  SearchCheck,
  ShieldCheck,
  Vote
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
import { Progress } from "@/components/ui/progress"
import type { Election, VoteReceipt } from "../types"
import {
  verifyVoteToken,
  type VoteLedgerEntry
} from "@/lib/elgamal-vote"
import { DEMO_ELGAMAL_PARAMETERS } from "@/lib/elgamal"
import {
  applyLocalVote,
  createReceipt,
  getCandidatePercent,
  getTurnoutPercentage
} from "../tally"
import { cn } from "@/lib/utils"

type CryptoVoteAppProps = {
  election: Election
}

export function CryptoVoteApp({ election }: CryptoVoteAppProps) {
  const [liveElection, setLiveElection] = useState(election)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("")
  const [voterName, setVoterName] = useState("")
  const [receipt, setReceipt] = useState<VoteReceipt | null>(null)
  const [voteLedger, setVoteLedger] = useState<VoteLedgerEntry[]>([])
  const [verificationToken, setVerificationToken] = useState("")
  const [verificationMessage, setVerificationMessage] = useState(
    "Tempel token EGV1 dari receipt untuk mengecek status hitung."
  )
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verified" | "invalid">("idle")
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const selectedCandidate = liveElection.candidates.find(
    (candidate) => candidate.id === selectedCandidateId
  )
  const turnout = getTurnoutPercentage(liveElection.ballotsCast, liveElection.totalVoters)
  const chartData = useMemo(
    () =>
      liveElection.candidates.map((candidate) => ({
        name: candidate.name.split(" ")[0],
        votes: candidate.votes,
        percent: getCandidatePercent(candidate.votes, liveElection.ballotsCast),
        color: candidate.color
      })),
    [liveElection]
  )
  const trendData = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => ({
        tick: `${index + 1}`,
        ballots: Math.max(0, liveElection.ballotsCast - (5 - index) * 18)
      })),
    [liveElection.ballotsCast]
  )

  function castVote() {
    if (!selectedCandidateId || receipt || !voterName.trim()) {
      return
    }

    if (liveElection.status === "closed") {
      setVerificationStatus("invalid")
      setVerificationMessage("Pemilihan sudah selesai.")
      return
    }

    const nextReceipt = createReceipt(
      selectedCandidateId,
      liveElection.candidates.map((candidate) => candidate.id)
    )

    setReceipt(nextReceipt)
    setVerificationToken(nextReceipt.verificationToken)
    setVoteLedger((current) => [
      ...current,
      {
        receiptHash: nextReceipt.receiptHash,
        token: nextReceipt.verificationToken,
        createdAt: nextReceipt.createdAt,
        candidateId: selectedCandidateId,
        voterName: voterName.trim(),
        encryptedChoices: nextReceipt.encryptedChoices
      }
    ])
    setLiveElection((current) => applyLocalVote(current, selectedCandidateId))
  }

  function verifyToken() {
    const result = verifyVoteToken(verificationToken.trim(), voteLedger)

    setVerificationStatus(result.status)
    setVerificationMessage(result.message)
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[92rem] flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
      <header className="counting-table rounded-lg border p-5 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <Badge variant="secondary" className="mb-4 gap-2 border-primary/20 bg-primary/10 text-foreground">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
              El Gamal homomorphic tally
            </Badge>
            <h1 className="max-w-3xl text-4xl font-black tracking-normal text-foreground sm:text-6xl">
              CryptoVote
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              {liveElection.title} untuk {liveElection.region}. Pilih kandidat,
              kunci suara, lalu pantau agregasi terenkripsi tanpa membuka pilihan
              individu.
            </p>
          </div>
          <div className="grid gap-3 sm:min-w-[26rem] sm:grid-cols-2">
            <StatusTile label="Partisipasi" value={`${turnout}%`} icon={Vote} />
            <StatusTile label="Status" value={liveElection.status.toUpperCase()} icon={Clock} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t pt-5 md:grid-cols-4">
          <CustodyStep label="1. Identitas" value={voterName.trim() ? "Nama tercatat" : "Isi nama"} />
          <CustodyStep label="2. Enkripsi" value={receipt ? "Receipt tersegel" : "Siap El Gamal"} />
          <CustodyStep label="3. Ledger" value={`${voteLedger.length} token`} />
          <CustodyStep label="4. Tally" value={liveElection.status === "closed" ? "Final" : "Terkunci"} />
        </div>
      </header>

      <section className="custody-rail grid gap-4 rounded-lg border p-4 shadow-sm sm:grid-cols-[1fr_auto]">
        <label className="grid gap-2 text-sm font-medium">
          Nama pemilih
          <input
            className="h-11 rounded-md border bg-card px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={voterName}
            onChange={(event) => setVoterName(event.target.value)}
            placeholder="Masukkan nama"
          />
        </label>
        <div className="flex items-end">
          <Badge variant="outline" className="min-h-11 px-4">
            Voter bebas
          </Badge>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.88fr_1.08fr]">
        <Card className="order-1 overflow-hidden border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="size-5 text-primary" aria-hidden="true" />
              Surat Suara
            </CardTitle>
            <CardDescription>
              Masukkan nama, pilih kandidat, lalu kunci suara terenkripsi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {liveElection.candidates.map((candidate) => {
              const selected = selectedCandidateId === candidate.id

              return (
                <button
                  key={candidate.id}
                  type="button"
                  className={cn(
                    "w-full rounded-lg border bg-background p-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected && "border-primary bg-secondary shadow-md ring-1 ring-primary/20",
                    receipt && !selected && "opacity-60"
                  )}
                  onClick={() => !receipt && setSelectedCandidateId(candidate.id)}
                  aria-pressed={selected}
                >
                  <span className="flex items-start justify-between gap-4">
                    <span>
                      <span className="block text-base font-bold">{candidate.name}</span>
                      <span className="mt-1 block text-sm font-medium text-primary">
                        {candidate.party}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full border",
                        selected && "border-primary bg-primary text-primary-foreground"
                      )}
                      aria-hidden="true"
                    >
                      {selected ? <Check className="size-4" /> : null}
                    </span>
                  </span>
                  <span className="mt-3 block text-sm leading-6 text-muted-foreground">
                    {candidate.platform}
                  </span>
                </button>
              )
            })}

            <Button
              className="w-full"
              size="lg"
              disabled={
                !selectedCandidateId ||
                Boolean(receipt) ||
                liveElection.status === "closed" ||
                !voterName.trim()
              }
              onClick={castVote}
            >
              <LockKeyhole className="size-4" aria-hidden="true" />
              {receipt ? "Suara Terkunci" : "Kunci dan Kirim Suara"}
            </Button>
          </CardContent>
        </Card>

        <Card className="seal-panel order-2 border-crypto/30 lg:order-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="size-5 text-crypto" aria-hidden="true" />
              Receipt Terenkripsi
            </CardTitle>
            <CardDescription>
              Receipt membuktikan suara sudah masuk ke agregasi tanpa menampilkan pilihan plaintext.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-crypto/50 bg-secondary/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <Badge variant={receipt ? "verified" : "outline"}>
                  {receipt ? "Tersegel" : "Menunggu pilihan"}
                </Badge>
                <KeyRound className="size-5 text-crypto" aria-hidden="true" />
              </div>
              <div className="mt-5 min-h-28 rounded-md bg-card p-4 font-mono text-sm shadow-inner">
                {receipt ? (
                  <div className="space-y-3" aria-live="polite">
                    <p className="break-all text-base font-bold text-primary">
                      {receipt.encryptedBallot}
                    </p>
                    <p className="break-all text-xs text-muted-foreground">
                      Hash: {receipt.receiptHash}
                    </p>
                    <p className="text-muted-foreground">{receipt.proofLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      Dibuat {new Date(receipt.createdAt).toLocaleTimeString("id-ID")}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Pilihan {selectedCandidate?.name ?? "belum dipilih"} akan disegel sebagai ballot El Gamal.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Kesiapan verifikasi</span>
                <span className="font-mono">{receipt ? "100%" : "64%"}</span>
              </div>
              <Progress value={receipt ? 100 : 64} aria-label="Kesiapan verifikasi" />
              <p className="text-sm leading-6 text-muted-foreground">
                Token receipt memakai ciphertext El Gamal untuk setiap kandidat.
                Token tidak menyimpan nama kandidat yang dipilih dalam plaintext.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="order-3 overflow-hidden">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BadgeCheck className="size-5 text-verified" aria-hidden="true" />
                  Hasil Live
                </CardTitle>
                <CardDescription>
                  Total suara publik diperbarui dengan simulasi refresh ringan.
                </CardDescription>
              </div>
              <Badge variant="verified">{liveElection.ballotsCast} suara</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="h-64 w-full" aria-label="Grafik suara kandidat">
              {hasMounted ? (
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 8, right: 24 }}
                  responsive
                  style={{ width: "100%", height: "100%" }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={52}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "color-mix(in oklch, var(--secondary) 65%, transparent)" }}
                    formatter={(value, name) => [
                      name === "votes" ? `${value} suara` : `${value}%`,
                      name === "votes" ? "Total" : "Persen"
                    ]}
                  />
                  <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
                    <LabelList dataKey="percent" position="right" formatter={(value) => `${value ?? 0}%`} />
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <div className="h-full rounded-md bg-muted" />
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Turnout</span>
                <span className="font-mono">
                  {liveElection.ballotsCast}/{liveElection.totalVoters}
                </span>
              </div>
              <Progress value={turnout} aria-label="Persentase partisipasi" />
            </div>

            <div className="h-24 w-full" aria-label="Tren ballot masuk">
              {hasMounted ? (
                <LineChart data={trendData} responsive style={{ width: "100%", height: "100%" }}>
                  <XAxis dataKey="tick" hide />
                  <YAxis hide domain={["dataMin - 20", "dataMax + 20"]} />
                  <Tooltip formatter={(value) => [`${value} suara`, "Ballot"]} />
                  <Line
                    type="monotone"
                    dataKey="ballots"
                    stroke="var(--verified)"
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={!receipt}
                  />
                </LineChart>
              ) : (
                <div className="h-full rounded-md bg-muted" />
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-verified/25">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchCheck className="size-5 text-verified" aria-hidden="true" />
              Verifikasi Token
            </CardTitle>
            <CardDescription>
              Tempel token receipt untuk membuktikan ciphertext sudah masuk ledger tanpa membuka pilihan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="grid gap-2 text-sm font-medium">
              Token EGV1
              <textarea
                className="min-h-28 resize-y rounded-md border bg-background p-3 font-mono text-xs leading-5 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                value={verificationToken}
                onChange={(event) => {
                  setVerificationToken(event.target.value)
                  setVerificationStatus("idle")
                }}
                placeholder="EGV1..."
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={verifyToken}
              disabled={!verificationToken.trim()}
            >
              <SearchCheck className="size-4" aria-hidden="true" />
              Verifikasi Tanpa Reveal Pilihan
            </Button>
            <div
              className={cn(
                "rounded-md border p-3 text-sm leading-6",
                verificationStatus === "verified" &&
                  "border-verified bg-verified/10 text-foreground",
                verificationStatus === "invalid" &&
                  "border-destructive bg-destructive/10 text-foreground"
              )}
              aria-live="polite"
            >
              <span className="font-semibold">
                {verificationStatus === "verified"
                  ? "Terverifikasi"
                  : verificationStatus === "invalid"
                    ? "Tidak Valid"
                    : "Menunggu Token"}
              </span>
              <p className="mt-1 text-muted-foreground">{verificationMessage}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="seal-panel border-crypto/25">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-crypto" aria-hidden="true" />
              Bukti Homomorfik
            </CardTitle>
            <CardDescription>
              Setiap suara menyimpan vektor ciphertext. Tally menjumlah dengan perkalian ciphertext per kandidat.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <ProofTile label="Ledger lokal" value={`${voteLedger.length}`} />
            <ProofTile label="Modulus p" value={DEMO_ELGAMAL_PARAMETERS.p.toString()} />
            <ProofTile label="Generator g" value={DEMO_ELGAMAL_PARAMETERS.g.toString()} />
            <ProofTile label="Operasi tally" value="C1 x C2 mod p" />
            <ProofTile label="Private key" value="Key ceremony produksi" />
            <ProofTile label="Reveal pilihan" value="Tidak" />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function StatusTile({
  label,
  value,
  icon: Icon
}: {
  label: string
  value: string
  icon: typeof Vote
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          {label}
        </span>
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </div>
      <p className="mt-2 font-mono text-2xl font-black">{value}</p>
    </div>
  )
}

function CustodyStep({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card/75 p-3">
      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-black text-foreground">{value}</p>
    </div>
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
