import { useRef, useState } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Download, Copy, Printer } from "lucide-react";
import RequireBusiness from "@/components/RequireBusiness";
import { Button, useToast } from "@/components/ui";
import { copyToClipboard } from "@/lib/api";

export default function QrCodesPage() {
  return <RequireBusiness>{(b) => <QrInner slug={b.slug} name={b.name} />}</RequireBusiness>;
}

function QrInner({ slug, name }: { slug: string; name: string }) {
  const toast = useToast();
  const [campaign, setCampaign] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);
  const url = `${window.location.origin}/r/${slug}${campaign ? `?c=${encodeURIComponent(campaign)}` : ""}`;

  function downloadPng() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a"); a.href = canvas.toDataURL("image/png"); a.download = `reviewflow-${slug}${campaign ? `-${campaign}` : ""}.png`; a.click();
  }
  function downloadSvg() {
    const svg = document.getElementById("rf-qr-svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `reviewflow-${slug}.svg`; a.click();
  }
  function print() {
    const w = window.open("", "_blank", "noopener,width=600,height=800"); if (!w) return;
    const svg = document.getElementById("rf-qr-svg")?.outerHTML ?? "";
    w.document.write(`<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>${name}</title>
      <style>body{font-family:Heebo,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
      .s{width:105mm;height:148mm;border:1px dashed #cbd5e1;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;text-align:center}
      h1{font-size:22px;margin:0}p{margin:0;color:#475569;font-size:14px}svg{width:60mm;height:60mm}small{color:#94a3b8;font-size:11px}
      @media print{.s{border:none}}</style></head><body><div class="s"><h1>${name}</h1><p>נשמח לשמוע מה דעתכם ☺</p>${svg}<p>סרקו · דקה אחת · הטבה מחכה</p><small>${url}</small></div>
      <script>window.onload=()=>{window.print();}</script></body></html>`);
    w.document.close();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">קוד QR</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6 flex flex-col items-center gap-4">
          <QRCodeSVG id="rf-qr-svg" value={url} size={240} includeMargin level="M" />
          <div ref={canvasRef} className="hidden"><QRCodeCanvas value={url} size={1024} includeMargin level="M" /></div>
          <a className="text-brand text-sm break-all text-center" dir="ltr" href={url} target="_blank" rel="noopener">{url}</a>
          <div className="flex gap-2 flex-wrap justify-center">
            <Button onClick={downloadPng}><Download size={16} /> PNG</Button>
            <Button onClick={downloadSvg}><Download size={16} /> SVG</Button>
            <Button onClick={print}><Printer size={16} /> מדבקה להדפסה</Button>
            <Button onClick={async () => toast((await copyToClipboard(url)) ? "הקישור הועתק" : "ההעתקה נכשלה")}><Copy size={16} /> העתקת קישור</Button>
          </div>
        </div>
        <div className="card p-6 flex flex-col gap-3">
          <h2 className="font-bold">מעקב לפי מקור (קמפיין)</h2>
          <p className="text-sm text-slate-500">הוסיפו תג מקור כדי לדעת מאיפה הגיעו המשובים — שולחן, קופה, וואטסאפ, חשבונית…</p>
          <label className="label" htmlFor="cmp">תג מקור (באנגלית, בלי רווחים)</label>
          <input id="cmp" className="input" dir="ltr" value={campaign} onChange={(e) => setCampaign(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="table-5 / counter / whatsapp" />
          <p className="text-xs text-slate-400">הקוד מתעדכן אוטומטית. כדי שהמקור יירשם, צרו קמפיין באותו שם בהגדרות (בקרוב) — בינתיים הקישור עובד בכל מקרה.</p>
          <div className="mt-2 text-sm text-slate-600">
            <p className="font-medium mb-1">טיפים להדפסה</p>
            <ul className="list-disc pr-5 text-slate-500 space-y-1">
              <li>גודל מינימלי מומלץ: 3×3 ס״מ.</li>
              <li>ניגודיות גבוהה (שחור על לבן) סורקת הכי טוב.</li>
              <li>כתבו ליד הקוד: "סרקו — דקה אחת — הטבה מחכה".</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
