import { GetDataResponse, Stock } from './types'
import axios from 'axios';

export const fetchOptionData = async (ticker: string): Promise<GetDataResponse> => {
  try {
    const endpoint = `https://2i7z2aank8.execute-api.us-east-2.amazonaws.com/data/${ticker}`
    const response = await axios.get(endpoint);
    const responseData: GetDataResponse = response.data;
    return responseData;

    // update Vue object
    // this.stockData.ticker = response.data.symbol
    // this.stockData.description = response.data.description
    // this.stockData.price = response.data.price
    // this.optionsData.expirationDates = response.data.expirationDates
    // this.optionsData.strikes = response.data.strikes
    // this.optionsData.chains = response.data.options

  }
  catch (error) {

    // if (error.message === 'Invalid ticker') {
      // TODO: handle this
    // }
    throw error;

    console.log(error)
  }
}

export const getStockInfo = (stocks: Stock[], ticker: string): Stock => {
  const stock = stocks.find(stock => (stock.ticker === ticker))
  if (stock === undefined) {
    console.log(`Ticker ${ticker} not found.`)
    return {
      ticker: ticker,
      description: 'Stock info not found in database.',
      price: '?',
      change_percentage: '+?'
    }
  }
  return stock
}

export const stringifyMetric = (metric: string): string => {
  if (metric === 'open_interest') {
    return 'Open Interest'
  } else {
    return capitalize(metric)
  }
}

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
