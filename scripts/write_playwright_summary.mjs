import fs from "node:fs";
import path from "node:path";

const reportPath = process.argv[2] || path.join("playwright-report", "results.json");
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!summaryPath) {
  process.exit(0);
}

if (!fs.existsSync(reportPath)) {
  fs.appendFileSync(summaryPath, "## Playwright\n\nNo JSON report was generated.\n");
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const rows = [];

function collectSuite(suite, titlePath = []) {
  const nextPath = suite.title ? [...titlePath, suite.title] : titlePath;

  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      const results = test.results || [];
      const finalResult = [...results].reverse().find((result) => result.status) || null;
      const title = [...nextPath, spec.title].filter(Boolean).join(" > ");
      const project = test.projectName || "unknown";
      const status = finalResult?.status || test.status || "unknown";
      const duration = results.reduce((sum, result) => sum + (result.duration || 0), 0);
      const errorText =
        finalResult?.error?.message ||
        finalResult?.errors?.map((error) => error.message).find(Boolean) ||
        "";

      rows.push({
        title,
        project,
        status,
        duration,
        errorText
      });
    }
  }

  for (const child of suite.suites || []) {
    collectSuite(child, nextPath);
  }
}

for (const suite of report.suites || []) {
  collectSuite(suite, []);
}

const counts = {
  passed: rows.filter((row) => row.status === "passed").length,
  failed: rows.filter((row) => row.status === "failed" || row.status === "timedOut").length,
  flaky: rows.filter((row) => row.status === "flaky").length,
  skipped: rows.filter((row) => row.status === "skipped").length
};

const lines = [];
lines.push("## Playwright Summary");
lines.push("");
lines.push(`- Passed: ${counts.passed}`);
lines.push(`- Failed: ${counts.failed}`);
lines.push(`- Flaky: ${counts.flaky}`);
lines.push(`- Skipped: ${counts.skipped}`);
lines.push("");

const highlighted = rows.filter((row) => row.status !== "passed").slice(0, 20);

if (highlighted.length) {
  lines.push("### Non-passing tests");
  lines.push("");
  lines.push("| Status | Project | Test |");
  lines.push("| --- | --- | --- |");

  for (const row of highlighted) {
    lines.push(`| ${row.status} | ${row.project} | ${row.title.replace(/\|/g, "\\|")} |`);
    if (row.errorText) {
      lines.push("");
      lines.push(`> ${row.errorText.split("\n")[0].replace(/^Error:\s*/, "")}`);
      lines.push("");
    }
  }
} else {
  lines.push("All Playwright tests passed.");
}

fs.appendFileSync(summaryPath, `${lines.join("\n")}\n`);
