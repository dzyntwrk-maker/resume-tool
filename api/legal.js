// Vercel serverless function — /api/legal
// Works with or without ANTHROPIC_API_KEY:
//   With key    → Claude Haiku (full AI legal language)
//   Without key → Fill-in-the-blank template generator

const DISCLAIMER =
  "DISCLAIMER: This document is a template generated for reference purposes only. It does not constitute legal advice. Laws vary by jurisdiction, and this template may not reflect current law or be appropriate for your specific situation. Consult a qualified attorney before relying on or executing any legal document.";

// ── Template fallback ─────────────────────────────────────────────────────────

function today() {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function templateNDA({ partyA, partyB, jurisdiction, terms }) {
  const { purpose = "exploring a potential business relationship", duration = "2 years", governing = jurisdiction || "Delaware" } = terms || {};
  return `NON-DISCLOSURE AGREEMENT (NDA)
================================

This Non-Disclosure Agreement ("Agreement") is entered into as of ${today()} ("Effective Date") by and between:

  ${partyA || "[PARTY A NAME]"} ("Disclosing Party")
and
  ${partyB || "[PARTY B NAME]"} ("Receiving Party")

collectively referred to as the "Parties."

1. PURPOSE
The Parties wish to explore ${purpose}. In connection with this purpose, each Party may disclose certain confidential and proprietary information to the other Party.

2. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any non-public information disclosed by one Party to the other, either directly or indirectly, in writing, orally, or by inspection of tangible objects, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure.

3. OBLIGATIONS
The Receiving Party agrees to:
   a) Hold all Confidential Information in strict confidence;
   b) Not disclose Confidential Information to any third party without prior written consent;
   c) Use Confidential Information solely for the Purpose stated above;
   d) Protect Confidential Information with at least the same degree of care used to protect its own confidential information, but in no event less than reasonable care.

4. EXCLUSIONS
Confidential Information does not include information that:
   a) Is or becomes publicly known through no breach of this Agreement;
   b) Was rightfully known by the Receiving Party prior to disclosure;
   c) Is lawfully obtained from a third party without restriction;
   d) Is independently developed by the Receiving Party without use of Confidential Information;
   e) Must be disclosed by law or court order (with prompt notice to the Disclosing Party).

5. TERM
This Agreement shall remain in effect for ${duration} from the Effective Date, unless terminated earlier by mutual written agreement.

6. RETURN OF INFORMATION
Upon request, the Receiving Party shall promptly return or destroy all Confidential Information and certify such destruction in writing.

7. REMEDIES
The Parties acknowledge that breach of this Agreement may cause irreparable harm for which monetary damages may be inadequate. The Disclosing Party shall be entitled to seek injunctive or other equitable relief in addition to all other remedies.

8. GOVERNING LAW
This Agreement shall be governed by the laws of ${governing}, without regard to conflict of law principles.

9. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the Parties concerning the subject matter hereof and supersedes all prior agreements and understandings.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.

${partyA || "[PARTY A NAME]"}                    ${partyB || "[PARTY B NAME]"}

Signature: _______________________       Signature: _______________________
Name:      _______________________       Name:      _______________________
Title:     _______________________       Title:     _______________________
Date:      _______________________       Date:      _______________________

---
${DISCLAIMER}`;
}

function templateFreelance({ partyA, partyB, jurisdiction, terms }) {
  const {
    scope = "[describe the services or deliverables]",
    rate = "[rate and payment schedule]",
    deadline = "[project deadline or milestones]",
    revisions = "2",
    governing = jurisdiction || "Delaware",
  } = terms || {};
  return `FREELANCE CONTRACT
==================

This Freelance Contract ("Agreement") is entered into as of ${today()} between:

  ${partyA || "[CLIENT NAME]"} ("Client")
and
  ${partyB || "[FREELANCER NAME]"} ("Freelancer")

1. SERVICES
Freelancer agrees to provide the following services ("Services"):
   ${scope}

2. TIMELINE
Work shall commence upon signing and be completed by ${deadline}. Milestones and delivery dates shall be mutually agreed in writing.

3. COMPENSATION
Client agrees to pay Freelancer: ${rate}

Payment terms:
   a) Invoices are due within 14 days of receipt unless otherwise agreed;
   b) A 50% deposit is due before work begins unless otherwise agreed;
   c) Late payments accrue interest at 1.5% per month.

4. REVISIONS
Freelancer will provide up to ${revisions} rounds of revisions. Additional revisions shall be billed at Freelancer's standard hourly rate.

5. INTELLECTUAL PROPERTY
Upon receipt of full payment, all work product created specifically for Client under this Agreement shall become the sole property of Client. Freelancer retains the right to display the work in their portfolio unless otherwise agreed in writing.

6. INDEPENDENT CONTRACTOR
Freelancer is an independent contractor, not an employee of Client. Freelancer is solely responsible for all taxes, insurance, and withholdings applicable to their compensation.

7. CONFIDENTIALITY
Freelancer agrees to keep all Client business information, data, and materials confidential and not disclose them to third parties.

8. TERMINATION
Either party may terminate this Agreement with 14 days written notice. Client shall pay for all work completed up to the termination date.

9. LIMITATION OF LIABILITY
Freelancer's total liability shall not exceed the total fees paid under this Agreement. Neither party shall be liable for indirect, incidental, or consequential damages.

10. GOVERNING LAW
This Agreement is governed by the laws of ${governing}.

IN WITNESS WHEREOF, the Parties have signed this Agreement as of the date first written above.

${partyA || "[CLIENT NAME]"}                     ${partyB || "[FREELANCER NAME]"}

Signature: _______________________       Signature: _______________________
Name:      _______________________       Name:      _______________________
Date:      _______________________       Date:      _______________________

---
${DISCLAIMER}`;
}

function templateServiceAgreement({ partyA, partyB, jurisdiction, terms }) {
  const {
    scope = "[describe the services to be provided]",
    rate = "[fee structure and payment schedule]",
    startDate = "[start date]",
    endDate = "[end date or ongoing]",
    governing = jurisdiction || "Delaware",
  } = terms || {};
  return `SERVICE AGREEMENT
=================

This Service Agreement ("Agreement") is entered into as of ${today()} between:

  ${partyA || "[SERVICE PROVIDER NAME]"} ("Service Provider")
and
  ${partyB || "[CLIENT NAME]"} ("Client")

1. SCOPE OF SERVICES
Service Provider agrees to perform the following services ("Services"):
   ${scope}

2. TERM
This Agreement shall commence on ${startDate} and continue until ${endDate}, unless terminated earlier in accordance with Section 9.

3. FEES AND PAYMENT
Client agrees to pay Service Provider: ${rate}

Payment terms:
   a) Invoices shall be submitted monthly (or as agreed) and are due within 30 days;
   b) Disputed invoices must be raised in writing within 10 days of receipt;
   c) Undisputed amounts must be paid by the due date.

4. PERFORMANCE STANDARDS
Service Provider shall perform the Services:
   a) In a professional and workmanlike manner;
   b) In compliance with applicable laws and regulations;
   c) Using qualified personnel with appropriate expertise.

5. CLIENT RESPONSIBILITIES
Client shall:
   a) Provide timely access to necessary information, personnel, and resources;
   b) Review and provide feedback on deliverables within agreed timeframes;
   c) Pay all invoices by the due dates.

6. INTELLECTUAL PROPERTY
Unless otherwise agreed in writing, Service Provider retains all pre-existing intellectual property. Any work product created specifically for Client under this Agreement shall be assigned to Client upon full payment.

7. CONFIDENTIALITY
Each Party agrees to keep confidential all non-public information received from the other Party and to use such information solely for purposes of this Agreement.

8. INDEMNIFICATION
Each Party shall indemnify and hold the other harmless from claims arising from their own negligence, willful misconduct, or breach of this Agreement.

9. TERMINATION
   a) Either party may terminate for convenience with 30 days written notice;
   b) Either party may terminate immediately for material breach not cured within 15 days of written notice.

10. LIMITATION OF LIABILITY
Neither party shall be liable for indirect, incidental, special, or consequential damages. Service Provider's total liability shall not exceed the total fees paid in the 3 months preceding the claim.

11. GOVERNING LAW
This Agreement shall be governed by the laws of ${governing}.

12. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the Parties regarding the Services and supersedes all prior agreements and understandings.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.

${partyA || "[SERVICE PROVIDER]"}               ${partyB || "[CLIENT NAME]"}

Signature: _______________________       Signature: _______________________
Name:      _______________________       Name:      _______________________
Title:     _______________________       Title:     _______________________
Date:      _______________________       Date:      _______________________

---
${DISCLAIMER}`;
}

function templateContractor({ partyA, partyB, jurisdiction, terms }) {
  const {
    scope = "[describe the work or project]",
    rate = "[compensation rate and schedule]",
    startDate = "[start date]",
    endDate = "[end date or project completion]",
    governing = jurisdiction || "Delaware",
  } = terms || {};
  return `INDEPENDENT CONTRACTOR AGREEMENT
=================================

This Independent Contractor Agreement ("Agreement") is entered into as of ${today()} between:

  ${partyA || "[COMPANY NAME]"} ("Company")
and
  ${partyB || "[CONTRACTOR NAME]"} ("Contractor")

1. ENGAGEMENT
Company engages Contractor to perform the following work ("Services"):
   ${scope}

2. TERM
This Agreement commences on ${startDate} and continues until ${endDate} or project completion, whichever is earlier, unless terminated earlier per Section 9.

3. COMPENSATION
Company shall pay Contractor: ${rate}

Contractor shall submit invoices for payment. Invoices are due within 30 days. Contractor is responsible for all taxes on compensation received.

4. INDEPENDENT CONTRACTOR STATUS
Contractor is an independent contractor, not an employee of Company. This Agreement does not create a partnership, joint venture, agency, franchise, or employment relationship.

   a) Contractor controls the means and methods of performing the Services;
   b) Contractor provides their own tools and equipment unless agreed otherwise;
   c) Contractor may engage in other business activities unless they conflict with this Agreement;
   d) Company shall not withhold taxes, provide benefits, or offer workers' compensation to Contractor.

5. WORK PRODUCT AND INTELLECTUAL PROPERTY
All work product, inventions, and materials created by Contractor in performance of the Services shall be "work made for hire" and shall be the exclusive property of Company. Contractor assigns all rights in such work product to Company.

6. CONFIDENTIALITY
Contractor agrees to keep all Company Confidential Information strictly confidential during and after this Agreement, and to use it solely to perform the Services.

7. NON-SOLICITATION
During this Agreement and for 12 months after termination, Contractor shall not directly solicit Company's employees or clients for competitive purposes without prior written consent.

8. WARRANTIES
Contractor warrants that:
   a) Contractor has the right to enter into this Agreement;
   b) The Services will be performed professionally and in compliance with applicable law;
   c) Work product will not infringe third-party intellectual property rights.

9. TERMINATION
   a) Company may terminate this Agreement with 14 days written notice;
   b) Either party may terminate immediately for material breach;
   c) Company shall pay for all Services rendered up to the termination date.

10. LIMITATION OF LIABILITY
Contractor's total liability shall not exceed the total fees paid in the 3 months preceding the claim. Neither party shall be liable for consequential, indirect, or punitive damages.

11. GOVERNING LAW
This Agreement shall be governed by the laws of ${governing}.

12. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the Parties and supersedes all prior understandings regarding the subject matter hereof.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.

${partyA || "[COMPANY NAME]"}                   ${partyB || "[CONTRACTOR NAME]"}

Signature: _______________________       Signature: _______________________
Name:      _______________________       Name:      _______________________
Title:     _______________________       Title:     _______________________
Date:      _______________________       Date:      _______________________

---
${DISCLAIMER}`;
}

function templateGenerate(docType, partyA, partyB, jurisdiction, terms) {
  const ctx = { partyA, partyB, jurisdiction, terms };
  switch (docType) {
    case "nda":                    return { document: templateNDA(ctx),               title: "Non-Disclosure Agreement (NDA)" };
    case "freelance":              return { document: templateFreelance(ctx),          title: "Freelance Contract" };
    case "service":                return { document: templateServiceAgreement(ctx),   title: "Service Agreement" };
    case "contractor":             return { document: templateContractor(ctx),         title: "Independent Contractor Agreement" };
    default:                       return { document: templateNDA(ctx),               title: "Non-Disclosure Agreement (NDA)" };
  }
}

// ── Claude prompt builder ─────────────────────────────────────────────────────

const DOC_LABELS = {
  nda:        "Non-Disclosure Agreement (NDA)",
  freelance:  "Freelance Contract",
  service:    "Service Agreement",
  contractor: "Independent Contractor Agreement",
};

function buildPrompt(docType, partyA, partyB, jurisdiction, terms) {
  const label = DOC_LABELS[docType] || "Legal Agreement";
  const termsStr = terms ? JSON.stringify(terms, null, 2) : "{}";
  return `You are a legal document drafting assistant. Generate a complete, professional ${label} using the details below.

Party A: ${partyA || "[Party A]"}
Party B: ${partyB || "[Party B]"}
Jurisdiction: ${jurisdiction || "Delaware, USA"}
Additional Terms / Details: ${termsStr}

Instructions:
- Use formal legal language appropriate for the document type
- Include all standard clauses for a ${label} (definitions, obligations, payment if applicable, IP if applicable, confidentiality, termination, limitation of liability, governing law, signature blocks)
- Fill in the party names and jurisdiction throughout the document
- Use today's date (${today()}) as the effective date
- End the document with this exact disclaimer on its own line:
${DISCLAIMER}

Output ONLY the document text. No commentary, no markdown code fences.`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { docType, partyA, partyB, jurisdiction, terms } = req.body || {};
  if (!docType) return res.status(400).json({ error: "docType is required." });

  const title = DOC_LABELS[docType] || "Legal Agreement";

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3000,
        system: "You are a professional legal document drafting assistant. Generate clear, complete legal documents. Output only the document text.",
        messages: [{ role: "user", content: buildPrompt(docType, partyA, partyB, jurisdiction, terms) }],
      });
      const document = message.content[0]?.text?.trim() || "";
      return res.status(200).json({ document, title, disclaimer: DISCLAIMER });
    } catch (err) {
      console.error("Claude API error:", err?.message);
      // Fall through to template
    }
  }

  const result = templateGenerate(docType, partyA, partyB, jurisdiction, terms);
  return res.status(200).json({ ...result, disclaimer: DISCLAIMER });
}
