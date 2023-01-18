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

    if (!clientId) {
      clientId = client.id;
      client.sessionId = clientId;
    } else {
      client.sessionId = clientId;
    }

    const userVotingIndex = room.voting.findIndex(
      user => user.clientId === client.sessionId
    );

    const userCard = room.voting[userVotingIndex]?.card;

    const user: User = {
      clientId,
      username,
      card: userCard || ''
    };

    if (room.users.some(user => user.clientId === clientId)) {
      console.log('User already joined to this Room');

      io.to(room.id).emit('server:user_joined', {
        roomUsers: room.users,
        reveal: room.reveal,
        gameName: room.gameOptions.gameName,
        coffeeTime: room.coffee,
        cardsVotes: room.cards,
        average: room.average,
        gameOptions: room.gameOptions
      });
      return;
    }

    if (room.voting.some(user => user.clientId === clientId)) {
      console.log('User voted and returned to this Room');

      room.users.push(user);

      client.join(room.id);

      io.to(room.id).emit('server:user_joined', {
        roomUsers: room.users,
        reveal: room.reveal,
        gameName: room.gameOptions.gameName,
        coffeeTime: room.coffee,
        cardsVotes: room.cards,
        average: room.average,
        gameOptions: room.gameOptions
      });

      client.emit('server:selected_card', user.card);

      await room.save();

      return;
    }

    room.users.push(user);
    room.voting.push(user);

    await room.save();

    client.join(room.id);

    if (room.reveal) {
      io.to(room.id).emit('server:user_joined', {
        roomUsers: room.voting,
        reveal: room.reveal,
        gameName: room.gameOptions.gameName,
        coffeeTime: room.coffee,
        cardsVotes: room.cards,
        average: room.average,
        gameOptions: room.gameOptions
      });
    } else {
      io.to(room.id).emit('server:user_joined', {
        roomUsers: room.users,
        reveal: room.reveal,
        gameName: room.gameOptions.gameName,
        coffeeTime: room.coffee,
        cardsVotes: room.cards,
        average: room.average,
        gameOptions: room.gameOptions
      });
    }

    client.emit('server:client_id', clientId);
  });
};
