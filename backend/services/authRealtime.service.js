import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import config from "../config/config.js";
import logger from "../utils/logger.js";

/**
 * Socket.IO layer for auth-related real-time events only.
 * Frontend: connect with auth: { token: '<JWT>' } or query ?token=
 */
class AuthRealtimeService {
  constructor() {
    this.io = null;
  }

  initialize(httpServer) {
    this.io = new Server(httpServer, {
      path: config.WEBSOCKET_PATH || "/socket.io",
      cors: {
        origin: config.cors.allowedOrigins.filter((o) => o !== "*"),
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.query?.token;

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
          return next(new Error("User not found or inactive"));
        }

        socket.userId = user._id.toString();
        socket.userRole = user.role;
        next();
      } catch (err) {
        next(new Error("Invalid or expired token"));
      }
    });

    this.io.on("connection", (socket) => {
      const room = `user:${socket.userId}`;
      socket.join(room);
      logger.info(`Auth socket connected: ${socket.userId}`);

      socket.emit("auth:connected", {
        userId: socket.userId,
        role: socket.userRole,
        timestamp: Date.now(),
      });

      socket.on("disconnect", () => {
        logger.info(`Auth socket disconnected: ${socket.userId}`);
      });
    });

    logger.info(
      `Auth realtime (Socket.IO) listening on path ${config.WEBSOCKET_PATH || "/socket.io"}`
    );
  }

  emitToUser(userId, event, payload = {}) {
    if (!this.io) return false;
    this.io.to(`user:${userId}`).emit(event, {
      ...payload,
      timestamp: Date.now(),
    });
    return true;
  }

  notifyEmailVerified(userId) {
    return this.emitToUser(userId, "auth:email_verified", {
      message: "Your email has been verified",
    });
  }

  notifyLogin(userId, meta = {}) {
    return this.emitToUser(userId, "auth:login", meta);
  }

  notifyPasswordChanged(userId) {
    return this.emitToUser(userId, "auth:password_changed", {
      message: "Your password was updated. Please sign in again if needed.",
    });
  }

  notifyLogout(userId) {
    return this.emitToUser(userId, "auth:logout", {
      message: "You have been signed out",
    });
  }
}

const authRealtimeService = new AuthRealtimeService();
export default authRealtimeService;
