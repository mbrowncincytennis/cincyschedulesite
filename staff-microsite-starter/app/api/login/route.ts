
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { pw } = await request.json();
  if (pw && process.env.SITE_PASSWORD && pw === process.env.SITE_PASSWORD) {
    cookies().set("microsite_auth", pw, { httpOnly: true, sameSite: "lax", path: "/" });
    return new Response("ok");
  }
  return new Response("nope", { status: 401 });
}

mv staff-microsite-starter/* .
mv staff-microsite-starter/.* . 2>/dev/null || true
rmdir staff-microsite-starter
