"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ClinicianModel } from "@/lib/clinician-model";
import type { SpecialistView, WidgetId } from "./view-config";
import { MODULE_IDS, WIDGETS, moduleAvailable } from "./view-config";

export function CustomizeViews({
  views, activeView, kind, onClose, onSave,
}: {
  views: SpecialistView[];
  activeView: SpecialistView | null;
  kind: ClinicianModel["patient"]["kind"];
  onClose: () => void;
  onSave: (view: SpecialistView) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(activeView?.id ?? null);
  const [name, setName] = useState(activeView?.name ?? "");
  const [modules, setModules] = useState<WidgetId[]>(activeView?.modules.filter((id) => MODULE_IDS.includes(id)) ?? ["snapshot", "changed", "review", "timeline"]);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);

  function startNew() {
    setEditingId(null);
    setName("");
    setModules(["snapshot", "changed", "review", "timeline"]);
    setError("");
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) { setError("Enter a name for this view."); return; }
    if (!modules.length) { setError("Select at least one module."); return; }
    if (/^(clinician|patient)( view)?$/i.test(cleanName)) { setError("Choose a name different from Clinician or Patient."); return; }
    if (views.some((view) => view.id !== editingId && view.name.toLowerCase() === cleanName.toLowerCase())) {
      setError("A view with this name already exists.");
      return;
    }
    onSave({ id: editingId ?? crypto.randomUUID(), name: cleanName, modules });
  }

  return (
    <dialog ref={dialogRef} className="custom-dialog" aria-labelledby="customize-heading" onClose={(event) => {
      // Dev effect replay can queue a close event after the dialog has reopened.
      if (!event.currentTarget.open) onClose();
    }} onClick={(event) => {
      if (event.target === event.currentTarget) dialogRef.current?.close();
    }}>
      <div className="custom-header">
        <div>
          <p className="kicker">Custom views</p>
          <h2 id="customize-heading">Customize views</h2>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => dialogRef.current?.close()}>Close</button>
      </div>
      {views.length ? (
        <div className="saved-views">
          <span className="muted">Saved views</span>
          {views.map((view) => (
            <button key={view.id} type="button" aria-pressed={editingId === view.id} onClick={() => {
              setEditingId(view.id); setName(view.name); setModules(view.modules.filter((id) => MODULE_IDS.includes(id))); setError("");
            }}>{view.name}</button>
          ))}
          <button type="button" onClick={startNew}>+ New view</button>
        </div>
      ) : null}
      <form onSubmit={save} className="custom-form">
        <label htmlFor="custom-view-name">View name</label>
        <input id="custom-view-name" type="text" maxLength={40} value={name} onChange={(event) => { setName(event.target.value); setError(""); }} placeholder="e.g. Neurology" />
        <div className="custom-form-heading">
          <div>
            <strong>Modules to show</strong>
            <p className="muted">Select the information this view shows. {modules.length} selected.</p>
          </div>
        </div>
        <div className="module-picker">
          {MODULE_IDS.map((id) => {
            const available = moduleAvailable(id, kind);
            return (
              <label key={id} className={`module-option ${modules.includes(id) ? "module-selected" : ""} ${available ? "" : "module-unavailable"}`}>
                <input type="checkbox" checked={modules.includes(id)} disabled={!available} onChange={(event) => {
                  setModules((current) => event.target.checked ? [...current, id] : current.filter((item) => item !== id));
                  setError("");
                }} />
                <span><strong>{WIDGETS[id].name}</strong><small>{available ? WIDGETS[id].desc : "Only available for the asthma tracker"}</small></span>
              </label>
            );
          })}
        </div>
        {error ? <p className="custom-error" role="alert">{error}</p> : null}
        <div className="custom-actions">
          <button className="btn btn-primary" type="submit">{editingId ? "Save changes" : "Create view"}</button>
        </div>
      </form>
    </dialog>
  );
}
