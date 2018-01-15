import flow from 'lodash/fp/flow';
import mapValues from 'lodash/fp/mapValues';
import map from 'lodash/fp/map';
import keyBy from 'lodash/fp/keyBy';
import groupBy from 'lodash/fp/groupBy';
import find from 'lodash/fp/find';
import includes from 'lodash/fp/includes';
import fromPairs from 'lodash/fp/fromPairs';
import toPairs from 'lodash/fp/toPairs';

import {createHash} from 'crypto';
import {tags, lines} from 'adana-analyze';

// https://github.com/istanbuljs/istanbul-lib-instrument/blob/master
// /src/constants.js
export const SHA = 'sha1';
export const MAGIC_KEY = '_coverageSchema';
export const MAGIC_VALUE = createHash(SHA)
  .update('istanbul-lib-instrument' + '@' + 1)
  .digest('hex');

const gel = flow(
  lines,
  map(({count, line}) => ([line, count])),
  fromPairs
);

const convert = flow(
  toPairs,
  map(([file, {locations, source}]) => {
    const t = tags(locations, [
      'line',
      'function',
      'branch',
      'statement',
    ]);
    const functions = keyBy('name', t.function);
    const statements = keyBy('id', t.statement);
    const branches = groupBy('group', t.branch);

    return [file, {
      [MAGIC_KEY]: MAGIC_VALUE,
      hash: createHash('sha1').update(source).digest('hex'),
      path: file,
      s: mapValues('count', statements),
      b: mapValues((branches) => {
        return map('count', branches);
      }, branches),
      f: mapValues('count', functions),
      l: gel(locations),
      fnMap: mapValues(({loc, name}) => ({
          // TODO: Add `decl` info
          name,
          loc,
      }), functions),
      statementMap: mapValues(({loc}) => {
        return {loc};
      }, statements),
      branchMap: mapValues((entries) => ({
        line: entries[0].loc.start.line,
        type: find((x) => includes(x, [
          'exception', 'if', 'switch', 'logic'
        ]), entries[0].tags),
        locations: map('loc', entries),
      }), branches),
    }];
  }),
  fromPairs,
  JSON.stringify
);

export default convert;
