# Application Flow: PharmaGuard AI

## 1. ENTRY POINTS
- **Direct Access:** Users land on the root URL (e.g., `pharmaguard-ai.vercel.app`).
- **Authentication:** No login or OAuth required. Immediate access to clinical tools.
- **Initial State:** The `VCFUpload` and `DrugSelector` components are visible and ready for input.

---

## 2. CORE USER FLOWS

### Flow 1: Complete Analysis (Happy Path)
1.  **Page Load:** The app initializes in an `idle` state.
2.  **VCF Upload:** User drags a `.vcf` file into the `VCFUpload` zone.
    - *Validation (Client):* Extension must be `.vcf`. Size must be < 5MB.
    - *State:* `file` is set; the file name is displayed.
3.  **Drug Selection:** User selects between 1 and 6 drugs in `DrugSelector`.
    - *State:* `selectedDrugs` array is updated.
4.  **Analysis Trigger:** User clicks "Initialize Analysis".
    - *Action:* `App.tsx` transitions `phase` through `parsing` → `mapping` → `reasoning`.
    - *UI:* `ProcessingHUD` appears with a 3-stage progress indicator.
5.  **Data Processing:**
    - `vcfParser.ts` extracts variants and calculates quality metrics.
    - `phenotypeEngine.ts` determine diplotypes and phenotypes.
    - `ruleEngine.ts` applies CPIC guidelines for risk labels.
    - `geminiService.ts` fetches clinical explanations.
6.  **Results Render:** `phase` becomes `complete`.
    - *UI:* `ResultDashboard` replaces the input panel.
    - *UI:* Per-drug risk cards appear with color-coded borders.
7.  **Interaction:** User toggles "Clinician / Patient" mode to adjust text complexity.
8.  **Output:**
    - User clicks "Download JSON" to save the `PharmaGuardResult[]` payload.
    - User clicks "Copy JSON" to copy the raw data to clipboard.

### Flow 2: Invalid VCF Upload
1.  **Wrong Extension:** User uploads `.txt` or `.png`.
    - *Response:* Instant red banner: "Invalid file type. Please upload a .vcf file."
2.  **File Too Large:** User uploads a 10MB VCF.
    - *Response:* Instant red banner: "File too large. Max size is 5MB per PS1 specification."
3.  **Bad Header:** User uploads VCF without `##fileformat=VCFv4.2`.
    - *Response:* "Sequence mapping failed. Ensure VCF headers follow v4.2 standards."

### Flow 3: Partial/Missing Annotations
1.  **Missing Genes:** VCF is valid but contains no records for `CYP2D6`.
2.  **System Response:** `vcfParser.ts` identifies `CYP2D6` as an `assumed_wildtype_genes`.
3.  **UI Feedback:** A yellow "Genomic Match Score" warning shows in the left rail of the `ResultDashboard` indicating "target loci mapped" vs assumed wild-types.

### Flow 4: What-If Drug Switch (P1)
1.  **Post-Analysis:** From the `ResultDashboard`, user clicks "Reset Analysis".
2.  **Modified Input:** User keeps the same VCF but changes the drug selection.
3.  **Re-run:** Re-clicks "Initialize Analysis" to see updated risk comparisons.

---

## 3. NAVIGATION MAP (Component State Tree)
```
App (App.tsx)
├── ActionHeader
│   ├── App Title & Version Tag
│   ├── Patient ID (e.g., PAT_RIFT_X9Z2K4)
│   ├── View Mode Toggle (Clinician / Patient)
│   └── Reset Button
├── Main Content Container
│   ├── IF (idle/analyzing):
│   │   ├── VCFUpload.tsx (Drag-drop / Picker)
│   │   ├── DrugSelector.tsx (Searchable 6-drug grid)
│   │   └── ProcessingHUD.tsx (3-phase pipeline animation)
│   └── IF (complete):
│       └── ResultDashboard.tsx
│           ├── LeftRail Navigation
│           │   ├── Precision Score HUD
│           │   └── Per-drug Button Nav (with Risk Icon)
│           └── DetailPanel (DrugResultCard.tsx)
│               ├── StatusBadge & Severity Label
│               ├── Clinical Recommendation Box
│               ├── AI Reasoning (Sparkles icon, formatted text)
│               ├── MetabolicTimeline (Node flow)
│               └── DetectedVariants (Accordion)
└── Sticky Footer (Medical Disclaimer)
```

---

## 4. SCREEN INVENTORY

| Component | Purpose | State Variants |
| :--- | :--- | :--- |
| `VCFUpload` | Capture genomic sequence file | Idle, Drag-Active, Valid-File, Error |
| `ProcessingHUD` | Visual feedback for 3-phase AI pipeline | Parsing, Mapping, Reasoning |
| `DrugResultCard` | Display risks, recs, and AI explanations | Safe, Adjust, Toxic, Ineffective, Unknown |
| `MetabolicTimeline` | Show biochemical pathway logic | Sequential Node Reveal |
| `PrivacyModal` | Explain data sovereignty and local processing | Open, Closed |

---

## 5. DECISION POINTS (IF-THEN Logic)

- **IF** `file === null` **OR** `selectedDrugs.length === 0` **THEN** Disable "Initialize Analysis".
- **IF** `vcf_parsing_success === false` **THEN** Transition to `error` phase, show red banner.
- **IF** `risk_label === "Safe"` **THEN** Apply Green border (`#22C55E`) and check icon.
- **IF** `risk_label === "Adjust Dosage"` **THEN** Apply Yellow border (`#F59E0B`) and alert icon.
- **IF** `risk_label === "Toxic"` **THEN** Apply Red border (`#EF4444`) and X icon.
- **IF** `viewMode === "patient"` **THEN** Map phenotypes to plain English (e.g., "Slow metabolizer").
- **IF** `causalVariant.is_causal === true` **THEN** Render pulsing "Zap" icon in variant table.

---

## 6. ERROR HANDLING

| Error Case | User-Facing Message | Recovery Action |
| :--- | :--- | :--- |
| **Invalid Extension** | "Invalid file type. Please upload a .vcf file." | Auto-reset upload zone. |
| **Oversized File** | "File too large. Max size is 5MB..." | Block `onFileSelect` trigger. |
| **Parsing Error** | "Sequence mapping failed. Ensure VCF headers follow v4.2 standards." | Provide "Reset" button to retry. |
| **Gemini Timeout** | "Generating structured reasoning via Gemini Flash-3... (using fallback)" | System automatically injects `buildFallbackExplanation`. |

---

## 7. RESPONSIVE BEHAVIOR
- **Desktop (>= 1024px):** Master-Detail view with fixed left rail navigation. Two-column grid for drug selection.
- **Tablet/Mobile:** Vertical stack. `ResultDashboard` sidebar moves to the top as a scrollable horizontal nav or dropdown. Full-width cards for all results.

---

## 8. ANIMATIONS & TRANSITIONS
- **Stage Swap:** `AnimatePresence` with `opacity` + `y-offset` (400ms) for switching between Inputs and Results.
- **Processing HUD:** Pulsing microscope icon (800ms) + Sequential step checkmarks.
- **Metabolic Timeline:** Staggered child reveal (150ms delay per node) + vertical line scale-down.
- **Risk Badge:** "Snap" scale-in (150ms) when a card is selected to emphasize the clinical outcome.
- **rsID Tooltip:** Instant background-color transition (80ms) when hovering linked variants.
