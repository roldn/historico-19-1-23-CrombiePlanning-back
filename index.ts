import appRouter from './routes';
import cors from 'cors';
import express from "express";
import { Server } from 'socket.io';
import http from 'http';
import { getIssue } from './controllers/issuesController';

const app = express();
const server = http.createServer(app);

export const io = new Server(server, { cors: { origin : "*", methods : ["GET", "POST"] }});

const port = 3000;

app.use(cors());
app.use(express.json());

app.use('/', appRouter);

app.get('/', (req, res) => { res.send('Backend Running'); });

io.on('connection', (socket) => {
    getIssue(socket)
})

app.use(express.static(__dirname + '/public'))

server.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`);
});
