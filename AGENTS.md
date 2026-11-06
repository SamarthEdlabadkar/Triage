# Coding context

## Workspace

This repository is for the SMART@Home clinician data-view challenge at the Digital Health Hackathon. Use the SMART@Home brief as the source of truth for requirements, and ask clinicians about unresolved workflow and clinical questions. The folder name does not indicate an emergency-department triage product.

The source materials are checked into `Tdocs/`:

- `Tdocs/SMARTHome hackathon brief.pdf` describes the clinician data-view challenge and its data model.
- `Tdocs/All project one-pagers.pdf` provides background on the hackathon opportunities.
- `Tdocs/FlightPlan hackathon brief.pdf` is retained as background reference only; SMART@Home is the active project focus.
- `../epic-ui-examples/` contains standalone, sample-data HTML screens and shared `styles.css`. These are original EHR-inspired examples, not official Epic assets or a working integration.
- `../epic-ui-references/` contains reference directories for mobile, clinician chart, and patient-app concepts.

Inspect this repository's actual source, dependencies, and scripts before choosing implementation patterns. Do not imply an existing integration or infrastructure that is not present. Preserve source briefs and reference examples unless changes are requested.

## Challenge context

Design a clinician view of patient-reported home monitoring that supports a quick pre-visit review and discussion with the patient. Surface meaningful trends, symptoms, medication reporting, and device data in context, with flexibility for different specialties and trackers.

The brief describes one nested patient JSON document with `dailyLogs`, tracker responses, medication administrations, medications, devices and baseline readings, treatment plan, and badges. Responses can repeat on a day, fields can be missing, values are stored as text, question wording is in tracker definitions, and medications are linked by IDs. Preserve uncertainty and provenance: a reported dose is not a verified dose, missing data is not a negative finding, and aggregation rules must be explicit. The current flow into the clinician view is one-way and does not write to the medical record.

## Working conventions

- Use invented or appropriately de-identified examples only. Never put real patient information into an AI tool; avoid real names, medical record numbers, dates of birth, or real patient screenshots.
- Treat clinical thresholds, alerts, treatment recommendations, and ambiguous data interpretations as unverified unless supplied by the project or clinicians. Label sample data and assumptions clearly.
- Prioritize readable, accessible interfaces, clear units and timestamps, and cues beyond color alone. Show missing or uncertain data honestly.
- Keep provenance visible: distinguish patient-reported values from verified clinical data, and explain any grouping, parsing, normalization, or aggregation.
- For changes to neighboring static examples, retain their shared CSS and simple browser-native structure unless the task calls for a different approach. Verify affected pages in a browser and test interactions and responsive layouts when applicable.
