import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCMR62nEaKcfRts4UsAbwiwGcYePM1bd6I",
  authDomain: "wiki-5fdb9.firebaseapp.com",
  databaseURL: "https://wiki-5fdb9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "wiki-5fdb9",
  storageBucket: "wiki-5fdb9.firebasestorage.app",
  messagingSenderId: "77364766797",
  appId: "1:77364766797:web:abad833e88c665972f5404",
  measurementId: "G-PL73R0KCET"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
