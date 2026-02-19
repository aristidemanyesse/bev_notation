// lib/pdf/evaluation-pdf.tsx
import React from "react"
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { Agent, Form } from "@/lib/types/database"


const COLORS = {
  border: "#333333",
  headerGrey: "#EFEFEF",
  totalPink: "#F3C6F1",
  yellow: "#FFF200",
  greyCell: "#B2AFAF",
}

const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingHorizontal: 34, paddingBottom: 24, fontFamily: "Times-Roman", fontSize: 11 },

  // Top header
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  ministryBlock: { width: "60%" },
  ministryLine: { textAlign: "center", fontSize: 12, fontWeight: "bold" },
  dashed: { textAlign: "center", marginTop: 2, marginBottom: 2 },
  logoBlock: { width: "35%", alignItems: "flex-end" },
  logo: { width: 90, height: 60, marginBottom: 10 },
  cityDate: { fontSize: 12 },

  idLine: { marginTop: 10, fontSize: 10, fontStyle: "italic" },

  // Title box (like the model)
  titleWrap: { marginTop: 16, marginBottom: 16, position: "relative" },
  titleBox: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dotted",
  },
  titleBarLeft: {
    position: "absolute",
    left: -1,
    top: -1,
    bottom: -1,
    width: 6,
    backgroundColor: "#666",
  },
  titleBarTop: {
    position: "absolute",
    left: -1,
    right: -1,
    top: -1,
    height: 6,
    backgroundColor: "#666",
  },
  titleText: { textAlign: "center", fontSize: 18, fontWeight: "bold" },

  // Meta info block
  meta: { marginBottom: 10, lineHeight: 1.35 },
  metaLine: { marginBottom: 4 },
  metaLabel: { fontWeight: "bold" },

  // Table
  table: { borderWidth: 1, borderColor: COLORS.border },
  tr: { flexDirection: "row" },
  th: { backgroundColor: "white" },

  c1: { width: "70%", borderRightWidth: 1, borderRightColor: COLORS.border, padding: 5 },
  c2: { width: "10%", borderRightWidth: 1, borderRightColor: COLORS.border, padding: 5, textAlign: "center" },
  c3: { width: "10%", borderRightWidth: 1, borderRightColor: COLORS.border, padding: 5, textAlign: "center" },
  c4: { width: "10%", padding: 5, textAlign: "center", backgroundColor: COLORS.totalPink },

  headerCell: { fontWeight: "bold" },

  rowCell: {
  borderBottomWidth: 1,
  borderBottomColor: COLORS.border,
    },
    rowLastCell: {
    borderBottomWidth: 0,
    },

  // Totals block rows (like model)
  totalsRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: COLORS.border },
  totalsLeft: {
    width: "70%",
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    padding: 5,
    textAlign: "right",
    fontWeight: "bold",
  },
  totalsMid: { width: "10%", borderRightWidth: 1, borderRightColor: COLORS.border, padding: 5, backgroundColor: COLORS.greyCell },
  totalsCoeff: { width: "10%", borderRightWidth: 1, borderRightColor: COLORS.border, padding: 5, textAlign: "center", backgroundColor: COLORS.yellow, fontWeight: "bold" },
  totalsPts: { width: "10%", padding: 5, textAlign: "center", backgroundColor: COLORS.yellow, fontWeight: "bold" },

  moyenneLeft: { width: "70%", borderRightWidth: 1, borderRightColor: COLORS.border, padding: 5, textAlign: "center", fontWeight: "bold" },
  moyenneMid: { width: "10%", borderRightWidth: 1, borderRightColor: COLORS.border, padding: 5, textAlign: "center", backgroundColor: COLORS.yellow, fontWeight: "bold" },
  moyenneRightGrey: { width: "20%", padding: 5, backgroundColor: COLORS.greyCell },

  noteLeft: { width: "70%", borderRightWidth: 1, borderRightColor: COLORS.border, padding: 5, textAlign: "right", fontWeight: "bold" },
  noteMid: { width: "10%", borderRightWidth: 1, borderRightColor: COLORS.border, padding: 5, textAlign: "center", backgroundColor: COLORS.yellow, fontWeight: "bold" },
  noteRightGrey: { width: "20%", padding: 5, backgroundColor: COLORS.greyCell },

  // Signature block
  signBlock: { marginTop: 18, alignItems: "flex-end" },
  signLine: { width: 170, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 4 },
  signText: { fontSize: 12 },
  signName: { marginTop: 28, fontSize: 12 },

  // Footer
  footerHint: { marginTop: 18, fontSize: 9 },
  footerLine: { marginTop: 6, borderBottomWidth: 2, borderBottomColor: COLORS.border },
  footerCols: { marginTop: 6, flexDirection: "row", fontSize: 9, justifyContent: "space-between" },
  footerCol: { width: "33%" },
})

