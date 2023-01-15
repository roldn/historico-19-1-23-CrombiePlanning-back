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
  voting: User[];
  reveal: boolean | undefined;
};

const rooms: Record<string, Room> = {};

io.on('connection', client => {
  client.on('disconnect', () => {
    Object.keys(rooms).forEach(room => {
      if (rooms[room].users.some(c => c.clientId === client.id)) {
        const userIndex = rooms[room].users.findIndex(
          user => user.clientId === client.id
        );

        const userVotingIndex = rooms[room].voting.findIndex(
          user => user.clientId === client.id
        );

        if (!userIndex) {
          return;
        }

        rooms[room].users.splice(userIndex, 1);

        if (!userVotingIndex) {
          return;
        }

        if (
          rooms[room].voting[userVotingIndex] &&
          rooms[room].voting[userVotingIndex].card
        ) {
          return;
        }

        rooms[room].voting.splice(userVotingIndex, 1);

        return client.broadcast.to(room).emit('users', rooms[room]);
      }
    });
  });

  client.on('create_room', username => {
    const newRoom = `${new Date().getTime()}`;

    rooms[newRoom] = {
      users: [{ clientId: client.id, username, card: undefined }],
      voting: [{ clientId: client.id, username, card: undefined }],
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
      client.emit('users', rooms[roomId]);
      client.broadcast.to(roomId).emit('users', rooms[roomId]);
      return;
    }

    const newUser = {
      clientId: client.id,
      username,
      card: undefined
    };

    rooms[roomId].users.push(newUser);
    rooms[roomId].voting.push(newUser);

    client.join(roomId);

    client.broadcast.to(roomId).emit('user_joined', rooms[roomId]);
    client.emit('user_joined', rooms[roomId]);

    // console.log('ROOM JOINING', rooms);
  });

  client.on('card', data => {
    const { card, roomId } = data;

    if (!rooms[roomId]) {
      return;
    }

    const userIndex = rooms[roomId].users.findIndex(user => {
      return user.clientId === client.id;
    });

    const userVotingIndex = rooms[roomId].voting.findIndex(user => {
      return user.clientId === client.id;
    });

    if (userIndex === -1) {
      return;
    }

    rooms[roomId].users[userIndex].card = card;

    if (userVotingIndex === -1) {
      rooms[roomId].voting.push(rooms[roomId].users[userIndex]);
      return;
    }

    rooms[roomId].voting[userVotingIndex].card = card;

    client.broadcast.to(roomId).emit('users', rooms[roomId]);
    client.emit('users', rooms[roomId]);
  });

  client.on('reveal_cards', roomId => {
    rooms[roomId].reveal = true;
    client.broadcast.to(roomId).emit('reveal_cards');
  });

  client.on('start_new_voting', room => {
    if (!rooms[room]) {
      return;
    }

    rooms[room].users = rooms[room].users.map(u => {
      return { ...u, card: undefined };
    });

    rooms[room].voting = rooms[room].users;

    rooms[room].reveal = false;

    client.broadcast.to(room).emit('start_new_voting', rooms[room]);
    client.emit('start_new_voting', rooms[room]);
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
