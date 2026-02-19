import { cookies } from "next/headers";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;


async function handler(req: Request, params: { path: string[] }) {
    const c = await cookies();
  const access = c.get("access_token")?.value;

  const url = new URL(req.url);
  const target = `${API_BASE}/${params.path.join("/")}${url.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  if (access) headers.set("Authorization", `Bearer ${access}`);

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
    cache: "no-store",
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function GET(req: Request, ctx: { params: { path: string[] } }) {
  return handler(req, ctx.params);
}
export async function POST(req: Request, ctx: { params: { path: string[] } }) {
  return handler(req, ctx.params);
}
export async function PATCH(req: Request, ctx: { params: { path: string[] } }) {
  return handler(req, ctx.params);
}
export async function PUT(req: Request, ctx: { params: { path: string[] } }) {
  return handler(req, ctx.params);
}
export async function DELETE(req: Request, ctx: { params: { path: string[] } }) {
  return handler(req, ctx.params);
}
