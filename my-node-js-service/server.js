const express = require("express");
const path = require("path");
const app = express();
const finnhub = require("finnhub");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");

const { MongoClient, ServerApiVersion } = require("mongodb");

const api_key = finnhub.ApiClient.instance.authentications["api_key"];
api_key.apiKey = "cmr1351r01ql2lmtd0ngcmr1351r01ql2lmtd0o0";
const finnhubClient = new finnhub.DefaultApi();
const PORT = process.env.PORT || 8080;
const uri =
  "mongodb+srv://sairam:NhZGZvKCvoJq019h@cluster0.zlxkdtl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Serve static files from the Angular dist directory
// app.use(express.static(path.join(__dirname, "stock-app/dist/stock-app")));
app.use(cors());
app.use(express.json());
app.set("trust proxy", true);

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();

    await client.db("Assignment3_database").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    databasesList = await client.db().admin().listDatabases();

    databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

app.get("/stock-symbol-lookup", (req, res) => {
  const symbol = req.query.q;
  finnhubClient.symbolSearch(symbol, (error, data, response) => {
    if (error) {
      console.error("Error:", error);
      res.status(500).send("Error fetching symbol data");
    } else {
      res.json(data);
    }
  });
});

app.get("/company-data", (req, res) => {
  const symbol = req.query.q;
  let companyData = "";
  let quoteData = "";

  const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=cmr1351r01ql2lmtd0ngcmr1351r01ql2lmtd0o0`;
  // prettier-ignore
  finnhubClient.companyProfile2({'symbol': symbol}, (error, data, response) => {
    if (error) {
      console.error("Error:", error);
      res.status(500).send("Error fetching symbol data");
    } else {
        companyData= data;
          axios.get(quoteUrl).then((response) => {
            quoteData = response.data;
           res.json({ companyData, quoteData })});

    }
  });
});

app.get("/company-peers", (req, res) => {
  const symbol = req.query.q;

  const url = `https://finnhub.io/api/v1/stock/peers?symbol=${symbol}&token=cmr1351r01ql2lmtd0ngcmr1351r01ql2lmtd0o0`;
  axios.get(url).then((response) => {
    res.json(response.data);
  });
});

app.get("/insights-data", (req, res) => {
  const symbol = req.query.q;
  const insiderSentimentUrl = `https://finnhub.io/api/v1/stock/insider-sentiment?symbol=${symbol}&from=2022-01-01&token=cmr1351r01ql2lmtd0ngcmr1351r01ql2lmtd0o0`;
  const recommendationTrendsUrl = `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=cmr1351r01ql2lmtd0ngcmr1351r01ql2lmtd0o0`;
  const companyEarningsUrl = `https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}&token=cmr1351r01ql2lmtd0ngcmr1351r01ql2lmtd0o0`;
  Promise.all([
    axios.get(insiderSentimentUrl),
    axios.get(recommendationTrendsUrl),
    axios.get(companyEarningsUrl),
  ])
    .then(
      ([
        insiderSentimentResponse,
        recommendationTrendsResponse,
        companyEarningsResponse,
      ]) => {
        const responseData = {
          insiderSentimentsData: insiderSentimentResponse.data,
          recommendationTrendsData: recommendationTrendsResponse.data,
          companyEarningsData: companyEarningsResponse.data,
        };
        res.json(responseData);
      }
    )
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
});

app.get("/summary-charts-data", (req, res) => {
  const symbol = req.query.q;
  const currentDate = new Date().toISOString().split("T")[0];

  const priorDate = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/hour/${priorDate}/${currentDate}?adjusted=true&sort=asc&apiKey=V_58CM6r1pqN8GSXt0f_By4FG27NdnCP`;
  axios.get(url).then((response) => {
    // res.json(response.data.results);

    const companyChartData = [];

    response?.data?.results?.forEach((item) => {
      let { t, c } = item;
      //   const pdtDate = new Date(t).toLocaleString("en-US", {
      //     timeZone: "America/Los_Angeles",
      //     hour12: false,
      //     year: "numeric",
      //     month: "numeric",
      //     day: "numeric",
      //     hour: "2-digit",
      //     minute: "2-digit",
      //     second: "2-digit",
      //   });

      //   const pdtTime = Number(
      //     new Date(t)
      //       .toLocaleString("en-US", {
      //         timeZone: "America/Los_Angeles",
      //         hour12: false,
      //         hour: "2-digit",
      //         minute: "2-digit",
      //       })
      //       .match(/\d{2}/)[0]
      //   );
      const pdtTime = `${new Date(t)
        .toLocaleString("en-US", {
          timeZone: "America/Los_Angeles",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })
        .padStart(5, "0")}`;

      companyChartData.push([pdtTime, c]);
    });
    console.log("The chart data is"), companyChartData;
    res.json(companyChartData);
  });
});

app.get("/news-data", (req, res) => {
  const symbol = req.query.q;
  const d = new Date();
  const currentDate = new Date();
  const oneWeekAgo = new Date(currentDate);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const fromDate = oneWeekAgo.toISOString().split("T")[0];
  const toDate = currentDate.toISOString().split("T")[0];
  finnhubClient.companyNews(
    symbol,
    fromDate,
    toDate,
    (error, data, response) => {
      if (error) {
        console.error("Error:", error);
        res.status(500).send("Error fetching symbol data");
      } else {
        res.json(data);
      }
    }
  );
});

app.get("/charts-data", (req, res) => {
  const symbol = req.query.q;

  const today = new Date().toISOString().slice(0, 10);
  const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  axios
    .get(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${twoYearsAgo}/${today}?adjusted=true&sort=asc&apiKey=ctO8iVF_Gi19afBovU1ZSr6UIxqt8Fr3`
    )
    .then((response) => {
      const ohlcData = [];
      const volumeData = [];

      response.data.results.forEach((item) => {
        let { t, v, o, h, l, c } = item;

        ohlcData.push([t, o, h, l, c]);
        volumeData.push([t, v]);
      });

      const responseData = {
        ohlcData,
        volumeData,
      };

      res.json(responseData);
    })
    .catch((error) => console.error("Error fetching data:", error.message));
});

