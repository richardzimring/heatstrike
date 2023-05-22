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

export const initData = {
  ticker: 'SNDL',
  description: 'Sundial Growers Inc',
  price: '0.8',
  change_percentage: '+0.1',
  expirationDates: ['2022-04-29'],
  expirationDatesStringified: ['Apr 29'],
  strikes: ['3.5'],
  updated_at: '2021-04-29',
  options: [{calls: [initOption], puts: [initOption]}]
}

export const initChartData = {
  symbol: 'SNDL220429C00010000',
  strike: '3.5',
  date_str: 'Apr 29',
  value: '2000',
  tooltipContent: 'tooltipContent'
}
