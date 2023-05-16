import axios from 'axios';
import dotenv from 'dotenv';
import DatesResponse from '../types/datesResponse';
const TRADIER_KEY = process.env.TRADIER_KEY;

export async function fetchExpirationDates(ticker: string): Promise<string[]> {
  const endpoint = 'https://sandbox.tradier.com/v1/markets/options/expirations'
  const response: DatesResponse = await axios.get(endpoint, {
    params: { symbol: ticker },
    headers: { Authorization: `Bearer ${TRADIER_KEY}`, Accept: 'application/json' }
  });

  // handle invalid ticker
  if (response.data.expirations === null) {
    throw new Error('Invalid ticker')
  }

  return response.data.expirations.date
}