import { Stock, Option } from '../types'

export const initTicker = 'AAPL'

export const initStockData: Stock = {
  ticker: '',
  description: '',
  price: '',
  change_percentage: ''
}

export const initOption: Option = {
  symbol: '',
  direction: 'call',
  date: '',
  date_str: '',
  strike: '',
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
  ticker: '',
  description: '',
  price: '',
  change_percentage: '',
  expirationDates: [''],
  expirationDatesStringified: [''],
  strikes: [''],
  updated_at: '',
  options: [{calls: [initOption], puts: [initOption]}]
}

export const initChartData = {
  symbol: '',
  strike: '',
  date_str: '',
  value: '',
  tooltipContent: 'tooltipContent'
}