export function CampaignFinalPdf({
  form,
  agent,
  rows,
  totalCoeff,
  totalPoints,
  moyenne,
  noteGlobale,
  logoUrl,
  city = "Abidjan",
  docId,
}: {
  form: Form
  agent: Agent
  rows: { label: string; score: number; coeff: number; total: number }[]
  totalCoeff: number
  totalPoints: number
  moyenne: number
  noteGlobale: number
  logoUrl?: string
  city?: string
  docId?: string
}) {
  const agentName = `${agent?.last_name ?? ""} ${agent?.first_name ?? ""}`.trim()
  const matricule = agent?.matricule ?? ""

  const title = form?.title ?? ""
  const submittedAt = new Date().toLocaleDateString("fr-FR")

  const evaluatorName = ""

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.topRow}>
          <View style={styles.ministryBlock}>
            <Text style={styles.ministryLine}>MINISTERE DES FINANCES</Text>
            <Text style={styles.ministryLine}>ET DU BUDGET</Text>
            <Text style={styles.dashed}>---------</Text>
            <Text style={styles.ministryLine}>DIRECTION GENERALE DES IMPOTS</Text>
            <Text style={styles.dashed}>---------</Text>
            <Text style={styles.ministryLine}>DIRECTION DES ENQUÊTES, DU RENSEIGNEMENT ET</Text>
            <Text style={styles.ministryLine}>DE L'ANALYSE-RISQUE</Text>
            <Text style={styles.dashed}>---------</Text>
            <Text style={styles.ministryLine}>SOUS-DIRECTION DES ENQUÊTES,</Text>
            <Text style={styles.ministryLine}>DES RECOUPEMENTS ET DU RENSEIGNEMENT</Text>
            <Text style={styles.dashed}>---------</Text>
            <Text style={styles.ministryLine}>Brigade d'enquête et de Visite</Text>
            <Text style={styles.dashed}>---------</Text>
          </View>

          <View style={styles.logoBlock}>
            {logoUrl ? <Image style={styles.logo} src={logoUrl} /> : null}
            <Text style={styles.cityDate}>
              {city}, le {submittedAt}
            </Text>
          </View>
        </View>


        {/* TITLE */}
        <View style={styles.titleWrap}>
          <View style={styles.titleBarLeft} />
          <View style={styles.titleBarTop} />
          <View style={styles.titleBox}>
            <Text style={styles.titleText}>GRILLE DE NOTATION TRIMESTRIELLE</Text>
            <Text style={styles.titleText}>DES AGENTS DES IMPOTS</Text>
          </View>
        </View>

        {/* META */}

        <View style={styles.meta}>

          <View>
              <View style={{width: "65%"}}>
                <Text style={styles.metaLabel}>NOM DE L’AGENT :</Text> {agentName}
              </View>
              <View style={{width: "35%"}}>
                <Text style={styles.metaLabel}>MATRICULE :</Text> {matricule}
              </View>
          </View>

          <Text style={styles.metaLine}>
            <Text style={styles.metaLabel}>DIRECTION :</Text> DIRECTION DES ENQUÊTES, DU RENSEIGNEMENT ET DE L'ANALYSE-RISQUE
          </Text>

          <Text style={styles.metaLine}>
            <Text style={styles.metaLabel}>SOUS-DIRECTION :</Text> DIRECTION DES ENQUÊTES, DU RENSEIGNEMENT ET DE L'ANALYSE-RISQUE
          </Text>

          <Text style={styles.metaLine}>
            <Text style={styles.metaLabel}>SERVICE :</Text> Brigade d'enquête et de Visite
          </Text>
        </View>

        {/* TABLE */}
        <View style={styles.table}>
          <View style={[styles.tr, styles.th]}>
            <Text style={[styles.c1, styles.headerCell, styles.rowCell]}>APTITUDES PROFESSIONNELLES</Text>
            <Text style={[styles.c2, styles.headerCell, styles.rowCell]}>NOTES</Text>
            <Text style={[styles.c3, styles.headerCell, styles.rowCell]}>COEFF.</Text>
            <Text style={[styles.c4, styles.headerCell, styles.rowCell, { backgroundColor: "white" }]}>TOTAL</Text>
          </View>

          {rows.map((r, idx) => {
            const isLast = idx === rows.length - 1
            const cellStyle = isLast ? [styles.rowCell, styles.rowLastCell] : styles.rowCell

            return (
                <View key={idx} style={[styles.tr]}>
                    <Text style={[styles.c1, styles.rowCell]}>{r.label}</Text>
                    <Text style={[styles.c2, styles.rowCell]}>{r.score}</Text>
                    <Text style={[styles.c3, styles.rowCell]}>{r.coeff}</Text>
                    <Text style={[styles.c4, styles.rowCell]}>{r.total}</Text>
                </View>
            )
        })}

          {/* TOTAUX */}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLeft}>TOTAUX</Text>
            <Text style={styles.totalsMid}></Text>
            <Text style={styles.totalsCoeff}>{totalCoeff}</Text>
            <Text style={styles.totalsPts}>{totalPoints}</Text>
          </View>

          {/* MOYENNE */}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLeft}>
              MOYENNE (Totaux des notes affectées des coefficients /{totalCoeff || 1})
            </Text>
            <Text style={styles.moyenneMid}>{moyenne}</Text>
            <Text style={styles.moyenneRightGrey}></Text>
          </View>

          {/* NOTE TRIMESTRE */}
          <View style={styles.totalsRow}>
            <Text style={styles.noteLeft}>NOTE DU {title || "TRIMESTRE"}</Text>
            <Text style={styles.noteMid}>{noteGlobale}</Text>
            <Text style={styles.noteRightGrey}></Text>
          </View>
        </View>

        {/* SIGNATURE */}
        <View style={styles.signBlock}>
          <View style={styles.signLine} />
          <Text style={styles.signText}>
            Noté le {new Date().toLocaleDateString("fr-FR")} par
          </Text>
          <Text style={styles.signName}>{evaluatorName || ""}</Text>
        </View>

        {/* FOOTER (comme le modèle) */}
        <Text style={styles.footerHint}>Ce document est à joindre à l’état trimestriel des ristournes</Text>
        <View style={styles.footerLine} />

        <View style={styles.footerCols}>
          <Text style={{textAlign: "center", color: "grey"}}>DERAR-Abidjan - Deux Plateaux Vallons - rue des jardins - BP V 103 Abidjan - Tél : 27 22 41 20 96 - Fax : 27 22 41 32 20</Text>
          <Text style={{textAlign: "center", color: "grey"}}>Site web: www.dgi.gouv.ci - Email: info@dgi.gouv.ci - Ligne verte: 800 88 888</Text>
        </View>
      </Page>
    </Document>
  )
}