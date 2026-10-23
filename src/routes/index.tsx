import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HerdCare — Daily Veterinary Care Log" },
      { name: "description", content: "Record animal number, temperature, pedometer activity, IR wound scans, rumination, facial discharge, dung score and body condition daily." },
      { property: "og:title", content: "HerdCare — Daily Veterinary Care Log" },
      { property: "og:description", content: "Daily health checks for every animal in your herd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Manrope:wght@400;500;700&display=swap" },
    ],
  }),
  component: Index,
});

type IR = "Normal" | "Mild heat" | "Hot spot";
type Discharge = "None" | "Clear" | "Mucoid" | "Purulent" | "Bloody";
export type Rec = {
  id: string; date: string; animal: string; temp: number; steps: number;
  ir: IR; rumination: number; discharge: Discharge; dung: number; bcs: number; notes: string;
};

const DUNG = [1, 2, 3, 4, 5];
const DUNG_LABEL: Record<number, string> = {
  1: "Dry, firm", 2: "Normal", 3: "Soft", 4: "Loose", 5: "Watery",
};
const BCS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

const today = () => new Date().toISOString().slice(0, 10);
const SAMPLE: Rec[] = [
  { id: "1", date: today(), animal: "C-1042", temp: 38.6, steps: 3200, ir: "Normal", rumination: 480, discharge: "None", dung: 2, bcs: 3.5, notes: "" },
  { id: "2", date: today(), animal: "C-1057", temp: 39.9, steps: 1400, ir: "Hot spot", rumination: 310, discharge: "Purulent", dung: 4, bcs: 2, notes: "Left hind wound" },
  { id: "3", date: today(), animal: "C-1063", temp: 39.2, steps: 2600, ir: "Mild heat", rumination: 420, discharge: "Clear", dung: 3, bcs: 3, notes: "" },
];

export function flags(r: Rec) {
  const f: string[] = [];
  if (r.temp >= 39.5) f.push("Fever");
  else if (r.temp < 37.8) f.push("Low temp");
  if (r.steps < 2000) f.push("Low activity");
  if (r.ir === "Hot spot") f.push("Wound inflamed");
  if (r.rumination < 400) f.push("Low rumination");
  if (r.discharge === "Purulent" || r.discharge === "Bloody") f.push("Abnormal discharge");
  if (r.dung >= 4) f.push("Scours / loose dung");
  else if (r.dung === 1) f.push("Dry dung");
  if (r.bcs < 2.5) f.push("Under-conditioned");
  else if (r.bcs > 4.5) f.push("Over-conditioned");
  return f;
}

const KEY = "herdcare-records";
const empty = { animal: "", temp: "", steps: "", ir: "Normal" as IR, rumination: "", discharge: "None" as Discharge, dung: "2", bcs: "3", notes: "" };

