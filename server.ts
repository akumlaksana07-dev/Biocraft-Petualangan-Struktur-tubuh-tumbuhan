import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed)) return parsed;
  }
  if (process.env.DEFAULT_APP_PORT) {
    return parseInt(process.env.DEFAULT_APP_PORT, 10);
  }
  if (process.env.PORT) {
    return parseInt(process.env.PORT, 10);
  }
  return 3000;
}

function getHost(): string {
  const hostArgIndex = process.argv.indexOf('--host');
  if (hostArgIndex !== -1 && process.argv[hostArgIndex + 1]) {
    return process.argv[hostArgIndex + 1];
  }
  return process.env.HOST || '0.0.0.0';
}

const port = getPort();
const host = getHost();

app.use(express.json());

// API health and room info
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export interface LeaderboardRecord {
  id: string;
  name: string;
  school: string;
  score: number;
  atp: number;
  completedLevels: number;
  badge: string;
  predicate: string;
  completedAt: string;
}

// Initial accumulated leaderboard records (Top Indonesian SMP students)
const leaderboardRecords: Map<string, LeaderboardRecord> = new Map([
  [
    'smp_01',
    {
      id: 'smp_01',
      name: 'Nabila Ramadhani',
      school: 'SMP Negeri 1 Surabaya',
      score: 485,
      atp: 145,
      completedLevels: 4,
      badge: 'Master Sitologi Agung',
      predicate: 'Istimewa (Cumlaude)',
      completedAt: 'Hari ini, 09:15',
    },
  ],
  [
    'smp_02',
    {
      id: 'smp_02',
      name: 'Fathir Rizqi Pratama',
      school: 'SMP Labschool Jakarta',
      score: 460,
      atp: 138,
      completedLevels: 4,
      badge: 'Pakar Fisiologi Sel',
      predicate: 'Istimewa (Cumlaude)',
      completedAt: 'Hari ini, 08:42',
    },
  ],
  [
    'smp_03',
    {
      id: 'smp_03',
      name: 'Zahra Aulia Putri',
      school: 'SMP Negeri 5 Yogyakarta',
      score: 440,
      atp: 130,
      completedLevels: 4,
      badge: 'Peneliti Fotosintesis Unggul',
      predicate: 'Amat Baik',
      completedAt: 'Kemarin, 16:20',
    },
  ],
  [
    'smp_04',
    {
      id: 'smp_04',
      name: 'Muhammad Daffa',
      school: 'SMP Negeri 2 Bandung',
      score: 425,
      atp: 124,
      completedLevels: 4,
      badge: 'Master Anatomi Tumbuhan',
      predicate: 'Amat Baik',
      completedAt: 'Kemarin, 14:10',
    },
  ],
  [
    'smp_05',
    {
      id: 'smp_05',
      name: 'Clarissa Wijaya',
      school: 'SMP Kristen 1 BPK Penabur',
      score: 410,
      atp: 120,
      completedLevels: 4,
      badge: 'Ahli Mikroskopik Sel',
      predicate: 'Amat Baik',
      completedAt: 'Kemarin, 11:30',
    },
  ],
  [
    'smp_06',
    {
      id: 'smp_06',
      name: 'Reza Aditya Nugraha',
      school: 'SMP Negeri 3 Semarang',
      score: 395,
      atp: 115,
      completedLevels: 3,
      badge: 'Penjelajah Turgor Sel',
      predicate: 'Amat Baik',
      completedAt: '24 Okt 2026',
    },
  ],
  [
    'smp_07',
    {
      id: 'smp_07',
      name: 'Aisyah Nur Fitri',
      school: 'SMP Islam Al Azhar 1',
      score: 380,
      atp: 110,
      completedLevels: 3,
      badge: 'Pakar Organel Seluler',
      predicate: 'Amat Baik',
      completedAt: '24 Okt 2026',
    },
  ],
  [
    'smp_08',
    {
      id: 'smp_08',
      name: 'Dimas Bayu Anggoro',
      school: 'SMP Negeri 1 Malang',
      score: 370,
      atp: 105,
      completedLevels: 3,
      badge: 'Pakar Jaringan Vaskular',
      predicate: 'Amat Baik',
      completedAt: '24 Okt 2026',
    },
  ],
  [
    'smp_09',
    {
      id: 'smp_09',
      name: 'Kayla Almira',
      school: 'SMP Negeri 1 Denpasar',
      score: 355,
      atp: 100,
      completedLevels: 3,
      badge: 'Peneliti Stomata Hebat',
      predicate: 'Baik',
      completedAt: '23 Okt 2026',
    },
  ],
  [
    'smp_10',
    {
      id: 'smp_10',
      name: 'Bintang Pratama',
      school: 'SMP Kesatuan Bangsa',
      score: 340,
      atp: 95,
      completedLevels: 3,
      badge: 'Eksplorator Vakuola',
      predicate: 'Baik',
      completedAt: '23 Okt 2026',
    },
  ],
  [
    'smp_11',
    {
      id: 'smp_11',
      name: 'Tiara Kusuma Dewi',
      school: 'SMP Negeri 4 Surakarta',
      score: 325,
      atp: 90,
      completedLevels: 3,
      badge: 'Petualang Klorofil',
      predicate: 'Baik',
      completedAt: '23 Okt 2026',
    },
  ],
  [
    'smp_12',
    {
      id: 'smp_12',
      name: 'Farhan Alghifari',
      school: 'SMP Negeri 1 Medan',
      score: 310,
      atp: 85,
      completedLevels: 2,
      badge: 'Pengamat Sel Progresif',
      predicate: 'Baik',
      completedAt: '22 Okt 2026',
    },
  ],
  [
    'smp_13',
    {
      id: 'smp_13',
      name: 'Salma Zahidah',
      school: 'SMP Darul Hikam Bandung',
      score: 295,
      atp: 80,
      completedLevels: 2,
      badge: 'Pencari Jejak ATP',
      predicate: 'Baik',
      completedAt: '22 Okt 2026',
    },
  ],
  [
    'smp_14',
    {
      id: 'smp_14',
      name: 'Ilham Maulana',
      school: 'SMP Negeri 1 Makassar',
      score: 280,
      atp: 75,
      completedLevels: 2,
      badge: 'Peneliti Nukleus',
      predicate: 'Baik',
      completedAt: '22 Okt 2026',
    },
  ],
  [
    'smp_15',
    {
      id: 'smp_15',
      name: 'Nadia Syakira',
      school: 'SMP Taruna Bakti',
      score: 265,
      atp: 70,
      completedLevels: 2,
      badge: 'Penjelajah Sitosol',
      predicate: 'Baik',
      completedAt: '21 Okt 2026',
    },
  ],
  [
    'smp_16',
    {
      id: 'smp_16',
      name: 'Kevin Jonathan',
      school: 'SMP Santa Maria',
      score: 250,
      atp: 65,
      completedLevels: 2,
      badge: 'Spesialis Membran',
      predicate: 'Baik',
      completedAt: '21 Okt 2026',
    },
  ],
  [
    'smp_17',
    {
      id: 'smp_17',
      name: 'Putri Anindya',
      school: 'SMP Negeri 1 Palembang',
      score: 235,
      atp: 60,
      completedLevels: 2,
      badge: 'Kolektor Energi Sel',
      predicate: 'Baik',
      completedAt: '20 Okt 2026',
    },
  ],
  [
    'smp_18',
    {
      id: 'smp_18',
      name: 'Rafi Ahmad Fauzi',
      school: 'SMP Al-Irsyad Purwokerto',
      score: 220,
      atp: 55,
      completedLevels: 1,
      badge: 'Kadet Sitologi',
      predicate: 'Baik',
      completedAt: '20 Okt 2026',
    },
  ],
  [
    'smp_19',
    {
      id: 'smp_19',
      name: 'Annisa Maharani',
      school: 'SMP Negeri 2 Bogor',
      score: 200,
      atp: 50,
      completedLevels: 1,
      badge: 'Kadet Sitologi',
      predicate: 'Cukup',
      completedAt: '19 Okt 2026',
    },
  ],
]);

