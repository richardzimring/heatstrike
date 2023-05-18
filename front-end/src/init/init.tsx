import { Stock, Option } from '../types'

export const initTicker = 'AAPL'

export const initStockData: Stock = {
  ticker: '?',
  description: '?',
  price: '?',
  change_percentage: '+?'
}

export const initOption: Option = {
  symbol: 'SNDL220429C00010000',
  direction: 'call',
  date: '2022-04-29',
  date_str: 'Apr 29',
  strike: '3.5',
  volume: '',
  open_interest: '',
  price: '',
  spread: '',
  delta: '',
  gamma: '',
  theta: '',
  vega: '',
  rho: '',
  phi: ''
}

export const initChartData = {
  symbol: 'SNDL220429C00010000',
  strike: '3.5',
  date_str: 'Apr 29',
  value: '2000',
  tooltipContent: 'tooltipContent'
}
