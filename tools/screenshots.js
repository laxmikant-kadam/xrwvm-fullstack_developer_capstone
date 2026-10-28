/**
 * Capture the capstone submission screenshots with a real (headed) Chrome
 * window so that the browser address bar is part of every image.
 *
 *   node tools/screenshots.js                 # local run  → submission/get_dealers.png ...
 *   MODE=deployed BASE_URL=https://xxx.lhr.life node tools/screenshots.js
 *
 * Requires Playwright (tools/package.json) and PowerShell on Windows.
 */
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "submission");
const PROFILE_DIR =
  process.env.PROFILE_DIR ||
  path.join(process.env.TEMP || process.env.TMP || ROOT, "opencode", "cap", "pw-profile");

const MODE = process.env.MODE || "local";
const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const USERNAME = process.env.CARS_USER || "carsuser";
const PASSWORD = process.env.CARS_PASS || "Cars@2026";
const ADMIN_USERNAME = process.env.ADMIN_USER || "root";
const ADMIN_PASSWORD = process.env.ADMIN_PASS || "root12345";

const REVIEW_TEXT =
  process.env.REVIEW_TEXT ||
  "Fantastic services from the whole team in Wichita. The advisor walked me through every option, the finance paperwork took less than an hour and my RAV4 was detailed and ready on time.";

const pictures = {
  local: {
    landing: "get_dealers",
    loggedIn: "get_dealers_loggedin",
    byState: "dealersbystate",
    dealerDetail: "dealer_id_reviews",
    reviewForm: "dealership_review_submission",
    reviewAdded: "added_review",
  },
  deployed: {
    landing: "deployed_landingpage",
    loggedIn: "deployed_loggedin",
    dealerDetail: "deployed_dealer_detail",
    reviewAdded: "deployed_add_review",
  },
}[MODE];

if (!pictures) {
  throw new Error(`Unknown MODE '${MODE}' (use 'local' or 'deployed')`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page
    .evaluate(async () => {
      const images = Array.from(document.images).filter((img) => !img.complete);
      await Promise.all(
        images.map(
          (img) =>
            new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            })
        )
      );
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    })
    .catch(() => {});
  await sleep(600);
}

async function scrollToDealers(page) {
  await page.evaluate(() => {
    const section = document.getElementById("dealerships");
    if (section) {
      window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY - 110);
    }
  });
  await page.waitForTimeout(500);
}

