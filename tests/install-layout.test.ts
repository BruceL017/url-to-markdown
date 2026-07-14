import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const SKILL_ROOT = path.join(ROOT, "url-to-markdown");

function filesUnder(root: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...filesUnder(target));
    } else if (entry.isFile()) {
      files.push(target);
    }
  }
  return files;
}

describe("installable Skill layout", () => {
  test("keeps the complete Skill in the nested directory", () => {
    expect(fs.existsSync(path.join(ROOT, "SKILL.md"))).toBe(false);

    const required = [
      "SKILL.md",
      "agents/openai.yaml",
      "LICENSE",
      "NOTICE",
      "references/adapters.md",
      "references/quality-gate.md",
      "references/config/first-time-setup.md",
      "scripts/url-to-markdown",
      "scripts/package.json",
      "scripts/bun.lock",
      "scripts/lib/cli.ts",
    ];

    for (const relativePath of required) {
      expect(fs.statSync(path.join(SKILL_ROOT, relativePath)).isFile()).toBe(true);
    }

    expect(fs.statSync(path.join(SKILL_ROOT, "scripts/url-to-markdown")).mode & 0o111).not.toBe(0);
    expect(fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8")).toContain("**/scripts/node_modules/");
  });

  test("contains no legacy runtime identifiers", () => {
    const runtimeFiles = filesUnder(SKILL_ROOT).filter(
      (file) => !["LICENSE", "NOTICE"].includes(path.basename(file)),
    );

    for (const file of runtimeFiles) {
      const contents = fs.readFileSync(file, "utf8");
      const legacyBrand = ["bao", "yu"].join("");
      expect(contents).not.toMatch(new RegExp(legacyBrand, "i"));
    }
  });
});
