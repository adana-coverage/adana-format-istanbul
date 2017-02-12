import { expect } from 'chai';
import path from 'path';
import { readFileSync } from 'fs';
import istanbul from '../../src/istanbul';

const fixture = path.join(__dirname, '/../fixture/coverage.json');
const data = JSON.parse(readFileSync(fixture, 'utf8'));

it('should output valid string', () => {
  expect((istanbul(data))).to.be.a.string;
});
