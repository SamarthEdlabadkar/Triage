(function () {
const END = '2026-11-05';
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOWS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const toD = s => new Date(s + 'T12:00:00Z');
const addDays = (s, n) => { const d = toD(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const short = s => { const d = toD(s); return MON[d.getUTCMonth()] + ' ' + d.getUTCDate(); };
const longD = s => { const d = toD(s); return DOWS[d.getUTCDay()] + ', ' + MONL[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear(); };
const diff = (a, b) => Math.round((toD(b) - toD(a)) / 864e5);
const FEELN = ['Great','Good','Okay','Bad','Terrible'];
const pct = (a, b) => b ? Math.round(a / b * 100) : null;
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const kindOf = trk => trk.id.startsWith('mig') ? 'mig' : 'asthma';

function index(data) { data.patients.forEach(P => { P.idx = {}; P.days.forEach(d => P.idx[d.d] = d); }); return data; }

function buildDays(P, trk, end, n) {
  const kind = kindOf(trk), tag = kind === 'mig' ? 'M' : 'A';
  const daily = P.meds.filter(m => m.daily && !m.archived && m.cond.toLowerCase().includes(kind === 'mig' ? 'migraine' : 'asthma'));
  return Array.from({ length: n }, (_, k) => {
    const d = addDays(end, k - n + 1), r = P.idx[d] || {}, subs = (r.subs || []).filter(s => s[1] === tag);
    const active = d >= trk.assigned, logged = subs.some(s => s[2]);
    const o = { d, k, short: short(d), num: toD(d).getUTCDate(), dowN: toD(d).getUTCDay(), active, logged, subs, blank: subs.filter(s => !s[2]).length, r, iss: r.iss || [] };
    const R = logged ? r : {};
    if (kind === 'mig') Object.assign(o, { head: R.head, pain: R.pain, hours: R.hours, aura: R.aura, mtrig: R.mtrig || [] });
    else Object.assign(o, { zone: R.zone, feel: R.feel, syms: R.syms || [], puffs: R.puffs, night: R.night, school: R.school, br: R.br, trig: R.trig, conflict: R.conflict, sp: r.sp });
    o.doses = daily.map(m => { if (!active) return null; const x = r.doses && r.doses[m.id]; const t = Math.min(x ? x.t : 0, m.perDay), s = Math.min(x ? x.s : 0, m.perDay - t); return { m, t, s, u: m.perDay - t - s, times: x ? x.times : [] }; });
    return o;
  });
}

function stats(days, kind) {
  const A = days.filter(d => d.active), L = A.filter(d => d.logged);
  const s = { kind, active: A.length, logged: L.length, blanks: A.reduce((n, d) => n + d.blank, 0), gaps: A.filter(d => !d.logged).length, issueDays: A.filter(d => d.iss.length) };
  let t = 0, sk = 0, u = 0; A.forEach(d => d.doses.forEach(x => { if (x) { t += x.t; sk += x.s; u += x.u; } }));
  s.dose = { t, s: sk, u, n: t + sk + u, pct: pct(t, t + sk + u) };
  s.skippedDays = A.filter(d => d.doses.some(x => x && x.s));
  if (kind === 'mig') {
    s.headDays = L.filter(d => d.head === 1).length;
    s.pain = mean(L.filter(d => d.head === 1 && d.pain != null).map(d => d.pain));
    s.hours = mean(L.filter(d => d.head === 1 && d.hours != null).map(d => d.hours));
    s.auraDays = L.filter(d => d.aura === 1).length;
    const tc = {}; L.forEach(d => d.mtrig.forEach(x => tc[x] = (tc[x] || 0) + 1)); s.top = Object.entries(tc).sort((a, b) => b[1] - a[1]);
  } else {
    s.symDays = L.filter(d => d.syms.length).length;
    const pz = L.filter(d => d.puffs != null); s.puffs = pz.reduce((a, d) => a + d.puffs, 0); s.puffRate = pz.length ? s.puffs / pz.length : null;
    s.night = L.filter(d => d.night === 1).length; s.school = L.filter(d => d.school === 1).length;
    s.zG = L.filter(d => d.zone === 'G').length; s.zY = L.filter(d => d.zone === 'Y').length; s.zR = L.filter(d => d.zone === 'R').length;
    s.conflicts = L.filter(d => d.conflict);
    const sc = {}; L.forEach(d => d.syms.forEach(x => sc[x] = (sc[x] || 0) + 1)); s.top = Object.entries(sc).sort((a, b) => b[1] - a[1]);
    const sp = days.filter(d => d.sp), rel = sp.filter(d => d.sp.rel);
    s.spDays = sp.length; s.relDays = rel.length; s.qDays = sp.length - rel.length;
    s.fev = mean(rel.map(d => d.sp.pct));
    const last = rel[rel.length - 1]; s.latest = last ? { pct: last.sp.pct, L: last.sp.L, d: last.short, k: last.k } : null;
    s.blowsC = sp.reduce((n, d) => n + d.sp.nC, 0); s.blowsN = sp.reduce((n, d) => n + d.sp.blows.length, 0);
  }
  return s;
}

function lastEntry(P) { const d = [...P.days].reverse().find(x => (x.subs || []).some(s => s[2])); return d ? d.d : null; }

// Weekly trends over the last 12 weeks
function trends(P, trk) {
  const kind = kindOf(trk), W = 12, days = buildDays(P, trk, END, W * 7);
  const weeks = Array.from({ length: W }, (_, w) => days.slice(w * 7, w * 7 + 7));
  const defs = kind === 'mig' ? [
    { key: 'head', label: 'Headache days', unit: ' / wk', better: 'down', f: (s) => s.logged ? s.headDays : null, max: 7, dec: 0 },
    { key: 'pain', label: 'Pain on headache days', unit: ' / 10', better: 'down', f: s => s.pain, max: 10, dec: 1 },
    { key: 'dose', label: 'Preventive doses taken', unit: '%', better: 'up', f: s => s.dose.n ? s.dose.pct : null, max: 100, dec: 0 },
    { key: 'logged', label: 'Days logged', unit: ' / 7', better: 'up', f: s => s.active ? s.logged : null, max: 7, dec: 0 },
  ] : [
    { key: 'sym', label: 'Symptom days', unit: ' / wk', better: 'down', f: s => s.logged ? s.symDays : null, max: 7, dec: 0 },
    { key: 'puffs', label: 'Rescue puffs per day', unit: '', better: 'down', f: s => s.puffRate, max: null, dec: 1 },
    { key: 'dose', label: 'Controller doses taken', unit: '%', better: 'up', f: s => s.dose.n ? s.dose.pct : null, max: 100, dec: 0 },
    { key: 'fev', label: 'FEV1 % predicted', unit: '%', better: 'up', f: s => s.fev, max: null, dec: 0, ref: 80 },
    { key: 'night', label: 'Nights woken', unit: ' / wk', better: 'down', f: s => s.logged ? s.night : null, max: 7, dec: 0 },
    { key: 'logged', label: 'Days logged', unit: ' / 7', better: 'up', f: s => s.active ? s.logged : null, max: 7, dec: 0 },
  ];
  return { weeks: weeks.map(w => ({ from: w[0].short, to: w[6].short, days: w })), series: defs.map(df => ({ ...df, vals: weeks.map(w => { const v = df.f(stats(w, kind)); return v == null ? null : v; }) })) };
}

function review(P, trk, days, s) {
  const R = [], kind = kindOf(trk);
  const recent = f => { for (let k = days.length - 1; k >= 0; k--) if (f(days[k])) return k; return null; };
  if (!s.logged && s.active) { const le = lastEntry(P); R.push({ sev: 'Gap', cls: 'tag-accent', title: 'No entries in this period', detail: le ? 'Last entry ' + short(le) : 'No entries since enrolment', k: null }); }
  if (kind === 'asthma') {
    if (s.zR) { const k = recent(d => d.zone === 'R'); R.push({ sev: 'Red zone', cls: 'tag-accent', title: plural(s.zR, 'red-zone day'), detail: 'Most recent ' + days[k].short + (s.zY ? ' · plus ' + plural(s.zY, 'yellow day') : ''), k }); }
    s.conflicts.slice(-2).reverse().forEach(d => R.push({ sev: 'Conflict', cls: 'tag-accent', title: d.conflict, detail: d.short + ' · ' + plural(d.subs.length, 'submission'), k: d.k }));
    if (s.conflicts.length > 2) R.push({ sev: 'Conflict', cls: 'tag-accent', title: (s.conflicts.length - 2) + ' more days with conflicting answers', detail: 'See timeline', k: s.conflicts[0].k });
    if (s.night >= 4) { const k = recent(d => d.night === 1); R.push({ sev: 'Night', cls: 'tag-accent', title: 'Woken at night on ' + plural(s.night, 'day'), detail: 'Most recent ' + days[k].short, k }); }
    if (s.blowsC) { const k = recent(d => d.sp && d.sp.nC); R.push({ sev: 'Device', cls: 'tag-neutral', title: plural(s.blowsC, 'blow') + ' marked accepted but failed the quality check', detail: 'Shown as questionable and left out of trends', k }); }
    const pl = P.plan;
    if (pl) {
      const ex = pl.expiration, rt = pl.retestTime && pl.retestTime.slice(0, 10);
      if (pl.status === 'Expired' || ex < '2026-11-06') R.push({ sev: 'Plan', cls: 'tag-outline', title: 'Action plan expired', detail: 'Expired ' + short(ex) + ', ' + ex.slice(0, 4), k: null });
      else if (diff('2026-11-06', ex) <= 45) R.push({ sev: 'Plan', cls: 'tag-outline', title: 'Action plan expires ' + short(ex), detail: 'Renew at this visit', k: null });
      if (rt && rt < '2026-11-06') R.push({ sev: 'Plan', cls: 'tag-outline', title: 'Spirometry retest overdue', detail: 'Due ' + short(rt), k: null });
    }
  } else if (s.headDays >= 8) { const k = recent(d => d.head === 1); R.push({ sev: 'Frequency', cls: 'tag-accent', title: 'Headache on ' + plural(s.headDays, 'day'), detail: 'Most recent ' + days[k].short, k }); }
  if (s.dose.s >= 3) { const k = recent(d => d.doses.some(x => x && x.s)); R.push({ sev: 'Doses', cls: 'tag-accent', title: plural(s.dose.s, 'dose') + ' marked skipped', detail: 'Most recent ' + days[k].short, k }); }
  let run = 0, best = 0, bestEnd = null; days.forEach(d => { if (d.active && !d.logged) { run++; if (run > best) { best = run; bestEnd = d.k; } } else run = 0; });
  if (best >= 3 && s.logged) R.push({ sev: 'Gap', cls: 'tag-outline', title: 'No entries for ' + best + ' days in a row', detail: days[bestEnd - best + 1].short + ' – ' + days[bestEnd].short, k: bestEnd - best + 1 });
  if (s.issueDays.length) { const d = s.issueDays[s.issueDays.length - 1]; R.push({ sev: 'Entry', cls: 'tag-neutral', title: plural(s.issueDays.length, 'day') + ' with unreadable or implausible answers', detail: d.short + ': ' + d.iss[0], k: d.k }); }
  P.notes.forEach(n => R.push({ sev: 'Record', cls: 'tag-neutral', title: n, detail: 'Source data', k: null }));
  return R;
}

function changed(s, p) {
  if (!p.logged && !(p.spDays)) return [];
  const f1 = v => v == null ? '—' : (Math.round(v * 10) / 10).toString();
  const row = (label, a, b, unit, better, thr) => {
    if (a == null && b == null) return null;
    let tag = 'Similar', cls = 'tag-neutral';
    if (a != null && b != null && Math.abs(b - a) >= thr) { const up = b > a; const good = better === 'up' ? up : !up; tag = good ? 'Better' : 'Worse'; cls = good ? 'tag-accent-2' : 'tag-accent'; }
    return { label, prev: a == null ? '—' : f1(a) + unit, now: b == null ? '—' : f1(b) + unit, tag, tagCls: cls };
  };
  if (s.kind === 'mig') return [
    row('Headache days', p.logged ? pct(p.headDays, p.logged) : null, s.logged ? pct(s.headDays, s.logged) : null, '% of logged days', 'down', 10),
    row('Pain on headache days', p.pain, s.pain, ' / 10', 'down', 1),
    row('Preventive doses taken', p.dose.pct, s.dose.pct, '%', 'up', 10),
    row('Days logged', p.logged, s.logged, '', 'up', 3),
  ].filter(Boolean);
  return [
    row('Symptom days', p.logged ? pct(p.symDays, p.logged) : null, s.logged ? pct(s.symDays, s.logged) : null, '%', 'down', 10),
    row('Rescue puffs per day', p.puffRate, s.puffRate, '', 'down', 0.5),
    row('Controller doses taken', p.dose.pct, s.dose.pct, '%', 'up', 10),
    row('FEV1 % predicted', p.fev, s.fev, '%', 'up', 5),
    row('Red or yellow days', p.zR + p.zY, s.zR + s.zY, '', 'down', 2),
    row('Days logged', p.logged, s.logged, '', 'up', 3),
  ].filter(Boolean);
}

function context(P, trk, days) {
  return days.filter(d => d.active).map(d => d.short + ': ' + (!d.logged ? 'no entry' : kindOf(trk) === 'mig'
    ? `headache ${d.head ? 'yes' : 'no'}; pain ${d.pain ?? '-'}; hours ${d.hours ?? '-'}; aura ${d.aura ? 'yes' : 'no'}; triggers [${d.mtrig.join(', ')}]`
    : `zone ${d.zone || '-'}; feeling ${d.feel != null ? FEELN[d.feel] : '-'}; symptoms [${d.syms.join(', ')}]; rescue puffs ${d.puffs ?? '-'}; night waking ${d.night ? 'yes' : 'no'}; missed school ${d.school ? 'yes' : 'no'}`)
    + '; doses ' + d.doses.filter(Boolean).map(x => `${x.m.name} ${x.t}/${x.m.perDay} taken${x.s ? ', ' + x.s + ' skipped' : ''}`).join(', ')
    + (d.sp ? `; FEV1 ${d.sp.pct}% predicted (${d.sp.rel ? 'passed quality check' : 'questionable'})` : '')).join('\n');
}

function canned(q, s, days, P, trk) {
  const l = q.toLowerCase(), per = `${days[0].short}–${days[days.length - 1].short}`;
  const ks = f => days.filter(f).slice(-6).map(d => d.k);
  if (/medic|controller|preventive|taking|adher|dose/.test(l)) {
    if (!s.dose.n) return { text: 'No scheduled daily medication for this tracker in this period.', src: [] };
    return { text: `${per}: ${s.dose.t} of ${s.dose.n} scheduled doses marked taken (${s.dose.pct}%). ${s.dose.s} marked skipped, ${s.dose.u} not reported. Doses are self-reported, not verified.`, src: ks(d => d.doses.some(x => x && x.s)) };
  }
  if (s.kind === 'asthma' && /lung|fev|spiro|breath/.test(l)) {
    if (!s.spDays) return { text: `No spirometry in ${per}.`, src: [] };
    return { text: `${s.spDays} days with spirometry; ${s.relDays} passed the device quality check. Mean FEV1 ${Math.round(s.fev)}% predicted` + (s.latest ? `; latest reliable ${s.latest.pct}% (${s.latest.L} L) on ${s.latest.d}.` : '.') + (s.blowsC ? ` ${s.blowsC} blows were marked accepted but failed the quality check; these are excluded.` : ''), src: ks(d => d.sp) };
  }
  if (/school|night/.test(l) && s.kind === 'asthma') return { text: `Missed school on ${plural(s.school, 'day')} and woke at night on ${plural(s.night, 'day')} (${per}).`, src: ks(d => d.school === 1 || d.night === 1) };
  if (/conflict|review|flag|wrong|quality|odd/.test(l)) {
    const c = s.kind === 'asthma' ? s.conflicts : [];
    return { text: `${plural(c.length, 'day')} with conflicting answers and ${plural(s.issueDays.length, 'day')} with unreadable or implausible values in ${per}.` + (c.length ? ` Most recent conflict: ${c[c.length - 1].short} — ${c[c.length - 1].conflict}.` : ''), src: [...c.slice(-3).map(d => d.k), ...s.issueDays.slice(-3).map(d => d.k)] };
  }
  if (/symptom|headache|often|how many|how is|going/.test(l)) {
    if (s.kind === 'mig') return { text: `Headache on ${s.headDays} of ${s.logged} logged days (${per}). Mean pain ${s.pain != null ? s.pain.toFixed(1) : '—'}/10, mean duration ${s.hours != null ? s.hours.toFixed(1) : '—'} h. Aura on ${plural(s.auraDays, 'day')}. Most reported triggers: ${s.top.slice(0, 3).map(x => x[0]).join(', ') || 'none'}.`, src: ks(d => d.head === 1) };
    return { text: `Symptoms on ${s.symDays} of ${s.logged} logged days (${per}). Most reported: ${s.top.slice(0, 3).map(x => x[0] + ' (' + x[1] + ')').join(', ') || 'none'}. Rescue inhaler ${s.puffRate != null ? s.puffRate.toFixed(1) : '—'} puffs per logged day. Zones: ${s.zG} green, ${s.zY} yellow, ${s.zR} red.`, src: ks(d => d.zone === 'R' || d.zone === 'Y') };
  }
  return null;
}

function summary(P, trk, days, s) {
  const per = `${short(days[0].d)} – ${short(days[days.length - 1].d)}, ${days[0].d.slice(0, 4)}`, out = [];
  out.push({ title: 'Reporting', text: `Entries on ${s.logged} of ${s.active} days. ${s.blanks} blank submissions. Where a day has several submissions, the latest answer to each question is used.` });
  if (s.kind === 'mig') {
    out.push({ title: 'Headaches', text: `${s.headDays} of ${s.logged} logged days. Mean pain ${s.pain != null ? s.pain.toFixed(1) : '—'}/10; mean duration ${s.hours != null ? s.hours.toFixed(1) : '—'} h. Aura on ${plural(s.auraDays, 'day')}.` });
    if (s.top.length) out.push({ title: 'Triggers', text: s.top.slice(0, 4).map(x => `${x[0]} (${x[1]})`).join(', ') + '.' });
  } else {
    out.push({ title: 'Symptoms', text: `${s.symDays} of ${s.logged} logged days. Most reported: ${s.top.slice(0, 4).map(x => `${x[0]} (${x[1]})`).join(', ') || 'none'}.` });
    out.push({ title: 'Rescue inhaler', text: `${s.puffs} puffs reported (${s.puffRate != null ? s.puffRate.toFixed(1) : '—'} per logged day).` });
    out.push({ title: 'Night & school', text: `Woke at night on ${plural(s.night, 'day')}; missed school on ${plural(s.school, 'day')}.` });
    out.push({ title: 'Action-plan zones', text: `Green ${s.zG}, yellow ${s.zY}, red ${s.zR}.` + (P.plan ? ` Plan ${P.plan.status.toLowerCase()}, expires ${short(P.plan.expiration)}, ${P.plan.expiration.slice(0, 4)}.` : '') });
    out.push({ title: 'Lung function', text: s.spDays ? `${s.spDays} days with spirometry, ${s.relDays} passed quality checks. Mean FEV1 ${Math.round(s.fev)}% predicted` + (s.latest ? `; latest reliable ${s.latest.pct}% (${s.latest.L} L) on ${s.latest.d}.` : '.') : 'No spirometry in this period.' });
  }
  const dm = P.meds.filter(m => m.daily && !m.archived && m.cond.toLowerCase().includes(s.kind === 'mig' ? 'migraine' : 'asthma')).map(m => m.name).join(', ');
  out.push({ title: 'Medication', text: s.dose.n ? `${dm}: ${s.dose.t} of ${s.dose.n} scheduled doses marked taken (${s.dose.pct}%); ${s.dose.s} marked skipped; ${s.dose.u} not reported.` : 'No scheduled daily medication.' });
  out.push({ title: 'Limitations', text: 'Doses are self-reported, not verified. Unreadable or implausible answers were excluded (' + plural(s.issueDays.length, 'day') + ' affected). Home data are not part of the medical record.' + (P.notes.length ? ' ' + P.notes.join('. ') + '.' : '') });
  return { per, sections: out };
}

function csv(days, kind) {
  const head = kind === 'mig' ? 'date,logged,headache,pain,hours,aura,triggers,doses_taken,doses_skipped,doses_unreported,submissions'
    : 'date,logged,zone,feeling,symptoms,rescue_puffs,night_waking,missed_school,doses_taken,doses_skipped,doses_unreported,fev1_pct_pred,fev1_L,fev1_quality,submissions';
  return head + '\n' + days.map(d => {
    const t = d.doses.reduce((a, x) => a + (x ? x.t : 0), 0), s = d.doses.reduce((a, x) => a + (x ? x.s : 0), 0), u = d.doses.reduce((a, x) => a + (x ? x.u : 0), 0);
    return (kind === 'mig' ? [d.d, d.logged, d.head ?? '', d.pain ?? '', d.hours ?? '', d.aura ?? '', '"' + d.mtrig.join('; ') + '"', t, s, u, d.subs.length]
      : [d.d, d.logged, d.zone || '', d.feel != null ? FEELN[d.feel] : '', '"' + d.syms.join('; ') + '"', d.puffs ?? '', d.night ?? '', d.school ?? '', t, s, u, d.sp ? d.sp.pct : '', d.sp ? d.sp.L : '', d.sp ? (d.sp.rel ? 'passed' : 'questionable') : '', d.subs.length]).join(',');
  }).join('\n');
}

window.SHM = { END, MON, DOWS, FEELN, toD, addDays, short, longD, diff, pct, plural, mean, kindOf, index, buildDays, stats, lastEntry, trends, review, changed, context, canned, summary, csv };
})();
