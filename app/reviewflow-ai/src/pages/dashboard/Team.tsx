import { FormEvent, useEffect, useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import RequireBusiness from "@/components/RequireBusiness";
import { Badge, Button, PageState, useConfirm, useToast } from "@/components/ui";
import { ROLE } from "@/lib/labels";
import { fmtDate } from "@/lib/format";
import { copyToClipboard } from "@/lib/api";
import type { MemberRole } from "@/lib/types";

interface Member { id: string; user_id: string; role: MemberRole; created_at: string; profiles: { email: string; full_name: string | null } | null }
interface Invite { id: string; email: string; role: MemberRole; token: string; accepted_at: string | null; expires_at: string; created_at: string }

export default function TeamPage() {
  return <RequireBusiness>{(b) => <TeamInner businessId={b.id} businessName={b.name} />}</RequireBusiness>;
}

function TeamInner({ businessId, businessName }: { businessId: string; businessName: string }) {
  const toast = useToast(); const confirm = useConfirm();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [me, setMe] = useState<string>("");
  const [email, setEmail] = useState(""); const [role, setRole] = useState<"business_staff" | "business_owner">("business_staff");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data: { session } } = await supabase.auth.getSession(); setMe(session?.user.id ?? "");
    const [{ data: m }, { data: i }] = await Promise.all([
      supabase.from("memberships").select("id, user_id, role, created_at, profiles(email, full_name)").eq("business_id", businessId).order("created_at"),
      supabase.from("invitations").select("*").eq("business_id", businessId).is("accepted_at", null).order("created_at", { ascending: false }),
    ]);
    setMembers((m ?? []) as any); setInvites((i ?? []) as Invite[]);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [businessId]);

  const inviteUrl = (t: string) => `${window.location.origin}/invite/${t}`;

  async function invite(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("invitations").insert({ business_id: businessId, email: email.trim().toLowerCase(), role, invited_by: session?.user.id });
    setBusy(false);
    if (error) return toast("יצירת ההזמנה נכשלה", "err");
    setEmail(""); toast("ההזמנה נוצרה — שלחו את הקישור"); load();
  }
  async function revoke(i: Invite) {
    if (!(await confirm({ title: `לבטל את ההזמנה ל-${i.email}?`, confirmLabel: "ביטול הזמנה", danger: true }))) return;
    await supabase.from("invitations").delete().eq("id", i.id); load();
  }
  async function removeMember(m: Member) {
    if (!(await confirm({ title: `להסיר את ${m.profiles?.full_name || m.profiles?.email}?`, text: "המשתמש יאבד גישה לעסק הזה.", confirmLabel: "הסרה", danger: true }))) return;
    const { error } = await supabase.from("memberships").delete().eq("id", m.id);
    toast(error ? "ההסרה נכשלה" : "הוסר", error ? "err" : "ok"); load();
  }

  if (!members) return <PageState kind="loading" />;

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <h1 className="text-2xl font-bold">צוות</h1>

      <section className="card overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {members.map((m) => (
            <li key={m.id} className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-100 grid place-items-center font-medium text-slate-600">{(m.profiles?.full_name || m.profiles?.email || "?")[0]?.toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{m.profiles?.full_name || m.profiles?.email}{m.user_id === me && <span className="text-xs text-slate-400"> (אני)</span>}</div>
                <div className="text-xs text-slate-500 truncate" dir="ltr">{m.profiles?.email}</div>
              </div>
              <Badge tone={m.role === "business_owner" ? "brand" : "neutral"}>{ROLE[m.role]}</Badge>
              {m.user_id !== me && <Button size="sm" variant="danger" aria-label="הסרה" onClick={() => removeMember(m)}><Trash2 size={14} /></Button>}
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="font-bold">הזמנת חבר צוות</h2>
        <form onSubmit={invite} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2"><label className="label" htmlFor="ie">אימייל</label><input id="ie" className="input" dir="ltr" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="label" htmlFor="ir">תפקיד</label><select id="ir" className="input" value={role} onChange={(e) => setRole(e.target.value as any)}><option value="business_staff">צוות (צפייה ועריכה)</option><option value="business_owner">בעלים (ניהול מלא)</option></select></div>
          <Button type="submit" variant="primary" loading={busy}>יצירת הזמנה</Button>
        </form>
        <p className="text-xs text-slate-500">ההזמנה נשלחת כקישור — העתיקו ושלחו בוואטסאפ/מייל. המוזמן נרשם עם אותו אימייל ולוחץ על הקישור.</p>

        {invites.length > 0 && (
          <ul className="divide-y divide-slate-100 border-t border-slate-100 mt-1">
            {invites.map((i) => (
                <li key={i.id} className="py-2 flex items-center gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" dir="ltr">{i.email}</div>
                    <div className="text-xs text-slate-400">{ROLE[i.role]} · בתוקף עד {fmtDate(i.expires_at)}</div>
                  </div>
                  <Button size="sm" onClick={async () => toast((await copyToClipboard(inviteUrl(i.token))) ? "קישור ההזמנה הועתק" : "נכשל")}><Copy size={14} /> העתקת קישור</Button>
                  <a className="btn-ghost btn-sm" target="_blank" rel="noopener" href={`https://wa.me/?text=${encodeURIComponent(`הוזמנת להצטרף לצוות ${businessName} ב-ReviewFlow AI: ${inviteUrl(i.token)}`)}`}>WhatsApp</a>
                  <Button size="sm" variant="danger" aria-label="ביטול" onClick={() => revoke(i)}><Trash2 size={14} /></Button>
                </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
