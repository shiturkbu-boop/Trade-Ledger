import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseFlexCsv } from '../lib/flex.ts';
const header = 'ClientAccountID,AssetClass,Symbol,TradeDate,Buy/Sell,Quantity,Price,Proceeds,NetCash,Commission,ExecID,TradeID\n';
test('assignment rows use TradeID and remain distinct from exchange executions', () => {
  const csv = header + [
    'TEST,STK,EXAMPLE,20261009,BUY,100,230,-23000,-23000,0,,101',
    'TEST,OPT,EXAMPLE PUT,20261009,BUY,1,0,0,0,0,,102',
    'TEST,STK,EXAMPLE,20261009,BUY,1,230,-230,-231,-1,101,103',
  ].join('\n');
  const rows = parseFlexCsv(csv);
  assert.deepEqual(rows.map(row => row.key), ['TEST:trade:101', 'TEST:trade:102', 'TEST:101']);
  assert.equal(rows[1].price, 0);
  assert.equal(rows[1].proceeds, 0);
  assert.equal(new Set([...rows, ...parseFlexCsv(csv)].map(row => row.key)).size, 3);
  assert.equal(parseFlexCsv(csv.replaceAll('TEST,', 'OTHER,'))[0].key, 'OTHER:trade:101');
});
test('ExecID column may be absent when TradeID is present', () => {
  assert.equal(parseFlexCsv(header.replace('ExecID,', '') + 'TEST,OPT,EXAMPLE,20261009,BUY,1,0,0,0,0,102')[0].key, 'TEST:trade:102');
});
test('unidentifiable or invalid records still fail validation', () => {
  assert.throws(() => parseFlexCsv(header + 'TEST,OPT,EXAMPLE,20261009,BUY,1,0,0,0,0,,'), /ExecID 和 TradeID/);
  assert.throws(() => parseFlexCsv(header + 'TEST,OPT,EXAMPLE,20261009,BUY,1,invalid,0,0,0,,102'), /无效成交/);
});
