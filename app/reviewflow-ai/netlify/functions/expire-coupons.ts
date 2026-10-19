// Daily: mark approved/sent coupons past their expiration_date as expired.
import type { Handler } from "@netlify/functions";
import { schedule } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";

const run: Handler = async () => {
  const sb = getServiceSupabase();
  const { data, error } = await sb.rpc("expire_coupons");
  if (error) { console.error("expire_coupons", error); return { statusCode: 500 }; }
  console.log("expire-coupons", { expired: data });
  return { statusCode: 200, body: JSON.stringify({ expired: data }) };
};

export const handler = schedule("15 3 * * *", run);
