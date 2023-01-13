import { Server, Socket } from 'socket.io';
import Room from '../models/Room';
import { round } from '../utils/roundNumber';

export default (io: Server, client: Socket & { sessionId?: string }) => {
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

    room.average = roundAverageVoting;

    room.save();
  });
};
