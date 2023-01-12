import { createServer } from 'http';
import mongoose, { disconnect } from 'mongoose';
import { Server, Socket } from 'socket.io';
import app from './app';
import addUsername from './sockets/addUsername';

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

import createRoom from './sockets/createRoom';
import joinRoom from './sockets/joinRoom';
import revealCards from './sockets/revealCards';
import selectCard from './sockets/selectCard';
import startNewVoting from './sockets/startNewVoting';
import clientDisconnect from './sockets/clientDisconnect';

const onConnection = (socket: Socket) => {
  createRoom(io, socket);
  joinRoom(io, socket);
  addUsername(io, socket);
  selectCard(io, socket);
  revealCards(io, socket);
  startNewVoting(io, socket);
  clientDisconnect(socket);
};

io.on('connection', onConnection);
