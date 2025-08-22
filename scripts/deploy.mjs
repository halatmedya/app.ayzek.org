#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import FTPDeploy from 'ftp-deploy';
import dotenv from 'dotenv';

// Prefer .env.local (not committed) then fallback to .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
  console.log('Loaded env from .env.local');
} else {
  dotenv.config();
  console.log('Loaded env from .env');
}

const required = ['FTP_HOST','FTP_USER','FTP_PASSWORD','FTP_BASE_DIR'];
let missing = [];
for (const k of required) {
  if (!process.env[k]) missing.push(k);
}
if (missing.length) {
  console.error('Missing env vars:', missing.join(', '));
  process.exit(1);
}

const ftpDeploy = new FTPDeploy();
const localRoot = path.resolve('dist');
if (!fs.existsSync(localRoot)) {
  console.error('dist folder not found. Run build first.');
  process.exit(1);
}

const baseDir = process.env.FTP_BASE_DIR.replace(/\\/g,'/');
const subDir = (process.env.FTP_SUBDIR || '').trim();
const remoteRoot = subDir ? path.posix.join(baseDir, subDir) : baseDir;
console.log('Remote target directory:', remoteRoot, subDir ? '(with subdir)' : '(base dir)');

const config = {
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  host: process.env.FTP_HOST,
  port: 21,
  localRoot,
  remoteRoot,
  include: ['**/*', '**/.*'],
  exclude: [
    '**/.DS_Store',
    '**/Thumbs.db',
    '**/.git/**',
    '**/.github/**',
    '**/node_modules/**'
  ],
  deleteRemote: false,
  forcePasv: true,
  sftp: false // set true if your host supports SFTP (recommended)
};

console.log(`Deploying to ftp://${config.host}${remoteRoot}`);

ftpDeploy.deploy(config)
  .then(res => {
    console.log(`Success: ${res.length} files uploaded.`);
    if (res.length) {
      console.log('Uploaded files:');
      res.forEach(f => console.log(' -', f));
    }
  })
  .catch(err => {
    console.error('Deploy error:', err);
    process.exit(1);
  });