app.post("/insert-watchlist-data", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("Assignment3_database");
    const collection = db.collection("Watchlist");

    const { c, d, dp, symbol, name } = req.body;
    const data = { c, d, dp, symbol, name };

    const existingItem = await collection.findOne({ symbol: symbol });

    if (existingItem) {
      res.json({
        success: false,
        message: `${symbol} already exists in the watchlist`,
      });
    } else {
      const result = await collection.insertOne(data);
      res.json({ success: true, message: `${symbol} added to Watchlist` });
    }
  } catch (error) {
    console.error("Error inserting data into MongoDB:", error);
    res
      .status(500)
      .json({ success: false, error: "Error inserting data into MongoDB" });
  }
});

app.get("/get-watchlist-data", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("Assignment3_database");
    const collection = db.collection("Watchlist");

    const data = await collection.find({}).toArray(); // Fetch all documents from the collection
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching data from MongoDB:", error);
    res
      .status(500)
      .json({ success: false, error: "Error fetching data from MongoDB" });
  }
});

app.get("/delete-watchlist", async (req, res) => {
  try {
    await client.connect();
    console.log("hereee");
    const symbol = req.query.q;
    console.log("The symbol is", symbol);
    const db = client.db("Assignment3_database");
    const collection = db.collection("Watchlist");

    const result = await collection.deleteOne({ symbol: symbol });
    console.log("The resul", result);
    if (result.deletedCount === 0) {
      res
        .status(404)
        .json({ success: false, message: `${symbol} not found in watchlist` });
    } else {
      res.json({ success: true, message: `${symbol} removed from Watchlist` });
    }
  } catch (error) {
    console.error("Error deleting symbol from watchlist:", error);
    res
      .status(500)
      .json({ success: false, error: "Error deleting symbol from Watchlist" });
  }
});

app.post("/initialize-wallet", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("Assignment3_database");
    const collection = db.collection("Portfolio");

    // Check if the document with the specified field exists
    const existingDocument = await collection.findOne({});

    if (existingDocument) {
      const result = await collection.updateOne(
        {},
        { $set: { moneyInWallet: 25000 } }
      );
      res.json({ success: true, message: "Wallet initialized successfully" });
    } else {
      const result = await collection.insertOne({ moneyInWallet: 25000 });
      res.json({ success: true, message: "Wallet initialized successfully" });
    }
  } catch (error) {
    console.error("Error initializing wallet:", error);
    res
      .status(500)
      .json({ success: false, error: "Error initializing wallet" });
  }
});

app.get("/wallet-balance", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("Assignment3_database");
    const collection = db.collection("Portfolio");
    const result = await collection.findOne({});
    if (result) {
      res.json({ success: true, walletAmount: result.moneyInWallet });
    } else {
      res.status(404).json({ success: false, message: "Wallet not found" });
    }
  } catch (error) {
    console.error("Error retrieving wallet amount:", error);
    res
      .status(500)
      .json({ success: false, error: "Error retrieving wallet amount" });
  }
});

