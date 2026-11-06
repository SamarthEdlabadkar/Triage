"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClinicianModel, PatientChoice } from "@/lib/clinician-model";
import { buildChart } from "./chart";
import { ClinicianNav } from "./ClinicianNav";
import { CustomizeViews } from "./CustomizeViews";
import { DayDrawer } from "./shared/DayDrawer";
import { downloadOverviewPdf } from "./shared/overview-download";
import { OverviewTab } from "./tabs/OverviewTab";
import { RecordsTab } from "./tabs/RecordsTab";
import { SummaryTab } from "./tabs/SummaryTab";
import {
  GENERAL_MODULES,
  STORAGE_KEY,
  readSpecialistViews,
  visibleModules,
  type Audience,
  type PageId,
  type SpecialistView,
} from "./view-config";

export function ClinicianApp({ model, patients, initialPage = "overview" }: { model: ClinicianModel; patients: PatientChoice[]; initialPage?: PageId }) {
  const [page, setPage] = useState<PageId>(initialPage);
  const [audience, setAudience] = useState<Audience>("clinician");
  const [specialistViews, setSpecialistViews] = useState<SpecialistView[]>([]);
  const [selectedViewId, setSelectedViewId] = useState("general");
  const [customOpen, setCustomOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showQ, setShowQ] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloadingOverview, setDownloadingOverview] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const days = model.days;
  const chart = useMemo(() => buildChart(days), [days]);
  const selectedIndex = selectedDate == null ? -1 : model.history.findIndex((item) => item.date === selectedDate);
  const selected = selectedIndex < 0 ? null : model.history[selectedIndex];
  const selectedSpecialistView = specialistViews.find((item) => item.id === selectedViewId);
  const modules = selectedSpecialistView?.modules ?? GENERAL_MODULES;

  useEffect(() => {
    const timer = window.setTimeout(() => setSpecialistViews(readSpecialistViews()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page, audience, selectedViewId]);

  function openDay(index: number | null) {
    if (index == null || index < 0 || index >= days.length) return;
    setSelectedDate(days[index].date);
  }

  function openDate(date: string) {
    if (model.history.some((item) => item.date === date)) setSelectedDate(date);
  }

  function saveView(next: SpecialistView) {
    const views = specialistViews.some((item) => item.id === next.id)
      ? specialistViews.map((item) => item.id === next.id ? next : item)
      : [...specialistViews, next];
    setSpecialistViews(views);
    setAudience("clinician");
    setSelectedViewId(next.id);
    setPage("overview");
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(views)); } catch { /* Browser storage may be unavailable. */ }
    setCustomOpen(false);
  }

  function downloadOverview() {
    setDownloadError("");
    setDownloadingOverview(true);
    const visible = visibleModules(modules, model);
    void downloadOverviewPdf(model, visible, selectedSpecialistView?.name ?? "General")
      .catch(() => setDownloadError("Overview PDF could not be created."))
      .finally(() => setDownloadingOverview(false));
  }

  return (
    <div className="shell">
      <ClinicianNav
        model={model}
        patients={patients}
        page={page}
        audience={audience}
        selectedViewId={selectedViewId}
        views={specialistViews}
        downloadingOverview={downloadingOverview}
        downloadError={downloadError}
        onDownloadOverview={downloadOverview}
        onPageChange={(next) => { setPage(next); setSelectedDate(null); }}
        onViewChange={(nextAudience, viewId) => { setAudience(nextAudience); setSelectedViewId(viewId); setPage("overview"); }}
        onCustomize={() => setCustomOpen(true)}
      />

      <main className="page-main">
        {page === "overview" ? (
          <OverviewTab
            model={model}
            chart={chart}
            audience={audience}
            modules={modules}
            showQ={showQ}
            onToggleQuality={() => setShowQ((value) => !value)}
            onOpenDay={openDay}
            onOpenDate={openDate}
          />
        ) : null}
        {page === "records" ? <RecordsTab key={`${model.patient.file}:${model.patient.trackerId}`} model={model} onOpen={openDay} /> : null}
        {page === "summary" ? (
          <SummaryTab model={model} copied={copied} onCopy={() => {
            navigator.clipboard?.writeText(model.summaryText).catch(() => undefined);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          }} />
        ) : null}
      </main>

      {selected ? (
        <DayDrawer
          day={selected}
          fromRecords={page === "records"}
          onClose={() => setSelectedDate(null)}
          onPrev={() => selectedIndex > 0 && setSelectedDate(model.history[selectedIndex - 1].date)}
          onNext={() => selectedIndex < model.history.length - 1 && setSelectedDate(model.history[selectedIndex + 1].date)}
        />
      ) : null}
      {customOpen ? (
        <CustomizeViews
          views={specialistViews}
          activeView={audience === "clinician" ? selectedSpecialistView ?? null : null}
          model={model}
          onClose={() => setCustomOpen(false)}
          onSave={saveView}
        />
      ) : null}
    </div>
  );
}
