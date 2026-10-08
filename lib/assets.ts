export const assetClasses = [
  ["STK", "股票"],
  ["OPT", "期权"],
  ["FUT", "期货"],
  ["CASH", "外汇现货"],
] as const;

export type AssetClass = typeof assetClasses[number][0];
export const assetName = (asset: string) => assetClasses.find(([code]) => code === asset)?.[1] ?? asset;
