import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { EvaluationPdf } from "./evaluation-pdf"

// Helper: normalize object | object[]
function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: evaluationId } = await params
  const supabase = await getSupabaseServerClient()

  const { data: evaluationRaw, error: eErr } = await supabase
    .from("evaluations")
    .select(`
      id,
      form_id,
      evaluator_id,
      evaluated_id,
      submitted_at,
      form:forms(id, title, period),
      evaluated:agents_public!evaluations_evaluated_id_fkey(id, matricule, first_name, last_name),
      evaluator:agents_public!evaluations_evaluator_id_fkey(id, matricule, first_name, last_name)
    `)
    .eq("id", evaluationId)
    .maybeSingle()

  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 400 })
  if (!evaluationRaw) return NextResponse.json({ error: "Evaluation introuvable" }, { status: 404 })

  // Normalize relations (object | array)
  const evaluation: any = evaluationRaw
  const form = one<any>(evaluation.form)
  const evaluated = one<any>(evaluation.evaluated)
  const evaluator = one<any>(evaluation.evaluator)
    
  const { data: answersRaw, error: aErr } = await supabase
    .from("answers")
    .select(`
      id,
      score,
      comment,
      q:questions(id, label, weight)
    `)
    .eq("evaluation_id", evaluationId)

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 400 })

  const rows = (answersRaw ?? []).map((x: any) => {
    const q = one<any>(x.q)
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
  const moyenne = totalCoeff > 0 ? Number((totalPoints / totalCoeff).toFixed(2)) : 0
  const noteGlobale = Math.round(moyenne)

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
      logoUrl: "public/logo.png",      // <-- ton logo dans public
      city: "Abidjan",
      docId: evaluation.id,
    })
  )

  const title = form?.title ?? "notation"
  const matricule = evaluated?.matricule ?? ""
  const fileName = `${title}_${matricule}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
    },
    })
}
