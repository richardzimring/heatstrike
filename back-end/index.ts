const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const express = require("express");
const serverless = require("serverless-http");
const app = express();

import { fetchExpirationDates } from "./requests/getDates";
import { fetchOptionData } from "./requests/getOptions";
import { fetchQuote } from "./requests/getQuote";
import { stringifyDates } from "./utils";

const OPTIONS_TABLE = process.env.OPTIONS_TABLE;
const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

app.get("/data/:ticker", async function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");

  const ticker = req.params.ticker;

  // check if ticker has been cached in DynamoDB 
  const { Item } = await ddbDocClient.send(
    new GetCommand({
      TableName: OPTIONS_TABLE,
      Key: {
        ticker: ticker,
      },
    })
  );

  // if data exists in dynamoDB and date is within the last hour, return cached data
  if (Item && new Date(Item.updated_at).getTime() > Date.now() - 1000 * 60 * 60) {
    console.log("using data from dynamoDB cache")
    res.json(Item);
    return;
  }
  
  console.log("cached data either not found or expired. fetching data from Tradier...")

  try {
    // get expiration dates
    const expirationDatesPromise = fetchExpirationDates(ticker);

    // get general stock info data
    const quoteDataPromise = fetchQuote(ticker);
    
    // fetch data concurrently
    let [expirationDates, stockData] = await Promise.all([expirationDatesPromise, quoteDataPromise]);

    // save at most the first 8 expiration dates
    expirationDates = expirationDates.slice(0, 8);
    const expirationDatesStringified = stringifyDates(expirationDates);
  
    // get options chains
    const optionData = await fetchOptionData(ticker, parseFloat(stockData.price), expirationDates, expirationDatesStringified);

    const response = {
      ...stockData,
      expirationDates,
      expirationDatesStringified,
      ...optionData
    };
    res.json(response);

    // save response to dynamoDB cache
    console.log("saving to dynamoDB");
    await ddbDocClient.send(
      new PutCommand({
        TableName: OPTIONS_TABLE,
        Item: response,
      })
    );

  } catch (error) {
    const errorResponse = {
      ticker: ticker,
      updated_at: new Date().toISOString(),
      message: error.message
    };

    res.json(errorResponse);
    
    // save error response to dynamoDB cache
    console.log("saving to dynamoDB");
    await ddbDocClient.send(
      new PutCommand({
        TableName: OPTIONS_TABLE,
        Item: errorResponse,
      })
    );
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
