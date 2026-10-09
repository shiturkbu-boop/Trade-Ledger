import test from 'node:test';
import assert from 'node:assert/strict';
import { tradeCashFlow, totalCashFlow } from '../lib/cash-flow.ts';

const stock = { assetClass: 'STK', netCash: -101, commission: -1 };
const option = { assetClass: 'OPT', netCash: 249, commission: -1 };
const future = { assetClass: 'FUT', netCash: -0.5, proceeds: -40000, commission: -0.5 };

test('futures commission-only NetCash is not full settlement cash', () => {
  assert.equal(tradeCashFlow(future), null);
  assert.equal(tradeCashFlow({ ...future, netCash: 40000 }), null);
  assert.equal(future.netCash, -0.5);
  assert.equal(future.commission, -0.5);
});

test('mixed and futures-only totals remain unavailable, not partial sums or zero', () => {
  assert.equal(totalCashFlow([future]), null);
  assert.equal(totalCashFlow([stock, future, option]), null);
});

test('other assets preserve signed NetCash and empty selections total zero', () => {
  assert.equal(tradeCashFlow(stock), -101);
  assert.equal(tradeCashFlow(option), 249);
  assert.equal(tradeCashFlow({ assetClass: 'CASH', netCash: -3 }), -3);
  assert.equal(totalCashFlow([stock, option]), 148);
  assert.equal(totalCashFlow([]), 0);
});
