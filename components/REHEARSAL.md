# SMART@Home walkthrough rehearsal

- Starting point: Stageshow `chart-scrub` for a measured cursor interaction and a single cropped product window. The final scene uses the kit's `Stage` and `Window`.
- Story: overview calendar → one reported day and its provenance → source records → visit discussion points.
- Product adaptation: SMART@Home's magenta, green, cool gray surfaces, pill navigation, snapshot, reported-day calendar, records, and summary language.
- Data: invented February 2026 example. Six missing responses, five symptom days, and 22 of 28 tracker days agree across the visible views. The medication count is illustrative and explicitly labeled as marked taken.
- Verified: production build and TypeScript check; focused ESLint check; browser inspection at a narrow viewport of the opening, calendar, detail, and final summary. The final result remained visible and readable.
- Not checked: Stageshow `film.mjs --gate` contact sheets and a full desktop loop capture. The Playwright CLI did not start in this environment. The copied kit has lint findings under the host's stricter React and TypeScript rules; focused lint on the walkthrough source passes.
