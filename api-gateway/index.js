require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// -------------------- MIDDLEWARE --------------------
app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // logging every request

// Rate Limiter
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests
});
app.use(limiter);

// -------------------- AUTH MIDDLEWARE --------------------
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(); // allow public routes

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user data to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

app.use(verifyToken);

// -------------------- ROUTING TO MICROSERVICES --------------------
app.use((req, res, next) => {
  console.log("Incoming request to Gateway:", req.method, req.url);
  next();
});


// User Service
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL,  // http://localhost:3001
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""     // rewrite /api/auth/login → /auth/login
    }
  })
);



// // Restaurant Service
// app.use(
//   "/api/restaurants",
//   createProxyMiddleware({
//     target: process.env.RESTAURANT_SERVICE_URL,
//     changeOrigin: true,
//     pathRewrite: { "^/api": "" },
//   })
// );

// // Order Service
// app.use(
//   "/api/orders",
//   createProxyMiddleware({
//     target: process.env.ORDER_SERVICE_URL,
//     changeOrigin: true,
//     pathRewrite: { "^/api": "" },
//   })
// );

// // Payment Service
// app.use(
//   "/api/payments",
//   createProxyMiddleware({
//     target: process.env.PAYMENT_SERVICE_URL,
//     changeOrigin: true,
//     pathRewrite: { "^/api": "" },
//   })
// );

// // Notification Service
// app.use(
//   "/api/notifications",
//   createProxyMiddleware({
//     target: process.env.NOTIFICATION_SERVICE_URL,
//     ws: true,
//     changeOrigin: true,
//     pathRewrite: { "^/api": "" },
//   })
// );

app.use((err, req, res, next) => {
  console.error("Error encountered:", err.message);
  res.status(500).json({ error: err.message });
});

app.listen(process.env.PORT, () =>
  console.log(`API Gateway running on port ${process.env.PORT}`)
);

