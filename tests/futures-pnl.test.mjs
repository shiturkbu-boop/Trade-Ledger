import test from 'node:test';
import assert from 'node:assert/strict';
import { futuresPnl } from '../lib/futures-pnl.ts';
const t = (id, side, price, quantity = 1, extra = {}) => ({ key: `test:${id}`, tradeDate: '2025-01-01', time: id, assetClass: 'FUT', symbol: 'MESZ6', expiry: '20261218', currency: 'USD', multiplier: 5, side, price, quantity, commission: -0.61 * quantity, ...extra });
test('synthetic MES long and short round trips include both signed fees', () => {
  const rows = [t('01', 'BUY', 100), t('02', 'SELL', 92.5), t('03', 'SELL', 109.5), t('04', 'BUY', 107.75)];
  const p = futuresPnl(rows.slice().reverse());
  assert.equal(p.get('test:01').closed, 0);
  assert.equal(p.get('test:02').gross, -37.5);
  assert.ok(Math.abs(p.get('test:02').net + 38.72) < 1e-9);
  assert.ok(Math.abs(p.get('test:04').net - 7.53) < 1e-9);
  assert.ok(Math.abs([...p.values()].reduce((n, x) => n + x.net, 0) + 31.19) < 1e-9);
});
test('FIFO partial fills, overnight close and reversal allocate each fee exactly once', () => {
  const rows = [t('01','BUY',100,2,{commission:-2}),t('02','BUY',110,1,{commission:1}),t('03','SELL',120,4,{commission:-4,tradeDate:'2025-01-02'}),t('04','BUY',115,1,{commission:-1,tradeDate:'2025-01-03'})];
  const p=futuresPnl(rows);
  assert.deepEqual(p.get('test:03'),{gross:250,net:246,closed:3});
  assert.deepEqual(p.get('test:04'),{gross:25,net:23,closed:1});
});
test('accounts, expiry months, currencies and symbols never pair together', () => {
  for (const change of [{key:'other:02'},{expiry:'20270319'},{currency:'HKD'},{symbol:'MESH7'}]) {
    assert.equal(futuresPnl([t('01','BUY',100),t('02','SELL',110,1,change)]).get(change.key || 'test:02').closed,0);
  }
});
test('arbitrary multiplier, rebates and no valid multiplier', () => {
  assert.equal(futuresPnl([t('01','SELL',100,2,{multiplier:1000,commission:2}),t('02','BUY',99,2,{multiplier:1000,commission:-2})]).get('test:02').net,2000);
  assert.equal(futuresPnl([t('01','BUY',100,1,{multiplier:0})]).has('test:01'),false);
});
