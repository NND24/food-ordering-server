const express = require("express");
require("dotenv").config();
require("express-async-errors");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { errorHandler } = require("./shared/middlewares/errorHandler");
const connectDB = require("./shared/connection/db_connection");
const http = require("http");
const socketIo = require("socket.io");
const morgan = require("morgan");
const routes = require("./routes");
const { setSocketIo } = require("./shared/utils/socketManager");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
// Initialize App
const app = express();
connectDB();

// Logging
app.use(morgan("dev"));

// CORS
// CORS
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);


// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Swagger Setup
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Food Type Service API",
    version: "1.0.0",
    description: "Food Type service for the food ordering system",
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5007}`,
      description: "Food Type Service API",
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./routes.js"],
};

const swaggerSpec = swaggerJsdoc(options);

// Serve Swagger Docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Expose Swagger JSON for Gateway to fetch
app.get("/docs-json", (req, res) => {
  res.json(swaggerSpec); // Expose the raw Swagger JSON specification
});

// Routes
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});
app.use("/", routes);

const server = http.createServer(app);



// Error Handling
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5007;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
