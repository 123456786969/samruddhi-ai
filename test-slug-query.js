import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, limit } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDUiU1rgkGmjUaOwknYJ2A0DVhWrQZpyXg",
  authDomain: "xerotic-destiny-06rpq.firebaseapp.com",
  projectId: "xerotic-destiny-06rpq",
  storageBucket: "xerotic-destiny-06rpq.firebasestorage.app",
  messagingSenderId: "332618185576",
  appId: "1:332618185576:web:0ba9f972369147e1a9f4dd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-samruddhiai-a28d48e6-2050-4f48-a32f-f20463cefdb2");

async function run() {
  try {
    const slug = 'samruddhi-reality-l0jj';
    const usersQ = query(collection(db, 'users'), where('slug', '==', slug), limit(1));
    const snap = await getDocs(usersQ);
    console.log("Users with slug:", snap.docs.length);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
run();
