import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import bodyParser from "body-parser";
import config from "./config/config.js";
import http from "http";
import logger from "./utils/logger.js";
import compression from "compression";
import errorHandler from "./middlewares/error.js";

// Routes imports
import authRouter from "./routes/auth.routes.js";
import vendorRouter from "./routes/vendor.routes.js";
import rfqRouter from "./routes/rfq.routes.js";
import quotationRouter from "./routes/quotation.routes.js";
import approvalRouter from "./routes/approval.routes.js";
import poRouter from "./routes/po.routes.js";
import invoiceRouter from "./routes/invoice.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import activityRouter from "./routes/activity.routes.js";
import adminUserRouter from "./routes/user.routes.js";

// Required for __dirname in ES modules
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { configCloudinary } from "./utils/uploadImage.js";

// Init express app
const app = express();
const server = http.createServer(app);

configCloudinary();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json());

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(morgan("combined", { stream: logger.stream }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Route Mounts
app.get("/", (req, res) => {
  res.json({
    success: true,
    data: { message: "API is running" },
    message: "Welcome to the API",
    errorCode: 0,
  });
});

app.use("/api/auth", authRouter);
app.use("/api/user", authRouter); // backward compatibility alias
app.use("/api/vendors", vendorRouter);
app.use("/api/rfqs", rfqRouter);
app.use("/api/quotations", quotationRouter);
app.use("/api/approvals", approvalRouter);
app.use("/api/purchase-orders", poRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/activity-logs", activityRouter);
app.use("/api/users", adminUserRouter);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `Route not found: ${req.originalUrl}`,
    errorCode: 3, // NOT_FOUND
  });
});

// Error handler middleware
app.use(errorHandler);

// Start server
const PORT = config.server.port;
server.listen(PORT, "0.0.0.0", () => {
  logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown
process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Export app and server
export { app, server };
