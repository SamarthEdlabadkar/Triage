import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const file = path.join(process.cwd(), "designs", "Clinician Dashboard.dc.html");
  const html = await readFile(file, "utf8");
  const titled = html.replace(
    "<head>",
    "<head>\n<title>SMART@Home · Clinician view</title>",
  );

  return new Response(titled, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
