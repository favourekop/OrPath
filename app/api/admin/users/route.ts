import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function authorize() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  const { data: profile } = await session.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { error: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { error: NextResponse.json({ error: "Admin account management is not configured. Add SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables." }, { status: 503 }) };
  return { user, service: createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) };
}

export async function GET() {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const { data, error } = await auth.service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const admins = (data.users ?? []).filter(u => u.app_metadata?.role === "admin" || u.user_metadata?.role === "admin");
  return NextResponse.json({ admins: admins.map(u => ({ id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at, banned_until: u.banned_until ?? null, confirmed: Boolean(u.email_confirmed_at) })) });
}

export async function POST(request: Request) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) return NextResponse.json({ error: "Enter a valid email and a password of at least 12 characters." }, { status: 400 });
  const { data, error } = await auth.service.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { role: "admin" } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { error: profileError } = await auth.service.from("profiles").upsert({ id: data.user.id, role: "admin" }, { onConflict: "id" });
  if (profileError) {
    await auth.service.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }
  return NextResponse.json({ id: data.user.id, email: data.user.email }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Admin ID is required." }, { status: 400 });
  if (id === auth.user.id && (body.role !== "admin" || body.disable === true)) return NextResponse.json({ error: "You cannot remove or disable your own admin access." }, { status: 400 });
  const { data: target, error: getError } = await auth.service.auth.admin.getUserById(id);
  if (getError || !target.user) return NextResponse.json({ error: getError?.message ?? "Admin not found." }, { status: 404 });
  if (body.password !== undefined) {
    if (typeof body.password !== "string" || body.password.length < 12) return NextResponse.json({ error: "Password must be at least 12 characters." }, { status: 400 });
    const { error } = await auth.service.auth.admin.updateUserById(id, { password: body.password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (body.email !== undefined) {
    if (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    const { error } = await auth.service.auth.admin.updateUserById(id, { email: body.email.trim().toLowerCase(), email_confirm: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (body.role === "admin" || body.role === "user") {
    const { error } = await auth.service.from("profiles").update({ role: body.role, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await auth.service.auth.admin.updateUserById(id, { app_metadata: { ...target.user.app_metadata, role: body.role } });
  }
  if (body.disable === true || body.disable === false) {
    const { error } = await auth.service.auth.admin.updateUserById(id, { ban_duration: body.disable ? "876000h" : "none" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id || id === auth.user.id) return NextResponse.json({ error: "Choose another admin account. You cannot delete your own account." }, { status: 400 });
  const { error } = await auth.service.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
