<script lang="ts">
// import HelloWorld from './components/HelloWorld.vue'
// import TheWelcome from './components/TheWelcome.vue'

import axios from 'axios';

// const tradierKey = 'Bearer ' + process.env.VITE_TRADIER_KEY
// export tradier_key="3AljpLEMJRAGWauIXPgqz5U1HmcA"
// export tradier_key2="Vo0D6hIGquflmSV9WSugJRKta8t3"
const tradierKey = '3AljpLEMJRAGWauIXPgqz5U1HmcA'

export default {
  name: 'Heatmap',
  data() {
    return {
      // TODO: look into front end defaults, loading behaviors
      selectedTicker: 'TSLA',
      selectedDirection: 'call',
      selectedMetric: 'delta',
      // TODO: make seperate API call to get live stock price and stock info
      stockData: {
        ticker: '',
        fullName: '',
        price: 0,
      },
      optionsData: {
        expirationDates: [],
        strikes: [],
        chains: [{}],
      },
      displayData: {}
    }
  },
  methods: {

    async fetchExpirationDates(ticker: string) {
      try {
        const endpoint = 'https://sandbox.tradier.com/v1/markets/options/expirations'
        const response = await axios.get(endpoint, {
          params: { symbol: ticker },
          headers: { Authorization: `Bearer ${tradierKey}`, Accept: 'application/json' }
        });

        this.optionsData.expirationDates = response.data.expirations.date
      }
      catch (error) {
        console.log(error)
      }
    },

    // send requests to Tradier API in parallel
    // Tradier greeks only updates once per hour during market hours
    // TODO: Cache data in DB 
    // if market is open, check if DB has the option chain within the last hour
    // if market is closed, check if DB has the option chain within the last 24 hours
    // to avoid sending unnecessary requests
    async fetchOptionData(ticker: string) {
      try {
        const endpoint = 'https://sandbox.tradier.com/v1/markets/options/chains'
        const requests = this.optionsData.expirationDates.map((date: string) => {
          return axios.get(endpoint, {
            params: {
              symbol: ticker,
              expiration: date,
              greeks: true
            },
            headers: {
              Authorization: `Bearer ${tradierKey}`,
              Accept: 'application/json'
            }
          });
        });
        
        const responses = await axios.all(requests)

        // filter response to relevent metrics
        this.optionsData.chains = responses
          .map((response: any) => response.data.options.option)
          .map((chain: any) => chain.map((option: any) => {
            return {
              symbol: option.symbol,
              strike: option.strike,
              option_type: option.option_type,
              volume: option.volume,
              open_interest: option.open_interest,
              delta: option.greeks.delta,
              gamma: option.greeks.gamma,
              theta: option.greeks.theta,
              vega: option.greeks.vega,
              rho: option.greeks.rho,
              phi: option.greeks.phi,
              updated_at: option.greeks.updated_at,
            };
          }));
        
      } catch (error) {
        console.log(error)
      }
    },

    // get data to display in heatmap
    // based on user selection of direction and metric
    filterToDisplay(direction: string, metric: string) {
      this.displayData = this.optionsData.chains.map((chain: any) => chain
        .filter((option: any) => { return option.option_type === direction })
        .map((option: any) => { return option[metric] })
    )}

  },

  // computed: {


  // },

  async mounted() {
    await this.fetchExpirationDates(this.selectedTicker)
    await this.fetchOptionData(this.selectedTicker)
    this.filterToDisplay(this.selectedDirection, this.selectedMetric)
  }
}
</script>

<template>
  <!-- {{optionsData.expirationDates}} -->

  {{displayData}}
  <!-- <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />
    </div>
  </header>

  <main>
  </main> -->
</template>

<style scoped>
header {
  line-height: 1.5;
}

/* .logo {
  display: block;
  margin: 0 auto 2rem;
} */

/* @media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
} */
</style>
