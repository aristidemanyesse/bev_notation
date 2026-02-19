import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { EvaluationPdf } from "./evaluation-pdf"
import type { Answer, Evaluation } from "@/lib/types/database"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

// Helper: normalize object | object[]
function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

// Helper: call backend with forwarded Authorization
async function backendGet<T>(path: string, auth: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail || err?.message || `Backend error ${res.status}`)
  }

  return res.json() as Promise<T>
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  try {
    // 1️⃣ Récupérer le token envoyé par le client
    const auth = req.headers.get("authorization")
    if (!auth) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // 2️⃣ Paramètre
    const { id: evaluationId } = await params

    // 3️⃣ Appels backend Django
    const evaluation = await backendGet<Evaluation>(
      `/api/evaluations/${evaluationId}/`,
      auth
    )

    const answersRaw = await backendGet<Answer[]>(
      `/api/evaluations/${evaluationId}/answers/`,
      auth
    )

    // 4️⃣ Normalisation
    const form = one<any>(evaluation.form)
    const evaluated = one<any>(evaluation.evaluated)
    const evaluator = one<any>(evaluation.evaluator)

    const rows = (answersRaw ?? []).map((x: any) => {
      const q = one<any>(x.q ?? x.question)
      const coeff = Number(q?.weight ?? 1)
      const score = Number(x.score ?? 0)

      return {
        label: String(q?.label ?? "Question"),
        score,
        coeff,
        total: score * coeff,
      }
    })

    const totalCoeff = rows.reduce((s, r) => s + r.coeff, 0)
    const totalPoints = rows.reduce((s, r) => s + r.total, 0)
    const moyenne =
      totalCoeff > 0 ? Number((totalPoints / totalCoeff).toFixed(2)) : 0
    const noteGlobale = Math.round(moyenne)

    // 5️⃣ Génération PDF
    const pdfBuffer = await renderToBuffer(
      EvaluationPdf({
        evaluation: {
          id: evaluation.id,
          submitted_at: evaluation.submitted_at,
          form,
          evaluated,
          evaluator,
        },
        rows,
        totalCoeff,
        totalPoints,
        moyenne,
        noteGlobale,
        logoUrl: "/logo.png",
        city: "Abidjan",
        docId: evaluation.id,
      })
    )

    const period = form?.period ?? "campagne"
    const matricule = evaluated?.matricule ?? ""
    const fileName = `evaluation_${period}_${matricule}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || "Erreur génération PDF") },
      { status: 500 }
    )
  }
}
