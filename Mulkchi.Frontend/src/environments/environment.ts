const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const environment = {
  production: false,
  apiUrl: `http://${host}:5000/api`,
  signalRUrl: `http://${host}:5000/hubs`,
  frontendUrl: `http://${host}:4200`,
  googleClientId: '875022387846-mdv00n1hor9rc69fhe0b7b5m1lu7hequ.apps.googleusercontent.com',
};
