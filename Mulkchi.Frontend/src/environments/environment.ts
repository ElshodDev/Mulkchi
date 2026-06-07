const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const environment = {
  production: false,
  apiUrl: `http://${host}:5000/api`,
  signalRUrl: `http://${host}:5000/hubs`,
  frontendUrl: `http://${host}:4200`,
  googleClientId: '',
};
