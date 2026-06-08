import { QRCodeSVG } from "qrcode.react";
import { useActiveBusiness } from "@/lib/businessContext";

export default function QrCodesPage() {
  const { business } = useActiveBusiness();
  if (!business) return null;
  const url = `${window.location.origin}/r/${business.slug}`;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">QR Code</h1>
      <div className="card p-6 flex flex-col items-center gap-4 max-w-md">
        <QRCodeSVG value={url} size={256} includeMargin />
        <a className="text-brand break-all text-sm" href={url} target="_blank">{url}</a>
        <p className="text-slate-500 text-sm text-center">הדבק את הסטיקר על השולחן / הקופה / הקבלה.</p>
      </div>
    </div>
  );
}
