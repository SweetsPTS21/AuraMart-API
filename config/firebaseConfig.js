// Import the functions you need from the SDKs you need
const firebase = require("firebase/app");
const FBstorage = require("firebase/storage");

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBvkRB6av5n2FCC3GeSD4a7KXjueJphnPE",
    authDomain: "tiki-2fb09.firebaseapp.com",
    projectId: "tiki-2fb09",
    storageBucket: "tiki-2fb09.appspot.com",
    messagingSenderId: "402536837269",
    appId: "1:402536837269:web:b8d6adfc29e0b16c232b9c",
    measurementId: "G-KDL280WBHP",
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const storage = FBstorage.getStorage(app);

module.exports = storage;
