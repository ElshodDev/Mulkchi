module.exports = {
  '/api': {
    target: 'http://localhost:5000',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug'
  },
  '/hubs': {
    target: 'http://localhost:5000',
    secure: false,
    changeOrigin: true,
    ws: true, // WebSocket support for SignalR
    logLevel: 'debug'
  },
  '/avatars': {
    target: 'http://localhost:5000',
    secure: false,
    changeOrigin: true
  },
  '/uploads': {
    target: 'http://localhost:5000',
    secure: false,
    changeOrigin: true
  },
  '/chat-attachments': {
    target: 'http://localhost:5000',
    secure: false,
    changeOrigin: true
  }
};
