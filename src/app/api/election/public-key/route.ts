import { NextResponse } from "next/server"
import { serializePublicKey } from "@/lib/elgamal"
import { DEMO_PUBLIC_KEY } from "@/lib/elgamal-vote"

export async function GET() {
  return NextResponse.json(
    {
      publicKey: serializePublicKey(DEMO_PUBLIC_KEY)
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  )
}
