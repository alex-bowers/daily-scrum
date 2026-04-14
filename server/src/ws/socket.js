import { WebSocketServer } from 'ws';

let wss;

export function createWsServer(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket) => {
    socket.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });

  return wss;
}

export function broadcast(event, payload) {
  if (!wss) return;
  const message = JSON.stringify({ event, payload });
  for (const client of wss.clients) {
    if (client.readyState === 1 /* OPEN */) {
      client.send(message);
    }
  }
}
