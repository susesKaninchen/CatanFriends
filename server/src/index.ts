// Catan Friends - Server Entrypoint
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { gameManager } from './gameState.js';
import { PlayerColor, PlayerRole, ResourceType, TradeProposalType } from './types.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Register state change listener for bots and timers
gameManager.onStateChanged = (roomCode, state) => {
  io.to(roomCode.toUpperCase()).emit('room_state_updated', state);
};

io.on('connection', (socket: Socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // Create new room
  socket.on('create_room', (data: { playerName: string; color: PlayerColor; role: PlayerRole; sessionId?: string }, callback) => {
    try {
      const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      const playerId = data.sessionId || socket.id;
      const state = gameManager.createRoom(roomCode, {
        id: playerId,
        socketId: socket.id,
        name: data.playerName || 'Spieler 1',
        color: data.color || 'red',
        role: data.role || 'pioneer',
        isReady: true,
        isHost: true
      });

      socket.join(roomCode);
      callback({ success: true, roomCode, state, playerId });
      io.to(roomCode).emit('room_state_updated', state);
      console.log(`[Room Created] Code: ${roomCode} by ${socket.id} (player: ${playerId})`);
    } catch (err: any) {
      console.error('[Error create_room]', err);
      callback({ success: false, message: err.message });
    }
  });

  // Join existing room
  socket.on('join_room', (data: { roomCode: string; playerName: string; color: PlayerColor; role: PlayerRole; sessionId?: string }, callback) => {
    try {
      const roomCode = data.roomCode.toUpperCase();
      const playerId = data.sessionId || socket.id;
      const result = gameManager.joinRoom(roomCode, {
        id: playerId,
        socketId: socket.id,
        name: data.playerName || 'Gast',
        color: data.color || 'blue',
        role: data.role || 'builder',
        isReady: false,
        isHost: false
      });

      if (!result.success || !result.room) {
        callback({ success: false, message: result.message });
        return;
      }

      socket.join(roomCode);
      callback({ success: true, roomCode, state: result.room, playerId });
      io.to(roomCode).emit('room_state_updated', result.room);
      console.log(`[Room Joined] Code: ${roomCode} by ${socket.id} (player: ${playerId})`);
    } catch (err: any) {
      console.error('[Error join_room]', err);
      callback({ success: false, message: err.message });
    }
  });

  // Reconnect player session
  socket.on('reconnect_player', (data: { roomCode: string; playerId: string }, callback) => {
    try {
      const roomCode = data.roomCode.toUpperCase();
      const state = gameManager.reconnectPlayer(roomCode, data.playerId, socket.id);
      if (state) {
        socket.join(roomCode);
        callback({ success: true, roomCode, state });
        io.to(roomCode).emit('room_state_updated', state);
        console.log(`[Player Reconnected] Room: ${roomCode}, Player: ${data.playerId}, Socket: ${socket.id}`);
      } else {
        callback({ success: false, message: 'Spieler oder Raum nicht gefunden.' });
      }
    } catch (err: any) {
      console.error('[Error reconnect_player]', err);
      callback({ success: false, message: err.message });
    }
  });

  // Add Bot to room
  socket.on('add_bot', (data: { roomCode: string }, callback) => {
    const result = gameManager.addBot(data.roomCode);
    if (result.success && result.room) {
      io.to(data.roomCode.toUpperCase()).emit('room_state_updated', result.room);
      callback({ success: true });
    } else {
      callback({ success: false, message: result.message });
    }
  });

  // Update Ready status
  socket.on('set_ready', (data: { roomCode: string; isReady: boolean }) => {
    const ok = gameManager.setPlayerReady(data.roomCode, socket.id, data.isReady);
    if (ok) {
      const state = gameManager.getRoom(data.roomCode);
      if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
    }
  });

  // Update Color and Role
  socket.on('update_preferences', (data: { roomCode: string; color: PlayerColor; role: PlayerRole }) => {
    const ok = gameManager.updatePlayerPreferences(data.roomCode, socket.id, data.color, data.role);
    if (ok) {
      const state = gameManager.getRoom(data.roomCode);
      if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
    }
  });

  // Set points per player (Lobby host setting)
  socket.on('set_points_per_player', (data: { roomCode: string; points: number }, callback) => {
    const result = gameManager.setPointsPerPlayer(data.roomCode, socket.id, data.points);
    if (result.success) {
      const state = gameManager.getRoom(data.roomCode);
      if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
      if (callback) callback({ success: true });
    } else {
      if (callback) callback({ success: false, message: result.message });
    }
  });

  // Start game
  socket.on('start_game', (data: { roomCode: string }, callback) => {
    const result = gameManager.startGame(data.roomCode);
    if (result.success) {
      const state = gameManager.getRoom(data.roomCode);
      if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
      callback({ success: true });
    } else {
      callback({ success: false, message: result.message });
    }
  });

  // Roll dice
  socket.on('roll_dice', (data: { roomCode: string }, callback) => {
    const result = gameManager.rollDice(data.roomCode, socket.id);
    const state = gameManager.getRoom(data.roomCode);
    if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
    callback(result);
  });

  // Build Road (supports Fremdbau)
  socket.on('build_road', (data: { roomCode: string; edgeId: string; targetColor?: PlayerColor }, callback) => {
    const result = gameManager.buildRoad(data.roomCode, socket.id, data.edgeId, data.targetColor);
    const state = gameManager.getRoom(data.roomCode);
    if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
    callback(result);
  });

  // Build Settlement (supports Fremdbau)
  socket.on('build_settlement', (data: { roomCode: string; vertexId: string; targetColor?: PlayerColor; discountRes?: ResourceType }, callback) => {
    const result = gameManager.buildSettlement(data.roomCode, socket.id, data.vertexId, data.targetColor, data.discountRes);
    const state = gameManager.getRoom(data.roomCode);
    if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
    callback(result);
  });

  // Build City (upgrade)
  socket.on('build_city', (data: { roomCode: string; vertexId: string; discountRes?: ResourceType }, callback) => {
    const result = gameManager.buildCity(data.roomCode, socket.id, data.vertexId, data.discountRes);
    const state = gameManager.getRoom(data.roomCode);
    if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
    callback(result);
  });

  // Deposit to Quest
  socket.on('deposit_quest', (data: { roomCode: string; slotIndex: number; resource: ResourceType; amount?: number }, callback) => {
    const result = gameManager.depositToQuest(data.roomCode, socket.id, data.slotIndex, data.resource, data.amount || 1);
    const state = gameManager.getRoom(data.roomCode);
    if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
    callback(result);
  });

  // Play Knight Card
  socket.on('play_knight', (data: { roomCode: string }, callback) => {
    const result = gameManager.playKnightCard(data.roomCode, socket.id);
    const state = gameManager.getRoom(data.roomCode);
    if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
    callback(result);
  });

  // Move Robber (Interactive 7 or Knight placement)
  socket.on('move_robber', (data: { roomCode: string; hexId: string }, callback) => {
    const result = gameManager.moveRobber(data.roomCode, socket.id, data.hexId);
    const state = gameManager.getRoom(data.roomCode);
    if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
    if (callback) callback(result);
  });

  // Bank Trade (4:1)
  socket.on('trade_bank', (data: { roomCode: string; giveRes: ResourceType; getRes: ResourceType }, callback) => {
    const result = gameManager.tradeWithBank(data.roomCode, socket.id, data.giveRes, data.getRes);
    const state = gameManager.getRoom(data.roomCode);
    if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
    if (callback) callback(result);
  });

  // Gift Resource to Teammate
  socket.on('gift_resource', (data: { roomCode: string; targetPlayerId: string; resource: ResourceType }, callback) => {
    const result = gameManager.giftResource(data.roomCode, socket.id, data.targetPlayerId, data.resource);
    const state = gameManager.getRoom(data.roomCode);
    if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
    if (callback) callback(result);
  });

  // Propose Trade or Resource Request
  socket.on('propose_trade', (data: {
    roomCode: string;
    type: TradeProposalType;
    targetPlayerId: string | null;
    wantedResource: ResourceType;
    wantedAmount?: number;
    giveResource?: ResourceType;
    giveAmount?: number;
  }, callback) => {
    const result = gameManager.proposeTrade(
      data.roomCode,
      socket.id,
      data.type,
      data.targetPlayerId,
      data.wantedResource,
      data.wantedAmount ?? 1,
      data.giveResource,
      data.giveAmount ?? 1
    );
    const state = gameManager.getRoom(data.roomCode);
    if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
    if (callback) callback(result);
  });

  // Respond to Trade Proposal
  socket.on('respond_trade', (data: { roomCode: string; proposalId: string; action: 'accept' | 'decline' }, callback) => {
    const result = gameManager.respondTrade(data.roomCode, socket.id, data.proposalId, data.action);
    const state = gameManager.getRoom(data.roomCode);
    if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
    if (callback) callback(result);
  });

  // Cancel Trade Proposal
  socket.on('cancel_trade', (data: { roomCode: string; proposalId: string }, callback) => {
    const result = gameManager.cancelTrade(data.roomCode, socket.id, data.proposalId);
    const state = gameManager.getRoom(data.roomCode);
    if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
    if (callback) callback(result);
  });

  // End turn
  socket.on('end_turn', (data: { roomCode: string }, callback) => {
    const result = gameManager.endTurn(data.roomCode, socket.id);
    const state = gameManager.getRoom(data.roomCode);
    if (state) io.to(data.roomCode.toUpperCase()).emit('room_state_updated', state);
    callback(result);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] ID: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Server running] Catan Friends backend on http://localhost:${PORT}`);
});
