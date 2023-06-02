import { GetDataResponse, Stock } from './types'
import axios from 'axios';

const emptyDataResponse = (ticker: string, description: string): GetDataResponse => {
  return {
    ticker: ticker,
    description: description,
    updated_at: '?',
    price: '?',
    change_percentage: '+?',
    expirationDates: Array(6).fill(''),
    expirationDatesStringified: Array(6).fill(''),
    strikes: Array(6).fill(''),
    options: []
  };
}

export const fetchOptionData = async (ticker: string): Promise<GetDataResponse> => {
  try {
    const endpoint = `https://2i7z2aank8.execute-api.us-east-2.amazonaws.com/data/${ticker}`
    // const endpoint = `http://localhost:3000/data/${ticker}`
    const response = await axios.get(endpoint);
    const responseData: GetDataResponse = response.data;
    return responseData;
  }
  catch (error: any) {
    console.log(`Error fetching data for ${ticker}.`)
    return emptyDataResponse(ticker, 'Error fetching data')
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
