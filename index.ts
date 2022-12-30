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
  card: string | null;
};

const rooms: Record<string, User[]> = {};

io.on('connection', client => {
  client.on('disconnect', () => {
    console.log(`Disconnected: ${client.id}`);
  });

  client.on('create_room', username => {
    const newRoom = `${new Date().getTime()}`;
    rooms[newRoom] = [{ clientId: client.id, username, card: null }];

    client.join(newRoom);

    // console.log('NEW ROOM CREATED', rooms);

    client.emit('new_room', newRoom);
    client.emit('users', rooms[newRoom]);
  });

  client.on('join_room', data => {
    const { room, username } = data;

    if (!rooms[room]) {
      return;
    }

    if (rooms[room].some(c => c.clientId === client.id)) {
      return;
    }

    rooms[room].push({ clientId: client.id, username, card: null });
    client.join(room);

    client.broadcast.to(room).emit('users', rooms[room]);
    client.emit('users', rooms[room]);

    // console.log('ROOM JOINING', rooms);
  });

  client.on('card', data => {
    const { card, username, room } = data;

    if (!rooms[room]) {
      return;
    }

    const indexEl = rooms[room].findIndex(user => {
      return user.clientId === client.id;
    });

    if (indexEl === -1) {
      return;
    }

    rooms[room][indexEl].card = card;

    client.broadcast.to(room).emit('users', rooms[room]);
    client.emit('users', rooms[room]);
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
