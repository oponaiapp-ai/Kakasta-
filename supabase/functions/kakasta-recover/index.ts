import { withSupabase } from "npm:@supabase/server@1";
import { corsHeaders } from "npm:@supabase/supabase-js/cors";

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    try {
      const body = await req.json();
      const code = typeof body?.recovery_code === "string" ? body.recovery_code.trim().toLowerCase() : "";
      if (!/^[a-f0-9]{64}$/.test(code)) return new Response(JSON.stringify({ error: "Недействительный код восстановления." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: profile, error: profileError } = await ctx.supabaseAdmin.from("profiles").select("id,display_name,role,recovery_code").eq("recovery_code", code).maybeSingle();
      if (profileError) throw profileError;
      if (!profile) return new Response(JSON.stringify({ error: "Профиль для этого кода не найден." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const email = `account-${code}@kakasta.app`;
      const { data: existing, error: userError } = await ctx.supabaseAdmin.auth.admin.getUserById(profile.id);
      if (userError || !existing.user) throw userError || new Error("Пользователь не найден.");
      if (existing.user.is_anonymous) {
        const { error } = await ctx.supabaseAdmin.auth.admin.updateUserById(profile.id, { email, password: code, email_confirm: true, user_metadata: { kakasta_recovery: true } });
        if (error) throw error;
      } else if (existing.user.email !== email) {
        return new Response(JSON.stringify({ error: "Этот профиль уже связан с другим способом входа." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
      const publicKey = publishableKeys.default || Deno.env.get("SUPABASE_ANON_KEY")!;
      const { createClient } = await import("npm:@supabase/supabase-js@2");
      const authClient = createClient(Deno.env.get("SUPABASE_URL")!, publicKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: signed, error: signInError } = await authClient.auth.signInWithPassword({ email, password: code });
      if (signInError || !signed.session) throw signInError || new Error("Не удалось восстановить сессию.");
      return new Response(JSON.stringify({ access_token: signed.session.access_token, refresh_token: signed.session.refresh_token, user_id: profile.id, display_name: profile.display_name || "", role: profile.role || "buyer" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Ошибка восстановления профиля." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  })
};