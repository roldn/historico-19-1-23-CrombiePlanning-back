import express from 'express';
import http from 'http';
import cors from 'cors';
import appRouter from './routes';

import { Server } from 'socket.io';

const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(cors());
app.use(express.json());

app.use('/', appRouter);

app.get('/', (req, res) => {
  res.send('Backend Running');
});

type User = {
  clientId: string;
  username: string;
  card: string | undefined;
};

type Room = {
  users: User[];
  reveal: boolean | undefined;
};

const rooms: Record<string, Room> = {};

io.on('connection', client => {
  client.on('disconnect', () => {
    console.log(`Disconnected: ${client.id}`);
  });

  client.on('create_room', username => {
    const newRoom = `${new Date().getTime()}`;

    rooms[newRoom] = {
      users: [{ clientId: client.id, username, card: undefined }],
      reveal: false
    };

    client.join(newRoom);

    // console.log('NEW ROOM CREATED', rooms);

    client.emit('new_room', newRoom);
    client.emit('users', rooms[newRoom]);
  });

  client.on('join_room', data => {
    const { roomId, username } = data;

    if (!rooms[roomId]) {
      return;
    }

    if (rooms[roomId].users.some(c => c.clientId === client.id)) {
      return;
    }

    rooms[roomId].users.push({
      clientId: client.id,
      username,
      card: undefined
    });
    client.join(roomId);

    client.broadcast.to(roomId).emit('users', rooms[roomId]);
    client.emit('users', rooms[roomId]);

    // console.log('ROOM JOINING', rooms);
  });

  client.on('card', data => {
    const { card, username, room } = data;

    if (!rooms[room]) {
      return;
    }

    const indexEl = rooms[room].users.findIndex(user => {
      return user.clientId === client.id;
    });

    if (indexEl === -1) {
      return;
    }

    rooms[room].users[indexEl].card = card;

    client.broadcast.to(room).emit('users', rooms[room]);
    client.emit('users', rooms[room]);
  });

  client.on('reveal_cards', roomId => {
    rooms[roomId].reveal = true;
    client.broadcast.to(roomId).emit('reveal_cards');
  });

  client.on('start_new_voting', room => {
    if (!rooms[room]) {
      return;
    }

    rooms[room].users = rooms[room].users.map((u, i) => {
      return { ...u, card: undefined };
    });

    rooms[room].reveal = false;

    client.broadcast.to(room).emit('start_new_voting', rooms[room]);
    client.emit('start_new_voting', rooms[room]);
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
