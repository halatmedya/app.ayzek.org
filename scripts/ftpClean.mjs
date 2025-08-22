#!/usr/bin/env node
import fs from 'fs';
import dotenv from 'dotenv';
import { Client } from 'basic-ftp';

if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' }); else dotenv.config();

const { FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_BASE_DIR } = process.env;
if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD || !FTP_BASE_DIR) {
  console.error('Missing FTP env vars');
  process.exit(1);
}

async function removeDirRecursive(client, base, name) {
  try {
    await client.cd(base + '/' + name);
  } catch (e) {
    return; // not exists
  }
  await client.cd(base); // go back
  const full = base + '/' + name;
  try {
    // List items
    await client.cd(full);
    const items = await client.list();
    for (const it of items) {
      if (it.name === '.' || it.name === '..') continue;
      if (it.isDirectory) {
        await removeDirRecursive(client, full, it.name);
      } else {
        try { await client.remove(full + '/' + it.name); } catch {}
      }
    }
    await client.cd(base);
    await client.removeDir(full);
    console.log('Removed dir', full);
  } catch (e) {
    // ignore
  }
}

(async () => {
  const client = new Client();
  client.ftp.verbose = true;
  try {
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASSWORD, secure: false });
    console.log('Connected. Cleaning base:', FTP_BASE_DIR);
    await client.cd(FTP_BASE_DIR);
    const toDeleteFiles = ['index.html', 'vite.config.ts', 'README.md', 'tailwind.config.js', 'postcss.config.js', 'package-lock.json', 'package.json', 'tsconfig.json', '.htaccess'];
    for (const f of toDeleteFiles) {
      try { await client.remove(f); console.log('Deleted file', f); } catch {}
    }
    // delete assets dir
    await removeDirRecursive(client, FTP_BASE_DIR, 'assets');
    await removeDirRecursive(client, FTP_BASE_DIR, 'ayzekapp');
    await removeDirRecursive(client, FTP_BASE_DIR, 'src');
  } catch (e) {
    console.error('Clean error:', e);
  } finally {
    client.close();
  }
})();
