const swaggerJSDoc = require("swagger-jsdoc");
const axios = require("axios");

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
};

async function fetchServiceDocs() {
  const paths = {};

  for (const [name, port] of Object.entries(services)) {
    try {
      const response = await axios.get(`http://${name}:${port}/docs-json`);
      console.log(`Fetching docs from ${name} service`);
      
      const serviceDocs = modifyServiceNameInDocs(response.data.paths, name);

      for (const [path, methods] of Object.entries(serviceDocs)) {
        paths[`/api/v1/${name}${path}`] = methods;
      }
    } catch (error) {
      console.error(`Failed to fetch docs from ${name} service:`, error.message || error.response?.data);
    }
  }

  return paths;
}


// Function to modify the service name in the documentation
function modifyServiceNameInDocs(serviceDocs, serviceName) {
  for (const path in serviceDocs) {
    for (const method in serviceDocs[path]) {
      const operation = serviceDocs[path][method];

      // Add the service name as a tag
      if (!operation.tags) {
        operation.tags = [serviceName];
      }

      // Modify operation descriptions based on the service name
      if (operation.description) {
        operation.description = `${serviceName}: ${operation.description}`;
      }

      // Modify responses descriptions based on the service name
      if (operation.responses) {
        for (const responseCode in operation.responses) {
          const response = operation.responses[responseCode];

          // Replace 'default' with service name
          if (response.description && response.description.includes("default")) {
            response.description = response.description.replace(/default/g, serviceName);
          }
        }
      }
    }
  }
  return serviceDocs;
}


async function generateSwaggerDefinition() {
  const paths = await fetchServiceDocs();

  // Generate tags for each service
  const tags = Object.keys(services).map(serviceName => ({
    name: serviceName.toUpperCase(),
    description: `${serviceName} service endpoints`,
  }));

  return {
    openapi: "3.0.0",
    info: {
      title: "Food Ordering API Gateway",
      version: "1.0.0",
      description: "API Gateway for the food ordering system",
    },
    servers: [
      {
        url: `http://gateway:${process.env.GATEWAY_PORT || 5000}/api/v1`,  // Use the gateway service name
        description: "Gateway server",
      },
    ],
    paths,
  };
}

module.exports = generateSwaggerDefinition;
