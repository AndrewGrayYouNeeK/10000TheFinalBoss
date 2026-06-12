import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4173";
const routes = ["/", "/shop", "/setup", "/rules"];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const consoleErrors = [];
const pageErrors = [];

page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
});
page.on("pageerror", (err) => pageErrors.push(err.message));

const results = [];

for (const route of routes) {
  consoleErrors.length = 0;
  pageErrors.length = 0;
  try {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1500);
    const text = await page.locator("body").innerText();
    const stuckLoading = text.includes("Loading…") && text.trim().length < 40;
    const hasRoot = (await page.locator("#root").innerHTML()).length > 50;
    results.push({
      route,
      ok: hasRoot && !stuckLoading,
      stuckLoading,
      snippet: text.slice(0, 120).replace(/\s+/g, " "),
      consoleErrors: [...consoleErrors],
      pageErrors: [...pageErrors],
    });
  } catch (e) {
    results.push({ route, ok: false, error: e.message });
  }
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

const failed = results.filter((r) => !r.ok);
process.exit(failed.length ? 1 : 0);
