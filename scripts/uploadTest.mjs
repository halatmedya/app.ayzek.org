#!/usr/bin/env node
import fs from 'fs';
import dotenv from 'dotenv';
import FTPDeploy from 'ftp-deploy';
import path from 'path';

if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' }); else dotenv.config();

const { FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_BASE_DIR, FTP_SUBDIR } = process.env;

const ftpDeploy = new FTPDeploy();
const baseDir = FTP_BASE_DIR.replace(/\\/g,'/');
const subDir = (FTP_SUBDIR || '').trim();
const remoteRoot = subDir ? path.posix.join(baseDir, subDir) : baseDir;

const config = {
  user: FTP_USER,
  password: FTP_PASSWORD,
  host: FTP_HOST,
  port: 21,
  localRoot: path.resolve('.'),
  remoteRoot,
  include: ['test.html'],
  exclude: [],
  deleteRemote: false,
  forcePasv: true,
  sftp: false
};

console.log('Uploading test.html to', remoteRoot);

ftpDeploy.deploy(config)
  .then(res => console.log('Test uploaded:', res))
  .catch(err => console.error('Upload error:', err));
