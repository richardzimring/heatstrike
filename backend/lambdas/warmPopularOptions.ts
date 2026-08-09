import {
  INDEX_TICKERS,
} from '../src/constants';
import { readPopularSymbolsFromS3 } from '../src/services/popularTickers';
import { getOptionsData } from '../src/services/optionsService';
import type { OptionsDataResponse } from '../src/schemas/options';

function isOptionsData(
  result: Awaited<ReturnType<typeof getOptionsData>>,
): result is OptionsDataResponse {
  return 'options' in result && Array.isArray(result.options);
}

export const handler = async (): Promise<void> => {
  const popularTickers = await readPopularSymbolsFromS3();
  const tickers = [...new Set([...INDEX_TICKERS, ...popularTickers])];
  console.log(
    `Warming explorer options chains for ${tickers.length} tickers (${INDEX_TICKERS.length} index + ${popularTickers.length} popular)...`,
  );

  let ready = 0;
  let processing = 0;
  let failed = 0;

  // Sequential to stay within Tradier rate limits / Lambda memory.
  for (const ticker of tickers) {
    try {
      const result = await getOptionsData(ticker);
      if (isOptionsData(result)) {
        ready += 1;
        console.log(`Ready: ${ticker}`);
      } else if ('status' in result && result.status === 'processing') {
        processing += 1;
        console.log(`Processing: ${ticker}`);
      } else {
        failed += 1;
        console.warn(`Error result for ${ticker}`);
      }
    } catch (err) {
      failed += 1;
      console.error(`Failed warming ${ticker}:`, err);
    }
  }

  console.log(
    `Options warm complete: ready=${ready} processing=${processing} failed=${failed}`,
  );
};
