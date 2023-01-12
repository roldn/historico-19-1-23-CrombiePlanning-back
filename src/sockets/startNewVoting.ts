import { Server, Socket } from 'socket.io';
import Room from '../models/Room';

export default (io: Server, client: Socket & { sessionId?: string }) => {
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
};
