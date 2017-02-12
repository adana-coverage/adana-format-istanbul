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

const count = flow(
  groupBy(({group, name, id}) => group || name || id),
  mapValues((entries) => {
    if (entries.length === 1) {
      return entries[0].count;
    }
    return map('count', entries);
  })
);

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
    return [file, {
      [MAGIC_KEY]: MAGIC_VALUE,
      hash: createHash('sha1').update(source).digest('hex'),
      path: file,
      s: count(t.statement),
      b: count(t.branch),
      f: count(t.function),
      l: gel(locations),
      fnMap: flow(
        keyBy('name'),
        mapValues(({loc, name}) => ({
            // TODO: Add `decl` info
            name,
            loc, 
        }))
      )(t.function),
      statementMap: flow(
        map(({id, loc}) => [id, loc]),
        fromPairs
      )(t.statement),
      branchMap: flow(
        groupBy('group'),
        mapValues((entries) => ({
          line: entries[0].loc.start.line,
          type: find((x) => includes(x, [
            'exception', 'if', 'switch', 'logic'
          ]), entries[0].tags),
          locations: map('loc', entries),
        }))
      )(t.branch),
    }];
  }),
  fromPairs,
  JSON.stringify
);

export default convert;