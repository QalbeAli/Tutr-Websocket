#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting WebSocket server in development mode...");

// Check if dependencies are installed
const packageJsonPath = path.join(__dirname, "package.json");
const nodeModulesPath = path.join(__dirname, "node_modules");

try {
  require("fs").accessSync(nodeModulesPath);
  console.log("✅ Dependencies found, starting server...");
  startServer();
} catch (error) {
  console.log("📦 Installing dependencies first...");
  installDependencies();
}

function installDependencies() {
  const install = spawn("npm", ["install"], {
    cwd: __dirname,
    stdio: "inherit",
  });

  install.on("close", (code) => {
    if (code === 0) {
      console.log("✅ Dependencies installed, starting server...");
      startServer();
    } else {
      console.error("❌ Failed to install dependencies");
      process.exit(1);
    }
  });
}

function startServer() {
  const server = spawn("node", ["server.js"], {
    cwd: __dirname,
    stdio: "inherit",
  });

  server.on("close", (code) => {
    console.log(`\n🛑 WebSocket server stopped with code ${code}`);
    process.exit(code);
  });

  // Handle process termination
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down...");
    server.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Shutting down...");
    server.kill("SIGTERM");
  });
}
