// server.js
const express = require("express");
const axios = require("axios");
const generateSwaggerDefinition = require("./swagger");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();
const cors = require("cors");
const getRawBody = require("raw-body");
const app = express();
const PORT = process.env.GATEWAY_PORT || 5000;

// List of services and their ports
const services = {
  auth: process.env.AUTH_SERVICE_PORT || 5001,
  cart: process.env.CART_SERVICE_PORT || 5002,
  category: process.env.CATEGORY_SERVICE_PORT || 5003,
  chat: process.env.CHAT_SERVICE_PORT || 5004,
  dish: process.env.DISH_SERVICE_PORT || 5005,
  employee: process.env.EMPLOYEE_SERVICE_PORT || 5006,
  favorite: process.env.FAVORITE_SERVICE_PORT || 5007,
  foodType: process.env.FOODTYPE_SERVICE_PORT || 5008,
  location: process.env.LOCATION_SERVICE_PORT || 5009,
  message: process.env.MESSAGE_SERVICE_PORT || 5010,
  notification: process.env.NOTIFICATION_SERVICE_PORT || 5011,
  order: process.env.ORDER_SERVICE_PORT || 5012,
  shipper: process.env.SHIPPER_SERVICE_PORT || 5013,
  store: process.env.STORE_SERVICE_PORT || 5014,
  topping: process.env.TOPPING_SERVICE_PORT || 5015,
  upload: process.env.UPLOAD_SERVICE_PORT || 5016,
  user: process.env.USER_SERVICE_PORT || 5017,
  rating: process.env.RATING_SERVICE_PORT || 5018,
  customerStore: process.env.CUSTOMER_STORE_SERVICE_PORT || 5019,
};

// Parse ALLOWED_ORIGINS from .env and split by commas
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Proxy requests to the correct service
app.use("/api/v1/:service/*", async (req, res) => {
  const serviceName = req.params.service;
  const servicePort = services[serviceName];

  if (!servicePort) {
    return res.status(404).send({ error: `Service ${serviceName} not found` });
  }

  try {
    const url = `http://${serviceName}:${servicePort}${req.originalUrl.replace(`/api/v1/${serviceName}`, "")}`;
    console.log(`[${new Date().toISOString()}] Forwarding request to ${url}`);

    // Use raw-body for consistent body parsing
    const rawBody = await getRawBody(req, {
      length: req.headers["content-length"] || undefined,
      limit: "10mb",
      encoding: null, // Ensuring UTF-8 encoding
    });
    console.log(rawBody);

    const response = await axios({
      method: req.method,
      url,
      headers: {
        ...req.headers,
        "Content-Length": rawBody.length,
      },
      data: rawBody,
      withCredentials: true,
    });

    // Forward Set-Cookie headers
    const setCookieHeaders = response.headers["set-cookie"] || [];
    if (setCookieHeaders.length > 0) {
      res.setHeader("Set-Cookie", setCookieHeaders);
    }

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error forwarding request to ${serviceName}:`, error.message);

    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else if (error.request) {
      res.status(503).send({ error: "Service Unavailable" });
    } else {
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
});

// Swagger docs setup
generateSwaggerDefinition().then((swaggerDefinition) => {
  app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerDefinition));

  app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api/v1/docs`);
  });
});
