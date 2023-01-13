import { Server, Socket } from 'socket.io';
import Room from '../models/Room';
import { User } from '../models/User';

export default (io: Server, client: Socket & { sessionId?: string }) => {
  client.on('client:create_room', async ({ username, gameName, clientId }) => {
    console.log('Client Create Room', client.id, username);

    if (clientId) {
      client.sessionId = clientId;
    } else {
      client.sessionId = client.id;
    }

    if (!client.sessionId) {
      console.log('invalid session id');
      return;
    }

    const user: User = {
      clientId: client.sessionId,
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

    client.emit('server:client_id', client.sessionId);
  });
};
