/**
 * Audit cross-locale consistency of exercise MDX frontmatter.
 * Fields that MUST be identical across FR/EN/ES: slug, level, themeCompatibility, muscles, media
 * Fields that CAN differ: title, tags, equipment (translated)
 * FR is the source of truth — if mismatch, report what EN/ES should be.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const EXERCISES_DIR = join(process.cwd(), 'content', 'exercices');
const LOCALES = ['fr', 'en', 'es'];
// Fields that must be identical across all locales
const IDENTICAL_FIELDS = ['slug', 'level', 'themeCompatibility', 'muscles', 'media'];

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result = {};

  for (const line of yaml.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // Parse arrays
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1);
      if (inner.trim() === '') {
        result[key] = [];
      } else {
        result[key] = inner.split(',').map(item => {
          item = item.trim();
          // Remove quotes
          if ((item.startsWith('"') && item.endsWith('"')) ||
              (item.startsWith("'") && item.endsWith("'"))) {
            item = item.slice(1, -1);
          }
          // Try to parse as number
          const num = Number(item);
          return isNaN(num) ? item : num;
        });
      }
    }
    // Parse quoted strings
    else if ((value.startsWith('"') && value.endsWith('"')) ||
             (value.startsWith("'") && value.endsWith("'"))) {
      result[key] = value.slice(1, -1);
    }
    // Parse numbers
    else if (!isNaN(Number(value)) && value !== '') {
      result[key] = Number(value);
    }
    // Plain string
    else {
      result[key] = value;
    }
  }

  return result;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    // Sort for comparison (order-independent)
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((v, i) => v === sortedB[i]);
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

// Get all slugs from FR files
const files = readdirSync(EXERCISES_DIR);
const frFiles = files.filter(f => f.endsWith('.fr.mdx'));
const slugs = frFiles.map(f => f.replace('.fr.mdx', '')).sort();

let totalIssues = 0;
const missingFiles = [];
const parseErrors = [];
const mismatches = [];

for (const slug of slugs) {
  const data = {};

  for (const locale of LOCALES) {
    const filename = `${slug}.${locale}.mdx`;
    const filepath = join(EXERCISES_DIR, filename);

    try {
      const content = readFileSync(filepath, 'utf-8');
      const fm = parseFrontmatter(content);
      if (!fm) {
        parseErrors.push({ slug, locale, error: 'No frontmatter found' });
        totalIssues++;
        continue;
      }
      data[locale] = fm;
    } catch (err) {
      if (err.code === 'ENOENT') {
        missingFiles.push({ slug, locale });
        totalIssues++;
      } else {
        parseErrors.push({ slug, locale, error: err.message });
        totalIssues++;
      }
    }
  }

  // Check cross-locale consistency (FR is source of truth)
  if (!data.fr) continue;

  for (const field of IDENTICAL_FIELDS) {
    const frValue = data.fr[field];

    for (const locale of ['en', 'es']) {
      if (!data[locale]) continue;
      const localeValue = data[locale][field];

      if (!deepEqual(frValue, localeValue)) {
        mismatches.push({
          slug,
          locale,
          field,
          expected: frValue,
          actual: localeValue,
        });
        totalIssues++;
      }
    }
  }
}

// Also check for orphan EN/ES files without FR
const enFiles = files.filter(f => f.endsWith('.en.mdx'));
const esFiles = files.filter(f => f.endsWith('.es.mdx'));
const frSlugs = new Set(slugs);

for (const f of enFiles) {
  const slug = f.replace('.en.mdx', '');
  if (!frSlugs.has(slug)) {
    missingFiles.push({ slug, locale: 'fr', note: 'orphan EN file without FR' });
    totalIssues++;
  }
}
for (const f of esFiles) {
  const slug = f.replace('.es.mdx', '');
  if (!frSlugs.has(slug)) {
    missingFiles.push({ slug, locale: 'fr', note: 'orphan ES file without FR' });
    totalIssues++;
  }
}

// Report
console.log(`\n=== MDX Cross-Locale Audit ===`);
console.log(`Slugs audited: ${slugs.length}`);
console.log(`Files checked: ${slugs.length * 3}`);
console.log(`Total issues: ${totalIssues}\n`);

if (missingFiles.length > 0) {
  console.log(`--- Missing files (${missingFiles.length}) ---`);
  for (const m of missingFiles) {
    console.log(`  ${m.slug}.${m.locale}.mdx ${m.note || ''}`);
  }
  console.log();
}

if (parseErrors.length > 0) {
  console.log(`--- Parse errors (${parseErrors.length}) ---`);
  for (const e of parseErrors) {
    console.log(`  ${e.slug}.${e.locale}.mdx: ${e.error}`);
  }
  console.log();
}

if (mismatches.length > 0) {
  console.log(`--- Field mismatches (${mismatches.length}) ---`);
  for (const m of mismatches) {
    console.log(`  ${m.slug}.${m.locale}.mdx → field "${m.field}"`);
    console.log(`    FR (expected): ${JSON.stringify(m.expected)}`);
    console.log(`    ${m.locale.toUpperCase()} (actual):  ${JSON.stringify(m.actual)}`);
  }
  console.log();
}

if (totalIssues === 0) {
  console.log('✅ All exercises are consistent across locales!');
}

// Output JSON for programmatic use
const report = { missingFiles, parseErrors, mismatches, totalIssues };
console.log('\n--- JSON REPORT ---');
console.log(JSON.stringify(report));
