### **📁 Project Structure (SOA System)**

This project is a **Service-Oriented Architecture (SOA)** for a **Food Ordering Application**, designed to handle multiple independent services, each responsible for a specific business function. It includes real-time messaging, authentication, and a flexible API gateway for routing and communication.

---

### **📂 Directory Structure**



```
soa_master_server
├─ .dockerignore
├─ docker-compose.yml
├─ makefile
├─ package.json
├─ README.md
├─ service
│  ├─ api-gateway
│  │  ├─ Dockerfile
│  │  ├─ package.json
│  │  ├─ server.js
│  │  └─ swagger.js
│  ├─ auth
│  │  ├─ controller.js
│  │  ├─ Dockerfile
│  │  ├─ package.json
│  │  ├─ routes.js
│  │  └─ server.js
│  ├─ cart
│  ├─ category
│  ├─ chat
│  ├─ dish
│  ├─ employee
│  ├─ favorite
│  ├─ foodType
│  ├─ location
│  ├─ message
│  ├─ notification
│  ├─ order
│  ├─ shipper
│  ├─ store
│  ├─ topping
│  ├─ upload
│  ├─ user
│  └─ ws
│     ├─ Dockerfile
│     ├─ package.json
│     └─ server.js
└─ shared
   ├─ connection
   │  ├─ db_connection.js
   │  └─ firebase_connection.js
   ├─ middlewares
   │  ├─ authMiddleware.js
   │  ├─ authMiddlewareAdmin.js
   │  ├─ authMiddlewareManager.js
   │  ├─ errorHandler.js
   │  └─ validateMongoDBId.js
   ├─ model
   │  ├─ cart.js
   │  ├─ category.js
   │  ├─ chat.js
   │  ├─ dish.js
   │  ├─ employee.js
   │  ├─ favorite.js
   │  ├─ foodType.js
   │  ├─ location.js
   │  ├─ message.js
   │  ├─ notification.js
   │  ├─ order.js
   │  ├─ rating.js
   │  ├─ shipper.js
   │  ├─ store.js
   │  ├─ topping.js
   │  ├─ toppingGroup.js
   │  └─ user.js
   └─ utils
      ├─ createError.js
      ├─ paging.js
      ├─ sendEmail.js
      └─ socketManager.js

```

---

### **🗃️ Services Overview**

Each service in this SOA system is responsible for a specific functionality:

| Service      | Port | Description                            |
| ------------ | ---- | -------------------------------------- |
| auth         | 5001 | User authentication and JWT management |
| cart         | 5002 | Shopping cart management               |
| category     | 5003 | Menu categories management             |
| chat         | 5004 | Real-time chat with Socket.IO          |
| dish         | 5005 | Menu items and dishes                  |
| employee     | 5006 | Employee management                    |
| favorite     | 5007 | Favorite items management              |
| foodType     | 5008 | Food types management                  |
| location     | 5009 | Location-based services                |
| message      | 5010 | Message handling for chats             |
| notification | 5011 | Real-time notifications                |
| order        | 5012 | Order processing and tracking          |
| shipper      | 5013 | Shipper management                     |
| store        | 5014 | Store profile management               |
| topping      | 5015 | Topping management                     |
| upload       | 5016 | File upload services                   |
| user         | 5017 | User profile and account settings      |

---

### **🛠️ Prerequisites**

* **Windows 10/11** (with **WSL2** or Docker Desktop)
* **Docker** & **Docker Compose**
* **Node.js** (v18+ recommended)
* **MongoDB Atlas** (or local MongoDB server)

---

### **⚙️ Configuration**

1. **Clone the Repository:**

2. **Create Environment Files:**

   * **Global `.env`** (at the project root):

3. **Build Docker Containers:**

   ```bash
   npm run build
   ```

---

### **🚀 Running the Project**

1. **Start the API Gateway:**

   ```bash
   npm run up
   ```

2. **Start All Services:**

   ```bash
   npm run up
   ```

3. **Access the API Gateway:**

   * API Gateway: [http://localhost:5000](http://localhost:5000)
   * Swagger Docs: [http://localhost:5000/api/v1/docs](http://localhost:5000/api/v1/docs)

---

### **🛡️ Security and CORS**

Ensure that the `ALLOWED_ORIGINS` in your `.env` files are set correctly to avoid CORS issues. (just for client fe)
For development in the future, only allow the call for internal service

---

### **🔧 Troubleshooting**

* **"Service not found"**: Check your `docker-compose.yml` for correct service names and ports.

---

### **📝 NEED CHECK**

* Webhook run on differnt port -> must include that port (or combine it with the api-gateway in the future)
* Re-check all the API and websocket

---
