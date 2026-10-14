import test from 'node:test';
import assert from 'node:assert/strict';
import { tradeCashFlow, totalCashFlow } from '../lib/cash-flow.ts';

const stock = { assetClass: 'STK', proceeds: -100, netCash: -101, commission: -1 };
const option = { assetClass: 'OPT', proceeds: 250, netCash: 249, commission: -1 };
const future = { assetClass: 'FUT', proceeds: -40000, netCash: -0.5, commission: -0.5 };
const forex = { assetClass: 'CASH', proceeds: 300, netCash: 297, commission: -3 };

test('all asset classes use raw signed Proceeds without adding or subtracting fees', () => {
  for (const trade of [stock, option, future, forex]) {
    const before = { ...trade };
    assert.equal(tradeCashFlow(trade), trade.proceeds);
    assert.deepEqual(trade, before);
    assert.equal(tradeCashFlow({ ...trade, netCash: 999, commission: 100 }), trade.proceeds);
  }
});
test('totals include futures nominal amounts and sum Proceeds, not NetCash', () => {
  assert.equal(totalCashFlow([future]), -40000);
  assert.equal(totalCashFlow([stock, option, future, forex]), -39550);
  assert.equal(totalCashFlow([]), 0);
});
test('fully offset futures Proceeds sum to gross trading result without changing fees', () => {
  const buy={...future,proceeds:-500};
  const sell={...future,proceeds:490};
  assert.equal(totalCashFlow([buy,sell]), -10);
  assert.equal(buy.commission + sell.commission, -1);
});
