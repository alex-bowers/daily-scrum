import { ref, onUnmounted } from 'vue';

export function useWebSocket(handlers) {
  const connected = ref(false);
  let socket = null;
  let reconnectTimer = null;

  function connect() {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    socket = new WebSocket(`${protocol}://${location.host}/ws`);

    socket.addEventListener('open', () => {
      connected.value = true;
    });

    socket.addEventListener('close', () => {
      connected.value = false;
      reconnectTimer = setTimeout(connect, 3000);
    });

    socket.addEventListener('error', (err) => {
      console.error('WebSocket error:', err);
    });

    socket.addEventListener('message', (event) => {
      try {
        const { event: name, payload } = JSON.parse(event.data);
        if (handlers[name]) handlers[name](payload);
      } catch (e) {
        console.error('WS message parse error:', e);
      }
    });
  }

  connect();

  onUnmounted(() => {
    clearTimeout(reconnectTimer);
    socket?.close();
  });

  return { connected };
}
