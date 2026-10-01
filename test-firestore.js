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
    const q = query(collection(db, 'users'), limit(1));
    const snap = await getDocs(q);
    console.log("Users:", snap.docs.length);
    if (snap.empty) {
      console.log("No users.");
      return;
    }
    const agentId = snap.docs[0].id;
    console.log("Agent ID:", agentId);
    
    const propsQ = query(
      collection(db, 'properties'), 
      where('agent_id', '==', agentId),
      where('is_active', '==', true)
    );
    await getDocs(propsQ);
    console.log("Properties query succeeded!");
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
run();
