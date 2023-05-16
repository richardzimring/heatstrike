<script lang="ts">
// import HelloWorld from './components/HelloWorld.vue'
// import TheWelcome from './components/TheWelcome.vue'

import axios from 'axios';
import { type GetDataResponse } from "./types/types";

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
      stockData: {
        ticker: '',
        description: '',
        price: 0,
      },
      optionsData: {
        expirationDates: [''],
        strikes: [0],
        chains: [[{}]],
      },
      displayData: {}
    }
  },
  methods: {

    async fetchOptionData(ticker: string) {
      try {
        const endpoint = `https://2i7z2aank8.execute-api.us-east-2.amazonaws.com/data/${ticker}`
        const response: GetDataResponse = await axios.get(endpoint);

        // update Vue object
        this.stockData.ticker = response.data.symbol
        this.stockData.description = response.data.description
        this.stockData.price = response.data.price
        this.optionsData.expirationDates = response.data.expirationDates
        this.optionsData.strikes = response.data.strikes
        this.optionsData.chains = response.data.options

      }
      catch (error) {

        // if (error.message === 'Invalid ticker') {

        // }

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
    await this.fetchOptionData(this.selectedTicker)
    this.filterToDisplay(this.selectedDirection, this.selectedMetric)
  }
}
</script>

<template>
  <!-- {{optionsData.expirationDates}} -->

  <!-- // update Vue object
        this.stockData.ticker = response.data.symbol
        this.stockData.description = response.data.description
        this.stockData.price = response.data.price
        this.optionsData.expirationDates = response.data.expirationDates
        this.optionsData.strikes = response.data.strikes
        this.optionsData.chains = response.data.options -->

  ticker: {{stockData.ticker}} <br>
  description: {{stockData.description}} <br>
  price: {{stockData.price}} <br>
  expirationDates: {{optionsData.expirationDates}} <br>
  strikes: {{optionsData.strikes}} <br>
  <!-- data to display: {{displayData}} -->


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
