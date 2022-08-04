import firebase from "firebase/compat/app";
import initializeApp from "firebase/app";
import 'firebase/auth' ;
import 'firebase/firestore'
import { getFirestore } from "firebase/firestore";
import { collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD7Q60NRXYqGkXPa4kN5_VGGF-z9AqWA2c",
    authDomain: "topdownfrc.firebaseapp.com",
    projectId: "topdownfrc",
    storageBucket: "topdownfrc.appspot.com",
    messagingSenderId: "673337416411",
    appId: "1:673337416411:web:80d569149d04b6525f8afe",
    measurementId: "G-89XEB62ZYX"
};


console.log(firebase);
const app = firebase.initializeApp(firebaseConfig);

export const db = getFirestore(app);