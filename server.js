const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const httpServer = createServer();

// CORS middleware
const corsMiddleware = cors({
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.ALLOWED_ORIGINS?.split(",") || [
          "https://your-domain.vercel.app",
        ]
      : [
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          /http:\/\/192\.168\.[0-9]+\.[0-9]+:3000/,
        ],
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Apply CORS to all requests
httpServer.on("request", (req, res) => {
  corsMiddleware(req, res, () => {
    handleRequest(req, res);
  });
});

function handleRequest(req, res) {
  // Health check
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        message: "WebSocket server running",
        connections: io.engine.clientsCount || 0,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      })
    );
    return;
  }

  // Emit notification via HTTP
  if (req.url === "/emit" && req.method === "POST") {
    try {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          const payload = JSON.parse(body || "{}");
          const notification = payload.notification || payload;
          const { recipient_id, recipient_type } = notification || {};

          if (!recipient_id || !recipient_type) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "recipient_id and recipient_type are required",
              })
            );
            return;
          }

          const room = `${recipient_type}:${recipient_id}`;
          io.to(room).emit("new_notification", notification);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: true,
              room,
              notification,
            })
          );
        } catch (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON body" }));
        }
      });
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Server error" }));
    }
    return;
  }

  // Default response for other requests
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
}

// Socket.io server configuration
const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGINS?.split(",") || [
            "https://your-domain.vercel.app",
          ]
        : [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            /http:\/\/192\.168\.[0-9]+\.[0-9]+:3000/,
          ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  allowUpgrades: true,
  maxHttpBufferSize: 1e6,
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);

  // User joins with their ID and type
  socket.on("join", (data) => {
    try {
      const { userId, userType } = data;

      if (!userId || !userType) {
        console.log("❌ Invalid join data:", data);
        return;
      }

      // Join user-specific room
      const roomName = `${userType}:${userId}`;
      socket.join(roomName);

      console.log(`👤 User ${userId} (${userType}) joined room: ${roomName}`);

      // Store user info in socket
      socket.userId = userId;
      socket.userType = userType;
    } catch (error) {
      console.error("❌ Error in join handler:", error);
    }
  });

  // Handle heartbeat
  socket.on("ping", () => {
    socket.emit("pong");
  });

  // Handle notification creation
  socket.on("create_notification", (notification) => {
    try {
      const { recipient_id, recipient_type } = notification;

      if (!recipient_id || !recipient_type) {
        console.log("❌ Invalid notification data:", notification);
        return;
      }

      const room = `${recipient_type}:${recipient_id}`;
      const roomSockets = io.sockets.adapter.rooms.get(room);

      if (roomSockets) {
        console.log(
          `📢 Sending notification to room ${room} (${roomSockets.size} users)`
        );
      } else {
        console.log(
          `📢 Sending notification to room ${room} (no users online)`
        );
      }

      // Send to specific user
      io.to(room).emit("new_notification", notification);
    } catch (error) {
      console.error("❌ Error handling notification:", error);
    }
  });

  // Handle session request updates
  socket.on("session_request_updated", (data) => {
    try {
      const { tutor_id, request_data } = data;

      if (!tutor_id || !request_data) {
        console.log("❌ Invalid session request data:", data);
        return;
      }

      const room = `tutor:${tutor_id}`;
      const roomSockets = io.sockets.adapter.rooms.get(room);

      if (roomSockets) {
        console.log(
          `📋 Sending session request update to room ${room} (${roomSockets.size} users)`
        );
      } else {
        console.log(
          `📋 Sending session request update to room ${room} (no users online)`
        );
      }

      // Send to specific tutor
      io.to(room).emit("session_request_updated", request_data);
    } catch (error) {
      console.error("❌ Error handling session request update:", error);
    }
  });

  // Handle tutor status updates
  socket.on("tutor_status_update", (data) => {
    try {
      const { tutorId, status, lastSeen, isActive } = data;

      if (!tutorId || !status) {
        console.log("❌ Invalid tutor status data:", data);
        return;
      }

      console.log(
        `🔄 Broadcasting tutor status update: ${tutorId} -> ${status}`
      );

      // Broadcast to all connected students
      io.emit("tutor_status_update", {
        tutorId,
        status,
        lastSeen,
        isActive,
      });
    } catch (error) {
      console.error("❌ Error handling tutor status update:", error);
    }
  });

  // Handle new messages
  socket.on("new_message", (message) => {
    try {
      const { conversation_id, recipient_id, recipient_type } = message;

      if (!conversation_id || !recipient_id || !recipient_type) {
        console.log("❌ Invalid message data:", message);
        return;
      }

      console.log(
        `💬 New message in conversation ${conversation_id} to ${recipient_type}:${recipient_id}`
      );

      // Send message to the recipient's room
      const recipientRoom = `${recipient_type}:${recipient_id}`;
      const roomSockets = io.sockets.adapter.rooms.get(recipientRoom);

      if (roomSockets) {
        console.log(
          `💬 Sending message to room ${recipientRoom} (${roomSockets.size} users)`
        );
      } else {
        console.log(
          `💬 Sending message to room ${recipientRoom} (no users online)`
        );
      }

      // Send to specific recipient
      io.to(recipientRoom).emit("new_message", message);

      // Also broadcast to all users in the conversation (for future group chat support)
      // For now, we'll just log this
      console.log(`💬 Message broadcasted to conversation ${conversation_id}`);
    } catch (error) {
      console.error("❌ Error handling new message:", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log(`🔌 Disconnected: ${socket.id} (${reason})`);
    if (socket.userId && socket.userType) {
      console.log(`👤 User ${socket.userId} (${socket.userType}) disconnected`);
    }
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error("❌ Socket error:", error);
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down WebSocket server...");
  httpServer.close(() => {
    console.log("✅ WebSocket server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down...");
  httpServer.close(() => {
    console.log("✅ WebSocket server closed");
    process.exit(0);
  });
});
