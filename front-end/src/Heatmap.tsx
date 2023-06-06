import React from 'react'
import * as d3 from 'd3'
import { HeatmapData } from './types'
import { capitalize } from './utils'

export const Heatmap = (props: HeatmapData): JSX.Element => {
  const { stockData, metric_str, direction, data, dates, strikes, dims, changeType } = props
  const { ticker, description, price, change_percentage, updated_at } = stockData

  // redraw chart if the data or window dimensions change
  React.useEffect(() => {
    drawChart()
  }, [data, dims])

  function drawChart () {
    // if page still loading, do nothing
    if (ticker === '') {
      return;
    }

    // color mapping
    const [min, max] = d3.extent(data, o => parseFloat(o.value)) as number[]
    const color = (direction === 'call') ? 'darkgreen' : 'darkred'
    const colorScale = d3.scaleSqrt<string>()
      .domain([min, max])
      .range(['white', color])

    if (changeType !== 'ticker') {
      const svg = d3.select('#container')

      // update title
      svg.select('text.title')
        .text(`${ticker} ${capitalize(direction)} Options, ${metric_str}`)

      // update rectangles (+ animate change)
      svg.selectAll('rect')
        .data(data.filter(d => d.value !== ''))
        .transition()
        .duration(500)
        .style('fill', d => colorScale(Number(d.value)))

    } else {
      // delete the entire previous chart and draw a new one
      d3.select('#container')
        .select('svg')
        .remove()
      d3.select('#container')
        .select('.tooltip')
        .remove()

      const Dimensions = {
        width: 0.75 * dims.width,
        height: 0.85 * dims.height,
        pad: 0.04
      }

      const Margin = {
        top: (1 / 7) * Dimensions.height,
        left: (1 / 8.5) * Dimensions.width,
        bottom: (1 / 8) * Dimensions.height,
        right: (1 / 10) * Dimensions.width
      }

      const x = d3.scaleBand()
        .range([0, Dimensions.width - (Margin.left + Margin.right)])
        .domain(dates)
        .padding(Dimensions.pad)

      const y = d3.scaleBand()
        .range([Dimensions.height - (Margin.top + Margin.bottom), 0])
        .domain(strikes)
        .padding(Dimensions.pad)

      // define the size and position of svg
      const svg = d3.select('#container')
        .append('svg')
        .attr('width', Dimensions.width)
        .attr('height', Dimensions.height)
        .append('g')

      // title
      svg.append('text')
        .text(`${ticker} ${capitalize(direction)} Options, ${metric_str}`)
        .attr('x', 1.05 * Margin.left)
        .attr('y', 0.67 * Margin.top)
        .attr('class', 'title')
        .attr('fill', 'white')
        .style('font-size', '1.4em')

      // subtitle
      svg.append('text')
        .text(`${description}: $${price} (${change_percentage}%)`)
        .attr('x', 1.05 * Margin.left)
        .attr('y', 0.90 * Margin.top)
        .attr('fill', 'lightgray')
        .style('font-size', '0.53em')

      const currentTime = Date.now()
      // time zone is 5 hours ahead
      const updatedTime = new Date(updated_at).getTime() - 1000*60*60*5
      const timeDifSeconds = Math.floor((currentTime - updatedTime) / 1000)
      const timeDifMinutes = Math.floor(timeDifSeconds / 60)
      const timeDifHours = Math.floor(timeDifMinutes / 60)
      const timeDifDays = Math.floor(timeDifHours / 24)

      let timeDifString, plural
      if (timeDifDays > 0) {
        plural = (timeDifDays > 1) ? 's' : ''
        timeDifString = `${timeDifDays} day${plural}`
      } else if (timeDifHours > 0) {
        plural = (timeDifHours > 1) ? 's' : ''
        timeDifString = `${timeDifHours} hour${plural}`
      } else if (timeDifMinutes > 0) {
        plural = (timeDifMinutes > 1) ? 's' : ''
        timeDifString = `${timeDifMinutes} minute${plural}`
      } else {
        plural = (timeDifSeconds > 1) ? 's' : ''
        timeDifString = `${timeDifSeconds} second${plural}`
      }

      // "Last Updated" label
      svg.append('text')
        .text(`Updated ~${timeDifString} ago. Data updates every 60 minutes during regular trading hours.`)
        .attr('x', Dimensions.width - Margin.right)
        .attr('y', 0.99 * Dimensions.height)
        .attr('fill', 'gray')
        .style('font-size', '0.4em')
        .attr('text-anchor', 'end')

      // date labels
      svg.append('g')
        .style('font-size', '0.5em')
        .call(d3.axisBottom(x).tickSize(0))
        .attr('transform', `translate(${Margin.left},
                                      ${Dimensions.height - 0.9 * Margin.bottom})`)
        .select('.domain').remove()

      // x axis title
      svg.append('text')
        .text('Expiration Date')
        .style('font-size', '0.5em')
        .attr('transform', `translate(${Dimensions.width / 1.95},
                                      ${Dimensions.height - 0.4 * Margin.bottom})`)
        .style('text-anchor', 'middle')
        .attr('fill', 'lightgray')

      // strike labels
      svg.append('g')
        .style('font-size', '0.55em')
        .call(d3.axisLeft(y)
          .tickSize(0))
        .attr('transform', `translate(${0.95 * Margin.left},
                                      ${Margin.top})`)
        .select('.domain').remove()

      // y axis title
      svg.append('text')
        .text('Strike Price')
        .style('font-size', '0.55em')
        .attr('transform', `translate(${0.35 * Margin.left},
                                      ${0.5 * Dimensions.height})
                            rotate(-90)`)
        .style('text-anchor', 'middle')
        .attr('fill', 'lightgray')

      // create tooltip
      const tooltip = d3.select('#container')
        .append('div')
        .style('opacity', 0)
        .attr('class', 'tooltip')
        .style('font-size', '0.5em')
        .style('line-height', '1em')
        .style('background-color', '#282c34')
        .style('width', '0.1')
        .style('height', '0.1')
        .style('border', 'solid')
        .style('border-width', '1px')
        .style('border-radius', '2px')
        .style('padding', '3px')

      const mouseover = function (this: any, event: any, d: any): void {
        tooltip.style('opacity', 0.85)
        d3.select(this)
          .style('stroke', 'black')
          .style('stroke-width', '1.5px')
          .style('opacity', 1)
      }

      const mousemove = function (event: any, d: any): void {
        tooltip.style('top', `${event.pageY - 30}px`)
          .style('left', `${event.pageX + 30}px`)
          .html(d.tooltipContent)
      }

      const mouseleave = function (this: any, event: any, d: any): void {
        tooltip.style('opacity', 0)
        d3.select(this)
          .style('stroke', 'none')
          .style('opacity', 0.88)
      }

      const click = function (event: any, d: any): void {
        const t = ticker.replace('/', '')
        const baseUrl = 'https://www.nasdaq.com/market-activity/stocks'
        const symbolID = `${'-'.repeat(4 - t.length)}${d.symbol.substring(t.length)}`
        window.open(`${baseUrl}/${ticker.replace('/','.')}/option-chain/call-put-options/${t}--${symbolID}`)
      }

      // adjust grid spacing to be constant
      let xPad: number, yPad: number
      if (x.bandwidth() < y.bandwidth()) {
        xPad = 0
        yPad = Dimensions.pad * (y.bandwidth() - x.bandwidth())
      } else {
        xPad = Dimensions.pad * (x.bandwidth() - y.bandwidth())
        yPad = 0
      }

      // draw rectangles
      svg.selectAll()
        .data(data.filter(d => d.value !== '')) // option exists for this strike and date
        .join('rect')
        .attr('x', d => x(d.date_str) ?? '')
        .attr('y', d => y(d.strike) ?? '')
        .attr('width', x.bandwidth() + xPad)
        .attr('height', y.bandwidth() + yPad)
        .style('fill', d => colorScale(Number(d.value)))
        .style('opacity', 0.88)
        .attr('transform', `translate(${Margin.left}, ${Margin.top})`)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave)
        .on('click', click)
    }
  }

  return <div id='container' className='d-flex justify-content-center' />
}
