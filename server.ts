import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json());

// API health and room info
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

interface PlayerState {
  id: string;
  name: string;
  grade: string;
  title: string;
  room: string;
  customization: {
    skinColor: string;
    shirtColor: string;
    pantsColor: string;
    face: string;
    hat: string;
    accessory: string;
  };
  x: number;
  y: number;
  z: number;
  rotY: number;
  anim: 'idle' | 'walk' | 'jump' | 'cheer' | 'dance';
  lastActive: number;
  score: number;
  collectedAtp: number;
}

interface RoomData {
  players: Map<string, PlayerState>;
  sockets: Map<string, WebSocket>;
  sharedAtp: number;
  photosynthesisReady: boolean;
}

const rooms = new Map<string, RoomData>();

function getOrCreateRoom(roomId: string): RoomData {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      players: new Map(),
      sockets: new Map(),
      sharedAtp: 0,
      photosynthesisReady: false,
    });
  }
  return rooms.get(roomId)!;
}

// WebSocket server setup
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  let playerId = '';
  let playerRoom = 'KELAS-8A';

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      const { type } = data;

      if (type === 'join') {
        playerId = data.id || `p_${Math.random().toString(36).substring(2, 8)}`;
        playerRoom = (data.room || 'KELAS-8A').toUpperCase().trim();

        const room = getOrCreateRoom(playerRoom);
        room.sockets.set(playerId, ws);

        const player: PlayerState = {
          id: playerId,
          name: data.name || `Siswa_${playerId.slice(-3)}`,
          grade: 'SMP Kelas VIII',
          title: data.title || 'Penjelajah Sel Muda',
          room: playerRoom,
          customization: data.customization || {
            skinColor: '#fed8b1',
            shirtColor: '#2563eb',
            pantsColor: '#1e293b',
            face: 'smile',
            hat: 'goggles',
            accessory: 'backpack',
          },
          x: (Math.random() - 0.5) * 10,
          y: 0,
          z: (Math.random() - 0.5) * 10,
          rotY: 0,
          anim: 'idle',
          lastActive: Date.now(),
          score: 0,
          collectedAtp: 0,
        };

        room.players.set(playerId, player);

        // Send confirmation and current room state
        const allPlayers = Array.from(room.players.values());
        ws.send(
          JSON.stringify({
            type: 'init',
            selfId: playerId,
            players: allPlayers,
            sharedAtp: room.sharedAtp,
            photosynthesisReady: room.photosynthesisReady,
          })
        );

        // Broadcast to others in the room
        broadcastToRoom(
          playerRoom,
          {
            type: 'player:joined',
            player,
          },
          playerId
        );
      } else if (type === 'update') {
        const room = rooms.get(playerRoom);
        if (room && playerId && room.players.has(playerId)) {
          const p = room.players.get(playerId)!;
          if (data.x !== undefined) p.x = data.x;
          if (data.y !== undefined) p.y = data.y;
          if (data.z !== undefined) p.z = data.z;
          if (data.rotY !== undefined) p.rotY = data.rotY;
          if (data.anim !== undefined) p.anim = data.anim;
          if (data.customization) p.customization = data.customization;
          if (data.name) p.name = data.name;
          if (data.title) p.title = data.title;
          if (data.score !== undefined) p.score = data.score;
          if (data.collectedAtp !== undefined) p.collectedAtp = data.collectedAtp;
          p.lastActive = Date.now();

          // Broadcast delta position and anim
          broadcastToRoom(
            playerRoom,
            {
              type: 'player:moved',
              id: playerId,
              x: p.x,
              y: p.y,
              z: p.z,
              rotY: p.rotY,
              anim: p.anim,
              customization: p.customization,
              name: p.name,
              score: p.score,
            },
            playerId
          );
        }
      } else if (type === 'chat') {
        broadcastToRoom(playerRoom, {
          type: 'chat',
          id: playerId,
          name: data.name,
          text: data.text,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        });
      } else if (type === 'emote') {
        broadcastToRoom(playerRoom, {
          type: 'emote',
          id: playerId,
          emote: data.emote,
        });
      } else if (type === 'coop:atp') {
        const room = rooms.get(playerRoom);
        if (room) {
          room.sharedAtp += data.amount || 1;
          if (room.sharedAtp >= 25 && !room.photosynthesisReady) {
            room.photosynthesisReady = true;
          }
          broadcastToRoom(playerRoom, {
            type: 'coop:update',
            sharedAtp: room.sharedAtp,
            photosynthesisReady: room.photosynthesisReady,
            donorName: data.name,
          });
        }
      }
    } catch (err) {
      console.error('WS Error:', err);
    }
  });

  ws.on('close', () => {
    if (playerRoom && playerId) {
      const room = rooms.get(playerRoom);
      if (room) {
        room.players.delete(playerId);
        room.sockets.delete(playerId);
        broadcastToRoom(playerRoom, {
          type: 'player:left',
          id: playerId,
        });

        if (room.players.size === 0) {
          rooms.delete(playerRoom);
        }
      }
    }
  });
});

function broadcastToRoom(roomId: string, messageObj: object, excludeId?: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(messageObj);
  room.sockets.forEach((socket, pId) => {
    if (socket.readyState === WebSocket.OPEN && pId !== excludeId) {
      socket.send(payload);
    }
  });
}

// Integrate Vite middleware in development or static serve in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
