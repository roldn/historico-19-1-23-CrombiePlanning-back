import express from 'express';
import http from 'http';
import cors from 'cors';
import appRouter from './routes';

import { Server } from 'socket.io';

const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());

app.use('/', appRouter);

app.get('/', (req, res) => {
  res.send('Backend Running');
});

// Endpoint que sirve un html desde el backend. Esto lo vamos a borrar mas adelante pero para practicar websocket nos viene bien.
// Si te defendes con vanilla js en el index.html podes meter mano
app.get('/socket', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// https://socket.io/get-started/chat

// Esta es la documentacion con la que hice el tutorial.
// Fijate que abajo de todo dice Homework
// Podemos ir viendo eso hasta el martes a modo de practica para ir agarrandole la mano

// Conexion socket escucha el evento connection
io.on('connection', socket => {
  // Escucha el evento chat message
  socket.on('chat message', msg => {
    // Emite un evento chat message que va a ser escuchado por todos, incluso el que lo envia...
    // Ahora hay que mejorarlo para que escuchen los demas y no el que envia
    // Si te animas metele ;D
    io.emit('chat message', msg);
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
