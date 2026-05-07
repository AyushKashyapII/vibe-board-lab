import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

function fallbackUsername(user: User) {
  const meta = (user.user_metadata || {}) as Record<string, any>;
  const fromMeta = meta.username || meta.user_name || meta.name;
  if (typeof fromMeta === "string" && fromMeta.trim()) return fromMeta.trim();

  const email = user.email || "";
  const base = email.split("@")[0] || "user";
  return base.slice(0, 24);
}

export async function ensureProfile(user: User) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const username = fallbackUsername(user);

  // If you have an auth trigger that creates profiles, this is a no-op;
  // if not, this will create the missing row so .single() never fails.
  const { data: created, error: upsertError } = await supabase
    .from("profiles")
    .upsert({ id: user.id, username }, { onConflict: "id" })
    .select("*")
    .single();

  if (upsertError) throw upsertError;
  return created;
}

