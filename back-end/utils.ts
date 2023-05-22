// convert expiration dates to an abbrevieated word format

import { Option } from "./types/options";

// e.g. 01-05-2021 => "Jan 5"
export function stringifyDates(dates: string[]): string[] {
  const months = ["Jan", "Feb", "Mar", "Apr",
                  "May", "June", "Jul", "Aug",
                  "Sep", "Oct", "Nov", "Dec"];

  const stringifiedDates = dates.map(date => {
    const [year, month, day] = date.split("-");
    return `${months[parseInt(month) - 1]} ${parseInt(day)}`;
  });

  return stringifiedDates;
}

export function EmptyOption(ticker, direction, date, date_str, strike): Option {
  return {
    symbol: ticker,
    direction: direction,
    date: date,
    date_str: date_str,
    strike: strike,
    volume: '',
    open_interest: '',
    price: '',
    spread: '',
    delta: '',
    gamma: '',
    theta: '',
    vega: '',
    rho: '',
    phi: '',
  };
};
  