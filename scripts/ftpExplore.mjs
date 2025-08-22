#!/usr/bin/env node
import fs from 'fs';
import dotenv from 'dotenv';
import { Client } from 'basic-ftp';
if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' }); else dotenv.config();
const { FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_BASE_DIR } = process.env;
if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD || !FTP_BASE_DIR) { console.error('Missing env'); process.exit(1);} 
const client = new Client();
client.ftp.verbose = true;
async function list(path) {
  try { await client.cd(path); } catch { console.log('Cannot cd', path); return; }
  console.log('\n# LIST', path);
  const entries = await client.list();
  for (const e of entries) {
    console.log(`${e.isDirectory ? 'DIR ' : 'FILE'}\t${e.name}`);
  }
}
(async () => {
  try {
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASSWORD, secure: false });
    const base = FTP_BASE_DIR.replace(/\\/g,'/');
    const parts = base.split('/').filter(Boolean);
    // list current base
    await list(base);
    // list one level up
    await list('/' + parts.slice(0, parts.length - 1).join('/'));
    // list domains root
    const domainsIdx = parts.findIndex(p => p === 'domains');
    if (domainsIdx !== -1) {
      await list('/' + parts.slice(0, domainsIdx + 1).join('/'));
    }
    // guess subdomain style path: /home/USER/domains/app.ayzek.org/public_html
    const homeUser = '/' + parts.slice(0, 2).join('/'); // /home/USER
    const guess = homeUser + '/domains/app.ayzek.org/public_html';
    await list(guess);
  } catch (e) {
    console.error('Explore error', e);
  } finally { client.close(); }
})();
