#!/usr/bin/env npx ts-node --esm

import fs from 'fs';
import path from 'path';
import url from 'url';
import { Parser } from 'binary-parser';

const projectDir = url.fileURLToPath(new URL('..', import.meta.url));
const srcFile = path.resolve(projectDir, 'data/BSC5');
const dstFile = path.resolve(projectDir, 'public/stars.json');

const catalogData = fs.readFileSync(srcFile);

const entryFormat = new Parser()
  .endianess('little')
  .floatle('index')
  .doublele('rasc')
  .doublele('decl')
  .string('spectral', { length: 2 })
  .int16('mag', { formatter: v => v / 100 })
  .floatbe('raMotion')
  .floatbe('decMotion');

const headerFormat = new Parser()
  .endianess('little')
  .uint32('star0')
  .uint32('star1')
  .int32('numStars', { formatter: v => -v })
  .uint32('stnum')
  .uint32('mprop')
  .uint32('numMagnitudes')
  .uint32('bytesPerEntry')
  .array('entries', {
    length: 'numStars',
    type: entryFormat,
  });

const database = headerFormat.parse(catalogData);

// RA, Dec, Spectral, Mag
type IStarRow = [number, number, string, number];

const out: IStarRow[] = [];

for (const star of database.entries) {
  const spectral = star.spectral.trim();
  if (spectral !== '') {
    out.push([star.rasc, star.decl, spectral, star.mag]);
  }
}

fs.writeFileSync(dstFile, JSON.stringify(out));
