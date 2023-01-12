import { createServer } from 'http';
import mongoose, { isValidObjectId } from 'mongoose';
import { Server, Socket } from 'socket.io';
import app from './app';
import Room from './models/Room';
import { User } from './models/User';
import { round } from './utils/roundNumber';

const PORT = process.env.PORT || 3000;
const dbURI =
  process.env.DB_URI ||
  'mongodb+srv://root:mRrZoApkfwgPugvf@crombiepokerplanning.1tbyem2.mongodb.net/?retryWrites=true&w=majority';

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

async function main() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(dbURI, { dbName: 'PokerPlanning' });
    console.log('Connected to Database');
    server.listen(PORT, () => {
      console.log('App live on port', PORT);
    });
  } catch (error) {
    console.log('Error on connection to database');
  }
}

main();

io.on('connection', (client: Socket & { sessionId?: string }) => {
  console.log('Client Connected:', client.id);

  client.on('client:create_room', async ({ username, gameName }) => {
    console.log('Client Create Room', client.id, username);

    client.sessionId = client.id;

    const user: User = {
      clientId: client.id,
      username,
      card: ''
    };

    const room = new Room({
      users: [user],
      voting: [user],
      reveal: false,
      gameOptions: {
        gameName,
        votingSystem: 'Fibo',
        allowedReveal: [user],
        manageIssues: [user]
      }
    });

    await room.save();

    client.join(room.id);

    io.to(room.id).emit('server:new_room', {
      roomId: room.id,
      users: room.users
    });

    client.emit('server:client_id', client.id);
  });

  client.on('client:join_room', async ({ username, roomId, clientId }) => {
    console.log('Client Join Room', username, roomId);

    if (!isValidObjectId(roomId)) {
      console.log('Invalid room id. Room id provided: ', roomId);
      return;
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return;
    }

    if (!username) {
      username = '';
    }

    console.log(clientId);

    if (!clientId) {
      clientId = client.id;
    } else {
      client.sessionId = clientId;
    }

    const user: User = {
      clientId,
      username,
      card: ''
    };

    if (room.users.some(user => user.clientId === clientId)) {
      console.log('User already joined to this Room');
      io.to(room.id).emit('server:user_joined', {
        roomUsers: room.users,
        reveal: room.reveal,
        gameName: room.gameOptions.gameName,
        coffeeTime: room.coffee,
        cardsVotes: room.cards
      });
      client.emit('server:user_joined', {
        roomUsers: room.users,
        reveal: room.reveal,
        gameName: room.gameOptions.gameName,
        coffeeTime: room.coffee,
        cardsVotes: room.cards
      });
      return;
    }

    room.users.push(user);
    room.voting.push(user);

    await room.save();

    client.join(room.id);

    io.to(room.id).emit('server:user_joined', {
      roomUsers: room.users,
      reveal: room.reveal,
      gameName: room.gameOptions.gameName,
      coffeeTime: room.coffee,
      cardsVotes: room.cards
    });

    client.emit('server:client_id', clientId);
  });

  client.on('client:add_username', async ({ username, clientId, roomId }) => {
    await Room.updateOne(
      {
        _id: roomId
      },
      {
        $set: {
          'users.$[e1].username': username,
          'voting.$[e1].username': username
        }
      },
      {
        arrayFilters: [{ 'e1.clientId': clientId }]
      }
    );

    const room = await Room.findById(roomId).exec();

    if (room) {
      io.to(roomId).emit('server:users', {
        roomVoting: room.voting,
        reveal: room.reveal
      });
      client.emit('server:client_id', client.id);
    }
  });

  client.on('client:card_select', async ({ card, roomId, clientId }) => {
    console.log('Client select card', roomId, card, clientId);

    const room = await Room.findById(roomId);

    if (!room) {
      return;
    }

    const userIndex = room.users.findIndex(user => user.clientId === clientId);
    const userVotingIndex = room.voting.findIndex(
      user => user.clientId === clientId
    );

    if (userIndex === -1) {
      return;
    }

    room.users[userIndex].card = card;

    if (userVotingIndex === -1) {
      room.voting.push(room.users[userIndex]);
    } else {
      room.voting[userVotingIndex].card = card;
    }

    await room.save();

    io.to(roomId).emit('server:users', {
      roomVoting: room.voting,
      reveal: room.reveal
    });

    client.emit('server:users', {
      roomVoting: room.voting,
      reveal: room.reveal
    });
  });

  client.on('client:reveal_cards', async roomId => {
    console.log('Client Reveal Cards', roomId);

    const room = await Room.findById(roomId);

    if (!room) {
      return;
    }

    room.reveal = true;

    const voters = room.voting
      .map(user => user.card)
      .filter(card => {
        if (!isNaN(Number(card)) && card.length > 0) {
          return true;
        }
      });

    const averageVoting =
      voters.reduce((a, b) => Number(a) + Number(b), 0) / voters.length;

    const roundAverageVoting = round(averageVoting, 1);

    const cards = room.voting.map(user => user.card);

    const cardsSet = new Set([...cards]);

    const cardsVotes: {
      card: string;
      quantity: number;
    }[] = [];

    cardsSet.forEach(card => {
      if (card) {
        const vote = {
          card,
          quantity: cards.filter(c => c === card).length
        };
        cardsVotes.push(vote);
      }
    });

    if (cardsSet.has('☕')) {
      room.coffee = true;
      io.to(roomId).emit('server:coffee');
    }

    room.cards = cardsVotes;

    io.to(roomId).emit('server:reveal_cards', {
      averageVoting: roundAverageVoting,
      cardsVotes
    });

    room.save();
  });

  client.on('client:start_new_voting', async roomId => {
    console.log('Client Started New Voting', roomId);

    const room = await Room.findById(roomId);

    if (!room) {
      return;
    }

    room.users = room.users.map(user => {
      return { ...user, card: '' };
    });

    room.voting = room.users;
    room.reveal = false;
    room.cards = [];
    room.coffee = false;

    room.save();

    io.to(roomId).emit('server:start_new_voting', {
      roomUsers: room.users
    });
  });

  client.on('disconnect', async reason => {
    console.log('Client Disconnected:', client.id, client.sessionId, reason);

    const room = await Room.findOne({
      'users.clientId': client.sessionId
    }).exec();

    if (!room) {
      console.log('No room found');

      return;
    }

    const userIndex = room.users.findIndex(
      user => user.clientId === client.sessionId
    );

    const userVotingIndex = room.voting.findIndex(
      user => user.clientId === client.sessionId
    );

    room.users.splice(userIndex, 1);

    if (room.users.length === 0) {
      console.log('Room Deleted');
      room.delete();
      return;
    }

    if (room.voting[userVotingIndex].card.length > 0) {
      room.save();
      client.broadcast
        .to(room.id)
        .emit('server:users', { roomVoting: room.voting, reveal: room.reveal });
      return;
    }

    room.voting.splice(userVotingIndex, 1);
    room.save();

    client.broadcast
      .to(room.id)
      .emit('server:users', { roomVoting: room.voting, reveal: room.reveal });
  });
});
