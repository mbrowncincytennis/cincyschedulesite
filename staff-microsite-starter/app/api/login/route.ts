
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { pw } = await request.json();
  if (pw && process.env.SITE_PASSWORD && pw === process.env.SITE_PASSWORD) {
    cookies().set("microsite_auth", pw, { httpOnly: true, sameSite: "lax", path: "/" });
    return new Response("ok");
  }
  return new Response("nope", { status: 401 });
}
