import fs from 'fs';
import https from 'https';
import express from 'express';
import { createWsServer } from './ws/socket.js';
import todosRouter from './routes/todos.js';
import githubRouter from './routes/github.js';
import teamRouter from './routes/team.js';

const app = express();

const options = {
    key: fs.readFileSync('./certs/key.pem'),
    cert: fs.readFileSync('./certs/cert.pem')
};

const server = https.createServer(options, app);

createWsServer(server);

app.use(express.json());
app.use('/api/todos', todosRouter);
app.use('/api/github', githubRouter);
app.use('/api/team', teamRouter);

const PORT = process.env.SERVER_PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
});
