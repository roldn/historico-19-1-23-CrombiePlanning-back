import { isValidObjectId } from 'mongoose';
import { Server, Socket } from 'socket.io';
import Room from '../models/Room';
import { User } from '../models/User';

export default (io: Server, client: Socket & { sessionId?: string }) => {
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
};