// Helper to get sorted Top 20
function getTop20Leaderboard() {
  const sorted = Array.from(leaderboardRecords.values()).sort((a, b) => b.score - a.score);
  return sorted.slice(0, 20).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

// GET Leaderboard Top 20
app.get('/api/leaderboard', (req, res) => {
  res.json({
    status: 'ok',
    totalPlayers: leaderboardRecords.size,
    leaderboard: getTop20Leaderboard(),
  });
});

// POST update player score to Leaderboard
app.post('/api/leaderboard', (req, res) => {
  try {
    const { id, name, school, score, atp, completedLevels, badge, predicate } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const playerId = id || `user_${name.toLowerCase().replace(/\s+/g, '_')}`;
    const existing = leaderboardRecords.get(playerId);

    const updatedScore = Math.max(existing?.score || 0, Number(score) || 0);
    const updatedAtp = Math.max(existing?.atp || 0, Number(atp) || 0);
    const updatedLevels = Math.max(existing?.completedLevels || 0, Number(completedLevels) || 0);

    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    leaderboardRecords.set(playerId, {
      id: playerId,
      name: name || existing?.name || 'Siswa IPA',
      school: school || existing?.school || 'SMP Indonesia',
      score: updatedScore,
      atp: updatedAtp,
      completedLevels: updatedLevels,
      badge: badge || (updatedLevels >= 4 ? 'Master Sitologi Agung' : updatedLevels >= 2 ? 'Peneliti Sel Muda' : 'Kadet Sitologi'),
      predicate: predicate || (updatedScore >= 400 ? 'Istimewa (Cumlaude)' : updatedScore >= 300 ? 'Amat Baik' : 'Baik'),
      completedAt: existing ? `Diperbarui ${nowStr}` : `Hari ini, ${nowStr}`,
    });

    res.json({
      status: 'ok',
      leaderboard: getTop20Leaderboard(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record leaderboard' });
  }
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

  server.on('error', (err: any) => {
    console.error('Server error:', err);
  });

  server.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
  });
}

startServer();
