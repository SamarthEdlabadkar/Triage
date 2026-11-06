"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ClinicianModel } from "@/lib/clinician-model";
import type { SpecialistView, WidgetId } from "./view-config";
import { MODULE_IDS, REVIEW_MODULES, TRACKER_MODULES, WIDGETS, moduleAvailable } from "./view-config";

export function CustomizeViews({
  views, activeView, model, onClose, onSave,
}: {
  views: SpecialistView[];
  activeView: SpecialistView | null;
  model: ClinicianModel;
  onClose: () => void;
  onSave: (view: SpecialistView) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(activeView?.id ?? null);
  const [name, setName] = useState(activeView?.name ?? "");
  const [modules, setModules] = useState<WidgetId[]>(activeView?.modules.filter((id) => MODULE_IDS.includes(id)) ?? ["snapshot", "changed", "review", "timeline"].filter((id): id is WidgetId => moduleAvailable(id as WidgetId, model)));
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
    setModules(["snapshot", "changed", "review", "timeline"].filter((id): id is WidgetId => moduleAvailable(id as WidgetId, model)));
    setError("");
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) { setError("Enter a name for this view."); return; }
    if (!modules.some((id) => moduleAvailable(id, model))) { setError("Select at least one available module."); return; }
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
            <p className="muted">Select the information this view shows. {modules.filter((id) => moduleAvailable(id, model)).length} available modules selected.</p>
          </div>
        </div>
        {([{ title: "SMART@Home trackers", ids: TRACKER_MODULES }, { title: "Review panels", ids: REVIEW_MODULES }] as const).filter((group) => group.ids.some((id) => moduleAvailable(id, model))).map((group) => (
        <section className="module-group" key={group.title}>
          <h3>{group.title}</h3>
          <div className="module-picker">
          {group.ids.filter((id) => moduleAvailable(id, model)).map((id) => {
            return (
              <label key={id} className={`module-option ${modules.includes(id) ? "module-selected" : ""}`}>
                <input type="checkbox" checked={modules.includes(id)} onChange={(event) => {
                  setModules((current) => event.target.checked ? [...current, id] : current.filter((item) => item !== id));
                  setError("");
                }} />
                <span><strong>{WIDGETS[id].name}</strong><small>{WIDGETS[id].desc}</small></span>
              </label>
            );
          })}
          </div>
        </section>
        ))}
        {error ? <p className="custom-error" role="alert">{error}</p> : null}
        <div className="custom-actions">
          <button className="btn btn-primary" type="submit">{editingId ? "Save changes" : "Create view"}</button>
        </div>
      </form>
    </dialog>
  );
}
