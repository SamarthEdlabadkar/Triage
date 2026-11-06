"use client";
import { useState } from "react";
import type { ClinicianModel } from "@/lib/clinician-model";
import { download } from "../shared/utils";

export function RecordsTab({ model, onOpen }: { model: ClinicianModel; onOpen: (index: number) => void }) {
  const [filters, setFilters] = useState({ date: "", feeling: "", symptoms: "", med: "", fev1: "", entries: "" });
  const days = [...model.days].reverse().filter((day) => day.entries > 0);
  const showFeeling = days.some((day) => Boolean(day.feeling));
  const showMed = Boolean(model.dailyMedName) && days.some((day) => day.slots.length > 0);
  const showFev1 = days.some((day) => day.fev1 != null);
  const feelings = [...new Set(days.map((day) => day.feeling).filter((value): value is string => Boolean(value)))].sort();
  const medStatuses = new Set(days.map((day) => !day.slots.length ? "unscheduled" : day.slots.every((slot) => slot === "taken") ? "all" : day.slots.some((slot) => slot === "taken") ? "some" : "none"));
  const fev1Statuses = new Set(days.map((day) => day.fev1 == null ? "missing" : day.fevOk ? "passed" : "flagged"));
  const activeFilters = [filters.date, showFeeling && filters.feeling, filters.symptoms, showMed && filters.med, showFev1 && filters.fev1, filters.entries].filter(Boolean).length;
  const filteredDays = days.filter((day) => {
    const medStatus = !day.slots.length ? "unscheduled" : day.slots.every((slot) => slot === "taken") ? "all" : day.slots.some((slot) => slot === "taken") ? "some" : "none";
    const fev1Status = day.fev1 == null ? "missing" : day.fevOk ? "passed" : "flagged";
    return `${day.dow} ${day.short}`.toLowerCase().includes(filters.date.toLowerCase())
      && (!showFeeling || !filters.feeling || (day.feeling ?? "none") === filters.feeling)
      && (day.symptoms.join(", ") || "none").toLowerCase().includes(filters.symptoms.toLowerCase())
      && (!showMed || !filters.med || medStatus === filters.med)
      && (!showFev1 || !filters.fev1 || fev1Status === filters.fev1)
      && (!filters.entries || day.entries === Number(filters.entries));
  });
  const setFilter = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  return (
    <article className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 21 }}>Daily records</h3>
        <span className="muted" style={{ fontSize: 13 }}>Select a row for submissions, doses, and spirometer blows</span>
        <button className="btn btn-secondary" type="button" style={{ marginLeft: "auto" }} onClick={() => download(`${model.patient.file.replace(".json", "")}-daily.csv`, model.csv, "text/csv")}>Download CSV</button>
      </div>
      <div className="records-tools">
        <details className="records-filter-panel">
          <summary>Filters{activeFilters ? ` (${activeFilters})` : ""}</summary>
          <div className="records-filters">
            <label>Date<input aria-label="Filter by date" value={filters.date} onChange={(event) => setFilter("date", event.target.value)} placeholder="e.g. Nov 5" /></label>
            {showFeeling ? <label>Feeling<select aria-label="Filter by feeling" value={filters.feeling} onChange={(event) => setFilter("feeling", event.target.value)}><option value="">Any feeling</option>{feelings.map((feeling) => <option key={feeling} value={feeling}>{feeling}</option>)}{days.some((day) => !day.feeling) ? <option value="none">No answer</option> : null}</select></label> : null}
            <label>Symptoms<input aria-label="Filter by symptoms" value={filters.symptoms} onChange={(event) => setFilter("symptoms", event.target.value)} placeholder="Search symptoms" /></label>
            {showMed ? <label>Daily med<select aria-label="Filter by daily med" value={filters.med} onChange={(event) => setFilter("med", event.target.value)}><option value="">Any status</option>{medStatuses.has("all") ? <option value="all">All administrations recorded</option> : null}{medStatuses.has("some") ? <option value="some">Some administrations recorded</option> : null}{medStatuses.has("none") ? <option value="none">No administration recorded</option> : null}{medStatuses.has("unscheduled") ? <option value="unscheduled">Not scheduled</option> : null}</select></label> : null}
            {showFev1 ? <label>FEV1<select aria-label="Filter by FEV1" value={filters.fev1} onChange={(event) => setFilter("fev1", event.target.value)}><option value="">Any result</option>{fev1Statuses.has("passed") ? <option value="passed">Passed check</option> : null}{fev1Statuses.has("flagged") ? <option value="flagged">Flagged check</option> : null}{fev1Statuses.has("missing") ? <option value="missing">No reading</option> : null}</select></label> : null}
            <label>Entries<input aria-label="Filter by entries" type="number" min="1" value={filters.entries} onChange={(event) => setFilter("entries", event.target.value)} placeholder="Count" /></label>
            <button className="btn btn-ghost" type="button" onClick={() => setFilters({ date: "", feeling: "", symptoms: "", med: "", fev1: "", entries: "" })}>Clear filters</button>
          </div>
        </details>
        {showMed ? <span className="muted" style={{ fontSize: 12 }}>✓ administration recorded · ✕ none recorded</span> : null}
      </div>
      {/* Explicit roles: the phone layout restyles these rows as stacked cards, which drops native table semantics. */}
      <div className="scroll-x">
        <table className="table records-table" role="table">
          <thead role="rowgroup">
            <tr role="row">
              <th role="columnheader" className="rec-date">Date</th>{showFeeling ? <th role="columnheader" className="rec-feeling">Feeling</th> : null}<th role="columnheader" className="rec-symptoms">Symptoms</th>{showMed ? <th role="columnheader" className="rec-med">Daily med<small className="record-med-name">{model.dailyMedName}</small></th> : null}{showFev1 ? <th role="columnheader" className="rec-fev1">FEV1</th> : null}<th role="columnheader" className="rec-entries">Entries</th>
            </tr>
          </thead>
          <tbody role="rowgroup">
            {filteredDays.map((day) => (
              <tr key={day.date} role="row" tabIndex={0} aria-label={`Open details for ${day.long}`} onClick={() => onOpen(model.days.indexOf(day))} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(model.days.indexOf(day)); } }} style={{ cursor: "pointer" }}>
                <td role="cell" className="rec-date" style={{ fontWeight: 700 }}>{day.dow} {day.short}</td>
                {showFeeling ? <td role="cell" className="rec-feeling" data-label="Feeling">{day.feeling ?? "—"}</td> : null}
                <td role="cell" className="rec-symptoms rec-wide" data-label="Symptoms">{day.logged ? day.symptoms.join(", ") || "None" : "—"}</td>
                {showMed ? <td role="cell" className="rec-med" data-label="Daily med" aria-label={`${model.dailyMedName}: ${day.slots.length ? day.slots.map((slot, index) => `dose ${index + 1} ${slot === "taken" ? "recorded" : "not recorded"}`).join(", ") : "not scheduled"}`}>
                  {day.slots.length ? day.slots.map((slot) => (slot === "taken" ? "✓" : "✕")).join(" / ") : "—"}
                </td> : null}
                {showFev1 ? <td role="cell" className="rec-fev1" data-label="FEV1">{day.fev1 == null ? "—" : `${day.fev1.toFixed(2)} L${day.fevOk ? "" : " · flagged"}`}</td> : null}
                <td role="cell" className="rec-entries" data-label="Entries">{day.entries}</td>
              </tr>
            ))}
            {filteredDays.length === 0 ? <tr role="row"><td role="cell" colSpan={3 + Number(showFeeling) + Number(showMed) + Number(showFev1)}>No records match these filters.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </article>
  );
}
