import * as firebase from "firebase";
import "@firebase/firestore";

// need to run: npm install --save firebase
// We will use the JS SDK with React Native

const firebaseConfig = {
	apiKey: "AIzaSyCOfl7c6a7xIvkp7WCGWW9ZAdXgWqkuUP0",
	authDomain: "personal-social-media-app.firebaseapp.com",
	projectId: "personal-social-media-app",
	storageBucket: "personal-social-media-app.appspot.com",
	messagingSenderId: "1013494694255",
	appId: "1:1013494694255:web:71bc772958e822d8fa289a",
};

let app = firebase.initializeApp(firebaseConfig);

export const db = app.database();
export const firestore = firebase.firestore(app);
export const auth = app.auth();
