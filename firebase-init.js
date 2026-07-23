  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
  import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

  const firebaseConfig = {
    apiKey: "AIzaSyD1TA78WcqWNDLkbhe6We9LM_AkmQs04EM",
    authDomain: "bridgegate-1a2c6.firebaseapp.com",
    databaseURL: "https://bridgegate-1a2c6-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "bridgegate-1a2c6",
    storageBucket: "bridgegate-1a2c6.firebasestorage.app",
    messagingSenderId: "544390125037",
    appId: "1:544390125037:web:b7f539c56d2aaea6f943e4",
    measurementId: "G-PS3K5YNR96"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  window._authReady = new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        window._authToken = null; // refreshed lazily below
        user.getIdToken().then(t => { window._authToken = t; resolve(t); });
      }
    });
  });

  window._getAuthToken = async function(){
    if (!auth.currentUser) {
      await signInAnonymously(auth).catch(e => console.warn('Auth sign-in failed', e));
    }
    if (auth.currentUser) {
      const t = await auth.currentUser.getIdToken();
      window._authToken = t;
      return t;
    }
    return null;
  };

  signInAnonymously(auth).catch(e => console.warn('Initial anon sign-in failed', e));
