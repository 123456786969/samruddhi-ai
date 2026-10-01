/**
 * One-time migration: copies data from the legacy local JSON stores
 * (.billing_store.json, .otp_store.json) into Firestore.
 *
 *   npx tsx scripts/migrate-local-stores.ts            # migrate
 *   npx tsx scripts/migrate-local-stores.ts --dry-run  # only report what would be written
 *   npx tsx scripts/migrate-local-stores.ts --delete   # also delete the files after a successful run
 *
 * Safe to run more than once: documents that already exist in Firestore are never
 * overwritten (Firestore is the source of truth), and OTPs are deliberately NOT migrated -
 * they are short-lived and were stored in plain text, so users simply request a new code.
 *
 * Requires Firestore credentials (or FIRESTORE_EMULATOR_HOST) like the server itself.
 */
import fs from 'fs';
import path from 'path';
import { adminDb } from '../src/server/billing';

const DRY_RUN = process.argv.includes('--dry-run');
const DELETE_AFTER = process.argv.includes('--delete');

const BILLING_FILE = path.join(process.cwd(), '.billing_store.json');
const OTP_FILE = path.join(process.cwd(), '.otp_store.json');

// Local store key -> Firestore collection
const KEYED_COLLECTIONS: Record<string, string> = {
  subscriptions: 'subscriptions',
  usage: 'usage',
  processed_payments: 'processed_payments',
  leads: 'leads',
  visits: 'visits',
};

async function copyKeyed(collection: string, docs: Record<string, any>) {
  let written = 0;
  let skipped = 0;
  for (const [id, raw] of Object.entries(docs || {})) {
    if (!raw || typeof raw !== 'object') continue;
    const { id: _ignored, ...data } = raw; // the local store duplicated the id inside the doc
    const ref = adminDb.collection(collection).doc(id);
    if (DRY_RUN) {
      console.log(`[dry-run] would write ${collection}/${id}`);
      written++;
      continue;
    }
    try {
      await ref.create(data); // fails if it already exists -> never overwrite
      written++;
    } catch (e: any) {
      if (e?.code === 6 || /already exists/i.test(e?.message || '')) skipped++;
      else throw e;
    }
  }
  console.log(`${collection}: ${written} written, ${skipped} already existed`);
  return written + skipped;
}

async function main() {
  if (!adminDb) throw new Error('Firestore Admin is not available - check credentials.');

  let total = 0;
  if (fs.existsSync(BILLING_FILE)) {
    const store = JSON.parse(fs.readFileSync(BILLING_FILE, 'utf-8'));
    for (const [key, collection] of Object.entries(KEYED_COLLECTIONS)) {
      total += await copyKeyed(collection, store[key]);
    }
    const notifs: any[] = Array.isArray(store.admin_notifications) ? store.admin_notifications : [];
    const asMap: Record<string, any> = {};
    for (const n of notifs) if (n?.id) asMap[n.id] = n;
    total += await copyKeyed('admin_notifications', asMap);
  } else {
    console.log('No .billing_store.json found - nothing to migrate.');
  }

  if (fs.existsSync(OTP_FILE)) {
    console.log('.otp_store.json found: OTP codes are intentionally not migrated (short-lived, plain text).');
  }

  if (DELETE_AFTER && !DRY_RUN) {
    for (const f of [BILLING_FILE, OTP_FILE]) {
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
        console.log(`Deleted ${path.basename(f)}`);
      }
    }
  }
  console.log(`Done. ${total} document(s) processed${DRY_RUN ? ' (dry run)' : ''}.`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
