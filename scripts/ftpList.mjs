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

(async () => {
  const client = new Client();
  client.ftp.verbose = true;
  try {
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASSWORD, secure: false });
    console.log('Connected. Listing:', FTP_BASE_DIR);
    await client.cd(FTP_BASE_DIR);
    const list = await client.list();
    for (const item of list) {
      console.log(`${item.isDirectory ? 'DIR ' : 'FILE'}\t${item.size}\t${item.name}`);
    }
    console.log('--- Trying to open index.html ---');
    try {
      const writable = fs.createWriteStream('./_remote_index_tmp');
      await client.downloadTo(writable, 'index.html');
      console.log('index.html downloaded locally as _remote_index_tmp');
    } catch (e) {
      console.log('index.html not found in base dir');
    }
  } catch (e) {
    console.error('FTP list error:', e);
  } finally {
    client.close();
  }
})();