function Index() {
  const [recs, setRecs] = useState<Rec[]>([]);
  const [form, setForm] = useState(empty);
  const [q, setQ] = useState("");

  useEffect(() => {
    const s = localStorage.getItem(KEY);
    const list: Rec[] = s ? JSON.parse(s) : SAMPLE;
    setRecs(list.map((r) => ({ ...r, dung: +r.dung || 0, bcs: +r.bcs || 0 })));
  }, []);
  const save = (r: Rec[]) => { setRecs(r); localStorage.setItem(KEY, JSON.stringify(r)); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.animal || !form.temp) return;
    save([{ id: crypto.randomUUID(), date: today(), animal: form.animal.trim(), temp: +form.temp, steps: +form.steps || 0,
      ir: form.ir, rumination: +form.rumination || 0, discharge: form.discharge, dung: +form.dung, bcs: +form.bcs, notes: form.notes }, ...recs]);
    setForm(empty);
  };

  const shown = recs.filter((r) => r.animal.toLowerCase().includes(q.toLowerCase()));
  const todays = recs.filter((r) => r.date === today());
  const alerts = todays.filter((r) => flags(r).length).length;
  const input = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">HerdCare</p>
        <h1 className="text-3xl font-bold">Daily care log</h1>
        <p className="text-sm text-muted-foreground">{new Date().toDateString()}</p>
      </header>

      <section className="mb-6 grid grid-cols-3 gap-3">
        {[["Checked today", todays.length], ["Need attention", alerts], ["Total records", recs.length]].map(([l, v]) => (
          <div key={l} className="rounded-lg bg-card p-3 shadow-sm">
            <div className="text-2xl font-bold text-primary">{v}</div>
            <div className="text-xs text-muted-foreground">{l}</div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 md:grid-cols-[340px_1fr]">
        <form onSubmit={submit} className="space-y-3 rounded-xl bg-card p-4 shadow-sm">
          <h2 className="text-xl font-semibold">New check</h2>
          <Field label="Animal number"><input className={input} value={form.animal} onChange={(e) => setForm({ ...form, animal: e.target.value })} placeholder="C-1042" required /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Temperature (°C)"><input type="number" step="0.1" className={input} value={form.temp} onChange={(e) => setForm({ ...form, temp: e.target.value })} required /></Field>
            <Field label="Pedometer (steps)"><input type="number" className={input} value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} /></Field>
          </div>
          <Field label="Rumination (min/day)"><input type="number" className={input} value={form.rumination} onChange={(e) => setForm({ ...form, rumination: e.target.value })} /></Field>
          <Field label="IR camera – wound">
            <select className={input} value={form.ir} onChange={(e) => setForm({ ...form, ir: e.target.value as IR })}>
              {["Normal", "Mild heat", "Hot spot"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Facial discharge (eyes/nose)">
            <select className={input} value={form.discharge} onChange={(e) => setForm({ ...form, discharge: e.target.value as Discharge })}>
              {["None", "Clear", "Mucoid", "Purulent", "Bloody"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dung score">
              <select className={input} value={form.dung} onChange={(e) => setForm({ ...form, dung: e.target.value })}>
                {DUNG.map((d) => <option key={d} value={d}>{d} — {DUNG_LABEL[d]}</option>)}
              </select>
            </Field>
            <Field label="Body condition (BCS)">
              <select className={input} value={form.bcs} onChange={(e) => setForm({ ...form, bcs: e.target.value })}>
                {BCS.map((b) => <option key={b} value={b}>{b.toFixed(1)}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes"><textarea className={input} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <button className="w-full rounded-md bg-primary py-2.5 font-bold text-primary-foreground hover:opacity-90">Save record</button>
        </form>

        <section>
          <input className={`${input} mb-3`} placeholder="Search animal number…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="space-y-3">
            {shown.map((r) => {
              const f = flags(r);
              return (
                <article key={r.id} className={`rounded-xl bg-card p-4 shadow-sm border-l-4 ${f.length ? "border-destructive" : "border-success"}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{r.animal}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.date}</span>
                      <button aria-label="Delete" onClick={() => save(recs.filter((x) => x.id !== r.id))} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
                    </div>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                    <Stat k="Temp" v={`${r.temp} °C`} bad={r.temp >= 39.5 || r.temp < 37.8} />
                    <Stat k="Steps" v={r.steps.toLocaleString()} bad={r.steps < 2000} />
                    <Stat k="Rumination" v={`${r.rumination} min`} bad={r.rumination < 400} />
                    <Stat k="IR wound" v={r.ir} bad={r.ir === "Hot spot"} />
                    <Stat k="Discharge" v={r.discharge} bad={r.discharge === "Purulent" || r.discharge === "Bloody"} />
                    <Stat k="Dung score" v={r.dung ? `${r.dung} — ${DUNG_LABEL[r.dung] ?? ""}` : "—"} bad={r.dung >= 4 || r.dung === 1} />
                    <Stat k="Body condition" v={r.bcs ? r.bcs.toFixed(1) : "—"} bad={r.bcs < 2.5 || r.bcs > 4.5} />
                  </dl>
                  {f.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {f.map((x) => <span key={x} className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">{x}</span>)}
                    </div>
                  )}
                  {r.notes && <p className="mt-2 text-sm text-muted-foreground">{r.notes}</p>}
                </article>
              );
            })}
            {!shown.length && <p className="text-sm text-muted-foreground">No records found.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-bold text-muted-foreground">{label}</span>{children}</label>;
}
function Stat({ k, v, bad }: { k: string; v: string; bad: boolean }) {
  return (
    <div className="rounded-md bg-muted px-2 py-1.5">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className={`font-bold ${bad ? "text-destructive" : "text-foreground"}`}>{v}</dd>
    </div>
  );
}
