import axios from 'axios';
import dotenv from 'dotenv';
import { OptionData, Option, OptionChainSummary } from '../types/options';
import { EmptyOption } from '../utils';

const TRADIER_KEY = process.env.TRADIER_KEY;

export async function fetchOptionData(ticker: string, expirationDates: string[], expirationDatesStringified: string[]): Promise<OptionChainSummary> {
  const endpoint = 'https://sandbox.tradier.com/v1/markets/options/chains'
  const requests = expirationDates.map((date: string) => {
    return axios.get(endpoint, {
      params: {
        symbol: ticker,
        expiration: date,
        greeks: true
      },
      headers: {
        Authorization: `Bearer ${TRADIER_KEY}`,
        Accept: 'application/json'
      }
    });
  });
  
  // retrieve option chains for all dates concurrently
  const responses = await axios.all(requests)

  // extract option chains from responses
  const optionChains: OptionData[][] = responses
    .map((response: any) => response.data.options.option)

  // filter and combine option chains to relevent metrics
  const filtered: Option[][] = optionChains
    .map((chain: OptionData[], date_index: number) => chain.map((option: OptionData) => {
      return {
        symbol: option.symbol,
        direction: option.option_type,
        date: expirationDates[date_index],
        date_str: expirationDatesStringified[date_index],
        strike: option.strike.toString(),
        volume: option.volume.toString(),
        open_interest: option.open_interest.toString(),
        price: ((option.ask + option.bid)/2).toFixed(2),
        spread: (option.ask - option.bid).toFixed(2),
        delta: option.greeks.delta.toString(),
        gamma: option.greeks.gamma.toString(),
        theta: option.greeks.theta.toString(),
        vega: option.greeks.vega.toString(),
        rho: option.greeks.rho.toString(),
        phi: option.greeks.phi.toString(),
      };
    }));

  // get unique strikes from all option chains
  const uniqueStrikes = [...new Set(filtered.flatMap(options => options.map(option => option.strike)))].reverse();

  // add empty options for strikes that are missing in each date
  for (let date_index = 0; date_index < expirationDates.length; date_index++) {
    let i = 0;

    // add empty options for calls and puts
    // TODO: make sure both are sorted in the same direction
    while (i < uniqueStrikes.length) {
      if (filtered[date_index][2*i].strike === uniqueStrikes[i]) {
        i++;
      } else {
        filtered[date_index].splice(2*i, 0, EmptyOption(ticker, 'call', expirationDates[date_index], expirationDatesStringified[date_index], uniqueStrikes[i]));
        filtered[date_index].splice(2*i+1, 0, EmptyOption(ticker, 'put', expirationDates[date_index], expirationDatesStringified[date_index], uniqueStrikes[i]));
        i++;
      }
    }
  }

  return {
    strikes: uniqueStrikes,
    updated_at: optionChains[0][0].greeks.updated_at,
    options: filtered.flat()
  };
}