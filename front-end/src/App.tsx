import './App.css'
import { Heatmap } from './Heatmap'
import useWindowDimensions from './useWindowDimensions'
import React from 'react'
import { csv } from 'd3'
import 'bootstrap/dist/css/bootstrap.css'
import { Typeahead } from 'react-bootstrap-typeahead'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import DropdownButton from 'react-bootstrap/DropdownButton'
import Dropdown from 'react-bootstrap/Dropdown'
import { Stock, Option } from './types'
import { initTicker, initStockData, initOption, initChartData } from './init/init'
import { getStockInfo, capitalize, stringifyMetric, fetchOptionData } from './utils'

const App = (): JSX.Element => {
  // send initial request to API with defaults
  React.useEffect(() => {
    loadNewStock(initTicker)
  }, [])

  // initialize states
  const [options, setOptions] = React.useState([initOption])
  const [direction, setDirection] = React.useState('call')
  const [metric, setMetric] = React.useState('volume')
  const [changeType, setChangeType] = React.useState('ticker')
  const [chartData, setChartData] = React.useState([initChartData])
  const [stockInfo, setStockInfo] = React.useState(initStockData)

  // update chart when ticker, direction, or metric changes
  React.useEffect(() => {
    changeChartData()
  }, [stockInfo, direction, metric])

  const loadNewStock = async (ticker: string): Promise<void> => {
    console.log(`ticker: ${ticker}`)
    setChangeType('ticker')

    const data = await fetchOptionData(initTicker);
    // TODO: format API data so that it matches the `option` interface
    // setOptions(data)

    // parse stock info from API response
    const stockInfo = {
      ticker: data.ticker,
      description: data.description,
      price: data.price,
      change_percentage: data.change_percentage
    };
    setStockInfo(stockInfo)

    console.log('Loaded data from API.')
  }



  const changeDirection = (direction: string | null): void => {
    console.log(`direction: ${direction}`)
    if (direction === null) {
      console.log('cannot change direction to `null`')
    } else {
      setChangeType('direction')
      setDirection(direction)
    }
  }

  const changeMetric = (metric: string | null): void => {
    console.log(`metric: ${metric}`)
    if (metric === null) {
      console.log('cannot change metric to `null`')
    } else {
      setChangeType('metric')
      setMetric(metric)
    }
  }

  // set data to display in heatmap
  // based on user selection of direction and metric
  const changeChartData = (): void => {
    console.log('filtering options for selected metric and direction')
    const metricStr = stringifyMetric(metric)
    const chartData = options
      // filter for calls or puts
      .filter((option) => option.direction === direction)
      // select relevent metric and format values for display
      .map((option) => ({
        symbol: option.symbol,
        strike: `$${option.strike.replace(/.0$/, '')}`,
        date_str: option.date_str,
        value: option[metric as keyof typeof option],
        tooltipContent: `<b>strike: </b>$${option.strike.replace(/.0$/, '')}<br>
                        <b>date: </b>${option.date_str}<br>
                        <b>${metricStr.toLowerCase()}: </b>${option[metric as keyof typeof option].replace(/.0$/, '')}`
      }))
    console.log('setting chart data')
    setChartData(chartData)
  }

  return (
    <div className='App'>
      <header className='App-header'>
        <Container fluid style={{ display: 'flow' }}>
          <Row
            className='d-flex justify-content-center'
            style={{
              padding: '1.5% 32% 1.5% 34%',
              backgroundColor: '#2f343d',
              position: 'static'
            }}
          >
            <Col>
              {/* <Typeahead
                defaultSelected={[initTicker]}
                onChange={(t) => {
                  t[0] ? changeTicker(t[0] as string) : console.log('ticker: [empty]')
                }}
                emptyLabel='Ticker not found.'
                highlightOnlyResult={false}
                minLength={1}
                options={tickers}
                id='autocomplete-search'
              /> */}
            </Col>
            <Col>
              <DropdownButton
                id='dropdown-direction'
                className='d-flex justify-content-center'
                menuVariant='dark'
                variant='secondary'
                onSelect={(direction) => { changeDirection(direction) }}
                title={capitalize(direction)+'s'}
              >
                <Dropdown.Item eventKey='call'> Calls </Dropdown.Item>
                <Dropdown.Item eventKey='put'> Puts </Dropdown.Item>
              </DropdownButton>
            </Col>
            <Col>
              <DropdownButton
                id='dropdown-direction'
                className='d-flex justify-content-center'
                menuVariant='dark'
                variant='secondary'
                onSelect={(m) => { changeMetric(m) }}
                title={stringifyMetric(metric)}
              >
                <Dropdown.Item eventKey='volume'> Volume </Dropdown.Item>
                <Dropdown.Item eventKey='open_interest'> Open Interest </Dropdown.Item>
                <Dropdown.Item eventKey='price'> Price </Dropdown.Item>
                <Dropdown.Item eventKey='spread'> Spread </Dropdown.Item>
                <Dropdown.Item eventKey='delta'> Delta </Dropdown.Item>
                <Dropdown.Item eventKey='gamma'> Gamma </Dropdown.Item>
                <Dropdown.Item eventKey='theta'> Theta </Dropdown.Item>
                <Dropdown.Item eventKey='vega'> Vega </Dropdown.Item>
                <Dropdown.Item eventKey='rho'> Rho </Dropdown.Item>
                <Dropdown.Item eventKey='phi'> Phi </Dropdown.Item>
              </DropdownButton>
            </Col>
          </Row>
          <Row>
            <Heatmap
              stockData={stockInfo}
              metric_str={stringifyMetric(metric)}
              direction={direction}
              data={chartData}
              dims={useWindowDimensions()}
              changeType={changeType}
            />
          </Row>
        </Container>
      </header>
    </div>
  )
}

export default App
