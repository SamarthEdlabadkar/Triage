"use client";

import { useRouter } from "next/navigation";
import type { ClinicianModel, PatientChoice } from "@/lib/clinician-model";
import type { Audience, PageId, SpecialistView } from "./view-config";

const PAGES: Array<{ id: PageId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "records", label: "Records" },
  { id: "summary", label: "Visit summary" },
];

function href(file: string, page: PageId, trackerId?: string) {
  const params = new URLSearchParams({ patient: file });
  if (page !== "overview") params.set("page", page);
  if (trackerId) params.set("tracker", trackerId);
  return `/?${params.toString()}`;
}

export function ClinicianNav({
  model, patients, page, audience, selectedViewId, views, onPageChange, onViewChange, onCustomize,
}: {
  model: ClinicianModel;
  patients: PatientChoice[];
  page: PageId;
  audience: Audience;
  selectedViewId: string;
  views: SpecialistView[];
  onPageChange: (page: PageId) => void;
  onViewChange: (audience: Audience, viewId: string) => void;
  onCustomize: () => void;
}) {
  const router = useRouter();
  const trackers = patients.find((patient) => patient.file === model.patient.file)?.trackers ?? [];

  return (
    <header className="app-header">
      <div className="brand-cluster">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-accent)", display: "grid", placeItems: "center", color: "var(--color-bg)", fontWeight: 700 }}>S</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 21 }}>SMART@Home</div>
        </div>
        <div className="patient-form">
          <label className="muted" htmlFor="patient">Patient</label>
          <select
            id="patient"
            className="select"
            value={model.patient.file}
            onChange={(event) => {
              const file = event.target.value;
              if (file && file !== model.patient.file) router.push(href(file, page));
            }}
          >
            {patients.map((patient) => <option key={patient.file} value={patient.file}>{patient.name}</option>)}
          </select>
        </div>
      </div>

      <nav className="tabs" aria-label="Pages">
        {PAGES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className="tab"
            aria-current={page === id ? "page" : undefined}
            onClick={() => onPageChange(id)}
            style={{ background: page === id ? "var(--color-text)" : "transparent", color: page === id ? "var(--color-bg)" : "var(--color-text)" }}
          >{label}</button>
        ))}
      </nav>

      <div className="layout-tools" role="group" aria-label="Overview layout">
        <span className="muted" style={{ fontSize: 12 }}>View</span>
        {(["clinician", "patient"] as const).map((id) => {
          const active = audience === id && (id === "patient" || selectedViewId === "general");
          return (
            <button
              key={id}
              type="button"
              className="preset"
              aria-pressed={active}
              onClick={() => onViewChange(id, id === "clinician" ? "general" : selectedViewId)}
              style={{ background: active ? "var(--color-accent)" : "transparent", color: active ? "var(--color-bg)" : "var(--color-text)" }}
            >{id === "clinician" ? "Clinician" : "Patient"}</button>
          );
        })}
        {views.map((item) => {
          const active = audience === "clinician" && selectedViewId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className="preset"
              aria-pressed={active}
              onClick={() => onViewChange("clinician", item.id)}
              style={{ background: active ? "var(--color-accent)" : "transparent", color: active ? "var(--color-bg)" : "var(--color-text)" }}
            >{item.name}</button>
          );
        })}
        <button className="btn btn-secondary" type="button" onClick={onCustomize}>Customize</button>
      </div>

      <div className="header-tools">
        {trackers.length > 1 ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label className="muted" htmlFor="tracker" style={{ fontSize: 12 }}>Tracker</label>
            <select
              id="tracker"
              className="select"
              value={model.patient.trackerId}
              onChange={(event) => {
                const trackerId = event.target.value;
                if (trackerId && trackerId !== model.patient.trackerId) router.push(href(model.patient.file, page, trackerId));
              }}
            >
              {trackers.map((tracker) => <option key={tracker.id} value={tracker.id}>{tracker.name}</option>)}
            </select>
          </div>
        ) : null}
      </div>
    </header>
  );
}
