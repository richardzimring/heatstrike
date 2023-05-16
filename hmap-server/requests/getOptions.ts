import axios from 'axios';
import dotenv from 'dotenv';
import { OptionData, FlatOptionData, OptionChainSummary } from '../types/options';

const TRADIER_KEY = process.env.TRADIER_KEY;

export async function fetchOptionData(ticker: string, expirationDates: string[]): Promise<OptionChainSummary> {
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
  const filtered: FlatOptionData[][] = optionChains
    .map((chain: any) => chain.map((option: any) => {
      return {
        symbol: option.symbol,
        strike: option.strike,
        option_type: option.option_type,
        volume: option.volume,
        open_interest: option.open_interest,
        price: ((option.ask + option.bid)/2).toFixed(2),
        spread: (option.ask - option.bid).toFixed(2),
        delta: option.greeks.delta,
        gamma: option.greeks.gamma,
        theta: option.greeks.theta,
        vega: option.greeks.vega,
        rho: option.greeks.rho,
        phi: option.greeks.phi,
      };
    }));

  // get unique strikes from all option chains
  const uniqueStrikes = [...new Set(filtered.flatMap(options => options.map(option => option.strike)))];

  return {
    strikes: uniqueStrikes,
    updated_at: optionChains[0][0].greeks.updated_at,
    options: filtered
  };
}