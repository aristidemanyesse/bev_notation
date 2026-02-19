import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { CampaignFinalPdf } from "./telecharger"
import { Agent, Form } from "@/lib/types/database"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

async function backendGet<T>(path: string, auth: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: auth, "Content-Type": "application/json" },
    cache: "no-store",
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail || err?.message || `Backend error ${res.status}`)
  }
  return res.json() as Promise<T>
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

type AnyObj = Record<string, any>

export async function GET(
  req: Request,
  { params }: { params: { id: string; agentId: string } }
) {
  try {
    const auth = req.headers.get("authorization")
    if (!auth) return new NextResponse("Unauthorized", { status: 401 })

    const { id, agentId } = await params

    const payload = await backendGet<AnyObj>(
      `/api/forms/${id}/agents/${agentId}/final-recap/`,
      auth
    )

    const form = one<Form>(payload.form) ?? payload.form ?? null
    const agent = one<Agent>(payload.agent) ?? payload.agent ?? null

    // Cas 1: backend renvoie déjà rows finalisées
    if (Array.isArray(payload.rows)) {
      const rows = payload.rows.map((r: any) => ({
        label: String(r.label ?? "Question"),
        score: Number(r.score ?? 0),
        coeff: Number(r.coeff ?? 1),
        total: Number(r.total ?? 0),
      }))

      const totalCoeff = rows.reduce((s: number, r: any) => s + r.coeff, 0)
      const totalPoints = rows.reduce((s: number, r: any) => s + r.total, 0)
      const moyenne = totalCoeff > 0 ? Number((totalPoints / totalCoeff).toFixed(2)) : 0
      const noteGlobale = Math.round(moyenne)

      const pdfBuffer = await renderToBuffer(
        CampaignFinalPdf({
          form,
          agent,
          rows,
          totalCoeff,
          totalPoints,
          moyenne,
          noteGlobale,
          city: "Abidjan",
          logoUrl: "/logo.png",
          docId: `FINAL-${form?.period ?? ""}-${agent?.matricule ?? ""}`,
        })
      )

      const fileName = `bulletin_final_${form?.period ?? "campagne"}_${agent?.matricule ?? ""}.pdf`

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Cache-Control": "no-store",
        },
      })
    }

    // Cas 2: backend renvoie evaluations[] -> answers[] -> question{label,weight}
    const evaluations: AnyObj[] = Array.isArray(payload.evaluations) ? payload.evaluations : []

    // Agrégation par (label, coeff)
    const agg = new Map<string, { label: string; coeff: number; score: number ; total: number }>()

    for (const ev of evaluations) {
      const answers: AnyObj[] =
        Array.isArray(ev.answers) ? ev.answers :
        Array.isArray(ev.rows) ? ev.rows : // au cas où
        []

      for (const a of answers) {
        const q = one<any>(a.q ?? a.question) ?? null
        const label = String(q?.label ?? a.label ?? "Question")
        const score = Number(a.score ?? 0)
        const coeff = Number(q?.weight ?? a.coeff ?? 1)
        const total = Number(a.total ?? (score * coeff))

        const key = `${label}__${coeff}`
        const cur = agg.get(key)
        if (!cur) agg.set(key, { label, coeff, score, total })
        else cur.total += total
      }
    }

    const rows = Array.from(agg.values())
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((r) => ({ label: r.label, coeff: r.coeff, score: r.score, total: r.total }))

    const totalCoeff = rows.reduce((s, r) => s + r.coeff, 0)
    const totalPoints = rows.reduce((s, r) => s + r.total, 0)
    const moyenne = totalCoeff > 0 ? Number((totalPoints / totalCoeff).toFixed(2)) : 0
    const noteGlobale = Math.round(moyenne)

    const pdfBuffer = await renderToBuffer(
      CampaignFinalPdf({
        form,
        agent,
        rows,
        totalCoeff,
        totalPoints,
        moyenne,
        noteGlobale,
        city: "Abidjan",
        logoUrl: "/logo.png",
        docId: `FINAL-${form?.period ?? ""}-${agent?.matricule ?? ""}`,
      })
    )

    const fileName = `bulletin_final_${form?.period ?? "campagne"}_${agent?.matricule ?? ""}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || "Erreur PDF bulletin final") }, { status: 500 })
  }
}
