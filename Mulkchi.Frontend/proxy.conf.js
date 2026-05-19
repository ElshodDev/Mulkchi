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
  }
};