async function capture(page, name) {
  await settle(page);
  const target = path.join(OUT_DIR, `${name}.png`);
  const output = execFileSync(
    "powershell",
    [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(ROOT, "tools", "capture-window.ps1"),
      "-Path",
      target,
      "-ProfileDir",
      PROFILE_DIR,
    ],
    { encoding: "utf8" }
  );
  if (!fs.existsSync(target)) {
    throw new Error(`screenshot was not written: ${target}`);
  }
  console.log(`  ${output.trim()}`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (MODE === "local") {
    fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
  }

  // Disable the Chrome password manager for this profile - otherwise the
  // "Save password?" bubble covers the page after the login step.
  const profileDefault = path.join(PROFILE_DIR, "Default");
  fs.mkdirSync(profileDefault, { recursive: true });
  const preferencesFile = path.join(profileDefault, "Preferences");
  if (!fs.existsSync(preferencesFile)) {
    fs.writeFileSync(
      preferencesFile,
      JSON.stringify({
        credentials_enable_service: false,
        credentials_enable_autosignin: false,
        profile: {
          password_manager_enabled: false,
          password_manager_leak_detection: false,
        },
      })
    );
  }

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: null,
    args: [
      "--start-maximized",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-save-password-bubble",
      "--password-store=basic",
      "--disable-features=Translate,MediaRouter,PasswordManagerOnboarding,AutofillServerCommunication",
    ],
  });

  const page = context.pages()[0] || (await context.newPage());
  page.setDefaultTimeout(45000);

  // ONLY=admin re-captures just the two Django admin screenshots.
  const onlyAdmin = process.env.ONLY === "admin";

  if (!onlyAdmin) {
  // ---------------------------------------------------------------- landing
  console.log("→ landing page (before login)");
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".dealer-card");
  await scrollToDealers(page);
  await capture(page, pictures.landing);

  // ------------------------------------------------------------------ login
  console.log("→ logging in as", USERNAME);
  await page.goto(`${BASE_URL}/login/`, { waitUntil: "domcontentloaded" });
  await page.fill("#username", USERNAME);
  await page.fill("#password", PASSWORD);
  await Promise.all([
    page.waitForURL(`${BASE_URL}/`, { waitUntil: "domcontentloaded" }),
    page.click("button[type=submit]"),
  ]);
  await page.waitForSelector("[data-username]");
  await page.waitForSelector(".dealer-card");
  // dismiss the browser "save password?" bubble if it managed to appear
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const who = await page.locator("[data-username]").innerText();
  console.log("  signed in as", who);
  await scrollToDealers(page);
  await capture(page, pictures.loggedIn);

  // ------------------------------------------------------------ state filter
  if (MODE === "local") {
    console.log("→ dealerships filtered by state (Kansas)");
    await page.goto(`${BASE_URL}/?state=Kansas`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() =>
      document.getElementById("dealer-count")?.innerText.includes("Kansas")
    );
    await page.waitForSelector(".dealer-card");
    await scrollToDealers(page);
    await capture(page, pictures.byState);
  }

  // ------------------------------------------------------------ dealer detail
  console.log("→ dealer detail with reviews");
  await page.goto(`${BASE_URL}/dealer/1/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".review-item");
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture(page, pictures.dealerDetail);

  if (MODE === "local") {
    // ------------------------------------------------------- review submission
    console.log("→ review form filled in (not submitted yet)");
    await page.waitForSelector("#review-text");
    await page.fill("#review-name", USERNAME);
    await page.fill("#review-text", REVIEW_TEXT);
    await page.selectOption("#review-make", "Toyota");
    await page.fill("#review-model", "RAV4");
    await page.fill("#review-year", "2022");
    await page.fill("#review-date", "2026-10-10");
    await page.locator("#write-review").scrollIntoViewIfNeeded();
    await page.evaluate(() =>
      window.scrollBy(0, document.getElementById("write-review").getBoundingClientRect().top - 90)
    );
    await capture(page, pictures.reviewForm);
  } else {
    // the deployed review is posted from the dealer page as well
    await page.waitForSelector("#review-text");
    await page.fill("#review-name", USERNAME);
    await page.fill("#review-text", REVIEW_TEXT);
    await page.selectOption("#review-make", "Toyota");
    await page.fill("#review-model", "RAV4");
    await page.fill("#review-year", "2022");
    await page.fill("#review-date", "2026-10-10");
  }

  // ------------------------------------------------------------- post review
  console.log("→ submitting the review");
  await page.click("#review-submit");
  await page.waitForSelector(".alert--success");
  await page.waitForFunction(
    (text) => document.getElementById("reviews-list")?.innerText.includes(text.slice(0, 25)),
    REVIEW_TEXT
  );
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const list = document.getElementById("reviews-list");
    if (list) window.scrollTo(0, list.getBoundingClientRect().top + window.scrollY - 150);
  });
  await capture(page, pictures.reviewAdded);

  // extra evidence, local run only: the "review submitted" confirmation banner
  if (MODE === "local") {
    await page.evaluate(() => {
      const alert = document.getElementById("review-alert");
      if (alert) window.scrollTo(0, alert.getBoundingClientRect().top + window.scrollY - 120);
    });
    await capture(page, "added_review_confirmation");
  }
  }

  // ------------------------------------------------------------------- admin
  if (MODE === "local") {
    console.log("→ admin login as root");
    await page.goto(`${BASE_URL}/admin/`, { waitUntil: "domcontentloaded" });
    await page.fill("#id_username", ADMIN_USERNAME);
    await page.fill("#id_password", ADMIN_PASSWORD);
    await Promise.all([
      page.waitForURL(/\/admin\/$/, { waitUntil: "domcontentloaded" }),
      page.click("input[type=submit]"),
    ]);
    await page.waitForSelector("#user-tools");
    await page.waitForTimeout(600);
    console.log("  admin url:", page.url());
    console.log("  user tools:", (await page.locator("#user-tools").innerText()).replace(/\s+/g, " ").slice(0, 120));
    await capture(page, "admin_login");

    console.log("→ admin logout");
    await Promise.all([
      page.waitForURL(/\/admin\/logout\//, { waitUntil: "domcontentloaded" }),
      page.click("#logout-form button"),
    ]);
    await page.waitForFunction(() =>
      /logged out|quality time|log in again/i.test(document.body.innerText)
    );
    await capture(page, "admin_logout");
  }

  await context.close();
  console.log("done");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