app.post("/add-to-portfolio", async (req, res) => {
  try {
    await client.connect();
    const { currentPrice, quantity, total, symbol, name } = req.body;

    const db = client.db("Assignment3_database");
    const collection = db.collection("Portfolio");

    const existingItem = await collection.findOne({ symbol });

    if (existingItem) {
      const updatedResult = await collection.updateOne(
        { symbol },
        {
          $set: {
            currentPrice: currentPrice,
            quantity: existingItem.quantity + quantity,
            total: existingItem.total + total,
            symbol: existingItem.symbol,
            name: existingItem.name,
          },
        }
      );

      if (updatedResult.acknowledged) {
        const walletDocument = await collection.findOne({
          moneyInWallet: { $exists: true },
        });

        if (walletDocument) {
          const newMoneyInWallet = walletDocument.moneyInWallet - total;

          await collection.updateOne(
            { moneyInWallet: { $exists: true } },
            { $set: { moneyInWallet: newMoneyInWallet } }
          );
        }

        res.status(200).json({
          success: true,
          message: `${symbol} bought successfully`,
        });
      }
      // else {
      //   res.status(500).json({
      //     success: false,
      //     message: "Failed to update item in the portfolio",
      //   });
      // }
    } else {
      const result = await collection.insertOne({
        currentPrice,
        quantity,
        total,
        symbol,
        name,
      });

      if (result.acknowledged) {
        const walletDocument = await collection.findOne({
          moneyInWallet: { $exists: true },
        });

        if (walletDocument) {
          const newMoneyInWallet = walletDocument.moneyInWallet - total;

          await collection.updateOne(
            { moneyInWallet: { $exists: true } },
            { $set: { moneyInWallet: newMoneyInWallet } }
          );
        }

        res.status(200).json({
          success: true,
          message: `${symbol} bought successfully`,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to add item to the portfolio",
        });
      }
    }
  } catch (error) {
    console.error("Error adding item to portfolio:", error);
    res.status(500).send("Error adding item to portfolio");
  }
});

app.get("/get-portfolio-data", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("Assignment3_database");
    const collection = db.collection("Portfolio");

    const portfolioData = await collection.find({}).toArray();

    res.status(200).json({ success: true, portfolioData });
  } catch (error) {
    console.error("Error retrieving portfolio data:", error);
    res
      .status(500)
      .json({ success: false, error: "Error retrieving portfolio data" });
  }
});

app.get("/get-current-price", async (req, res) => {
  let currentPrice = [];
  const symbol = req.query.q;
  finnhubClient.quote(symbol, (error, data, response) => {
    if (error) {
      console.error("Error:", error);
      res.status(500).send("Error fetching symbol data");
    } else {
      currentPrice = data;

      res.json(currentPrice);
    }
  });
});

app.get("/get-sell-quantity", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("Assignment3_database");
    const { symbol } = req.query;

    const portfolioItem = await db
      .collection("Portfolio")
      .findOne({ symbol: symbol });

    if (!portfolioItem) {
      return res
        .status(404)
        .json({ success: false, message: "Portfolio item not found" });
    }

    const quantity = portfolioItem.quantity;

    res.status(200).json({ success: true, quantity: quantity });
  } catch (error) {
    console.error("Error checking sell quantity:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.post("/sell-portfolio", async (req, res) => {
  try {
    await client.connect();
    const { currentPrice, quantity, total, symbol } = req.body;

    const db = client.db("Assignment3_database");
    const collection = db.collection("Portfolio");

    // Find the portfolio item with the specified symbol
    const portfolioItem = await collection.findOne({ symbol });

    if (!portfolioItem) {
      return res.status(404).json({
        success: false,
        message: `${symbol} not found in the portfolio`,
      });
    }

    // Calculate the new quantity after selling
    const newQuantity = portfolioItem.quantity - quantity;

    if (newQuantity < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient quantity to sell" });
    }

    // Calculate the new total after selling
    const newTotal = portfolioItem.total - total;

    // Update the portfolio item
    const updateResult = await collection.updateOne(
      { symbol },
      {
        $set: {
          quantity: newQuantity,
          total: newTotal,
          currentPrice: currentPrice,
        },
      }
    );

    if (newQuantity === 0) {
      // If quantity becomes 0 after selling, delete the portfolio item
      await collection.deleteOne({ symbol });
    }

    // Update moneyInWallet
    const walletDocument = await collection.findOne({
      moneyInWallet: { $exists: true },
    });

    if (walletDocument) {
      const newMoneyInWallet = walletDocument.moneyInWallet + total;
      await collection.updateOne(
        { moneyInWallet: { $exists: true } },
        { $set: { moneyInWallet: newMoneyInWallet } }
      );
    }

    res
      .status(200)
      .json({ success: true, message: `${symbol} sold successfully` });
  } catch (error) {
    console.error("Error selling from portfolio:", error);
    res.status(500).json({ success: false, error: `Error selling ${symbol}` });
  }
});

// Redirect all other routes to Angular index.html
app.get("*", (req, res) => {
  //   res.sendFile(path.join(__dirname, "dist/stock-app/index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
