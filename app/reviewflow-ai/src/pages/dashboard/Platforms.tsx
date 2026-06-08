import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useActiveBusiness } from "@/lib/businessContext";
import type { ReviewPlatform } from "@/lib/types";

export default function PlatformsPage() {
  const { business } = useActiveBusiness();
  const [rows, setRows] = useState<ReviewPlatform[]>([]);
  const [kind, setKind] = useState("google");
  const [name, setName] = useState("Google");
  const [url, setUrl] = useState("");

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [business?.id]);
  async function load() {
    if (!business) return;
    const { data } = await supabase
      .from("review_platforms").select("*").eq("business_id", business.id).order("display_order");
    setRows((data ?? []) as ReviewPlatform[]);
  }

  async function addPlatform(e: FormEvent) {
    e.preventDefault();
    if (!business || !url) return;
    await supabase.from("review_platforms").insert({
      business_id: business.id, kind, display_name: name, review_url: url, display_order: rows.length + 1,
    });
    setUrl("");
    load();
  }
  async function remove(id: string) {
    await supabase.from("review_platforms").delete().eq("id", id);
    load();
  }

  if (!business) return null;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">פלטפורמות ביקורת</h1>
      <form onSubmit={addPlatform} className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="label">סוג</label>
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="google">Google</option>
            <option value="facebook">Facebook</option>
            <option value="easy">Easy</option>
            <option value="tripadvisor">Tripadvisor</option>
            <option value="custom">אחר</option>
          </select>
        </div>
        <div><label className="label">שם להצגה</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="md:col-span-2"><label className="label">קישור לחוות דעת</label><input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></div>
        <button className="btn-primary md:col-span-4">הוספה</button>
      </form>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="p-3 text-right">שם</th><th className="p-3 text-right">סוג</th><th className="p-3 text-right">קישור</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="p-3">{p.display_name}</td>
                <td className="p-3 text-slate-500">{p.kind}</td>
                <td className="p-3 truncate max-w-md"><a className="text-brand" href={p.review_url} target="_blank">{p.review_url}</a></td>
                <td className="p-3 text-left"><button className="text-red-600" onClick={() => remove(p.id)}>מחיקה</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
