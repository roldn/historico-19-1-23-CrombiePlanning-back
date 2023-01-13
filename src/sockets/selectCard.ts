import { Server, Socket } from 'socket.io';
import Room from '../models/Room';

export default (io: Server, client: Socket & { sessionId?: string }) => {
  client.on('client:card_select', async ({ card, roomId, clientId }) => {
    console.log('Client select card', roomId, card, clientId, client.sessionId);

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
};
