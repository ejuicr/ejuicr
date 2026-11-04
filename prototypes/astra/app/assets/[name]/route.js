import { readFile } from "node:fs/promises";
import path from "node:path";

// Reuse the actual brand assets; no duplicated or redrawn logos.
export async function GET(_request, { params }) {
  const { name } = await params;
  if (!["logo.svg", "google-logo.svg", "x-logo.svg"].includes(name)) {
    return new Response(null, { status: 404 });
  }
  const data = await readFile(path.join(process.cwd(), "../../public", name));
  return new Response(data, { headers: { "Content-Type": "image/svg+xml" } });
}
