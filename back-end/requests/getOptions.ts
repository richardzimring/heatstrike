import axios from 'axios';
import dotenv from 'dotenv';
import { OptionData, Option, OptionChainSummary, OptionChain } from '../types/options';
import { EmptyOption } from '../utils';

const TRADIER_KEY = process.env.TRADIER_KEY;

export async function fetchOptionData(ticker: string, stockPrice: number, expirationDates: string[], expirationDatesStringified: string[]): Promise<OptionChainSummary> {
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
        delta: option.greeks.delta.toFixed(6).toString(),
        gamma: option.greeks.gamma.toFixed(6).toString(),
        theta: option.greeks.theta.toFixed(6).toString(),
        vega: option.greeks.vega.toFixed(6).toString(),
        rho: option.greeks.rho.toFixed(6).toString(),
        phi: option.greeks.phi.toFixed(6).toString(),
      };
    }));

  // get unique strikes from all option chains
  const uniqueStrikes = [...new Set(filtered.flatMap(options => options.map(option => parseFloat(option.strike))))].sort((a, b) => (a - b)).map(strike => strike.toString());

  // get index of strike closest in value to stock price
  const stockPriceIndex = uniqueStrikes.findIndex(strike => parseFloat(strike) > stockPrice);
  
  const desiredStrikes = uniqueStrikes
    // only integer strikes
    .filter(strike => !strike.includes('.'))
    // only strikes within 5 strikes of the current stock price
    .filter((strike, index) => Math.abs(index - stockPriceIndex) < 5).map(strike => strike.toString());

  // Populate output with empty options
  let formatted: OptionChain[] = Array(expirationDates.length);
  for (let d = 0; d < expirationDates.length; d++) {
    let date = expirationDates[d];
    let date_str = expirationDatesStringified[d];

    // Initialize output structure
    formatted[d] = {
      calls: Array(desiredStrikes.length),
      puts: Array(desiredStrikes.length)
    };

    for (let s = 0; s < desiredStrikes.length; s++) {
      formatted[d].calls[s] = EmptyOption(ticker, 'call', date, date_str, desiredStrikes[s]);
      formatted[d].puts[s] = EmptyOption(ticker, 'put', date, date_str, desiredStrikes[s]);
    };
  }

  // Populate output with existing option data
  for (let d = 0; d < expirationDates.length; d++) {
    for (let s = 0; s < desiredStrikes.length; s++) {
      let strike = desiredStrikes[s];

      // search each option chain for the desired strike O(n^3)
      // TODO: improve this algorithm using sorting invariant
      for (let i = 0; i < filtered[d].length; i++) {
        let option = filtered[d][i];

        if (option.strike === strike && option.direction === 'call') {
          formatted[d].calls[s] = option;
        }
        else if (option.strike === strike && option.direction === 'put') {
          formatted[d].puts[s] = option;
        }
      }
    }
  }

  return {
    strikes: desiredStrikes.map(strike => `$${strike}`),
    updated_at: optionChains[0][0].greeks.updated_at,
    options: formatted
  };
}