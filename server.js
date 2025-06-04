const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected clients by family code
const families = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'running', 
    families: families.size,
    connections: Array.from(families.values()).reduce((sum, family) => sum + family.size, 0)
  });
});

wss.on('connection', (ws) => {
  let clientInfo = null;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join':
          // Store client info
          clientInfo = {
            familyCode: data.familyCode,
            userId: data.userId,
            ws: ws
          };
          
          // Add to family room
          if (!families.has(data.familyCode)) {
            families.set(data.familyCode, new Map());
          }
          families.get(data.familyCode).set(data.userId, ws);
          
          // Notify other family members
          broadcastToFamily(data.familyCode, {
            type: 'user-joined',
            fromUserId: data.userId
          }, data.userId);
          
          console.log(`User ${data.userId} joined family ${data.familyCode}`);
          break;
          
        case 'offer':
        case 'answer':
        case 'ice-candidate':
          // Forward to specific peer
          if (clientInfo && data.toUserId) {
            const family = families.get(clientInfo.familyCode);
            if (family && family.has(data.toUserId)) {
              const targetWs = family.get(data.toUserId);
              if (targetWs.readyState === WebSocket.OPEN) {
                targetWs.send(JSON.stringify(data));
              }
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
  
  ws.on('close', () => {
    if (clientInfo) {
      // Remove from family
      const family = families.get(clientInfo.familyCode);
      if (family) {
        family.delete(clientInfo.userId);
        
        // Clean up empty families
        if (family.size === 0) {
          families.delete(clientInfo.familyCode);
        } else {
          // Notify other family members
          broadcastToFamily(clientInfo.familyCode, {
            type: 'user-left',
            fromUserId: clientInfo.userId
          }, clientInfo.userId);
        }
      }
      
      console.log(`User ${clientInfo.userId} left family ${clientInfo.familyCode}`);
    }
  });
  
  // Keep connection alive
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

// Broadcast message to family members (except sender)
function broadcastToFamily(familyCode, message, excludeUserId) {
  const family = families.get(familyCode);
  if (family) {
    family.forEach((ws, userId) => {
      if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

// Ping clients to keep connections alive
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
