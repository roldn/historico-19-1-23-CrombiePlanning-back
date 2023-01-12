import { Server, Socket } from 'socket.io';
import Room from '../models/Room';

export default (client: Socket & { sessionId?: string }) => {
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
};
