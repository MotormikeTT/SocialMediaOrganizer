import React, { useState } from "react";
import { View, TextInput, Text, Button, Alert, StyleSheet } from "react-native";
import { db, firestore, auth } from "../FirebaseConfig";
import { LogBox } from "react-native";

LogBox.ignoreLogs(["Setting a timer"]);

export default function Authentication({ navigation }) {
  [registrationEmail, setRegistrationEmail] = useState("");
  [registrationPassword, setRegistrationPassword] = useState("");
  [loginEmail, setLoginEmail] = useState("");
  [loginPassword, setLoginPassword] = useState("");
  [loggedIn, setLoggedIn] = useState(false);
  [signUp, setSignUp] = useState(false);
  [databaseData, setDatabaseData] = useState("");

  registerWithFirebase = () => {
    if (registrationEmail.length < 4) {
      Alert.alert("Please enter an email address.");
      return;
    }

    if (registrationPassword.length < 4) {
      Alert.alert("Please enter a password.");
      return;
    }

    auth
      .createUserWithEmailAndPassword(registrationEmail, registrationPassword)
      .then(function (_firebaseUser) {
        Alert.alert("user registered!");

        setRegistrationEmail("");
        setRegistrationPassword("");
        setSignUp(false);
      })
      .catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;

        if (errorCode == "auth/weak-password") {
          Alert.alert("The password is too weak.");
        } else {
          Alert.alert(errorMessage);
        }
        console.log(error);
      });
  };

  loginWithFirebase = () => {
    if (loginEmail.length < 4) {
      Alert.alert("Please enter an email address.");
      return;
    }

    if (loginPassword.length < 4) {
      Alert.alert("Please enter a password.");
      return;
    }

    auth
      .signInWithEmailAndPassword(loginEmail, loginPassword)
      .then(function (_firebaseUser) {
        Alert.alert("user logged in!");
        setLoggedIn(true);
        navigation.navigate("Home");
        // load data
        //retrieveDataFromFirebase();
      })
      .catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;

        if (errorCode === "auth/wrong-password") {
          Alert.alert("Wrong password.");
        } else {
          Alert.alert(errorMessage);
        }
      });
  };

  signoutWithFirebase = () => {
    auth.signOut().then(function () {
      // if logout was successful
      if (!auth.currentUser) {
        Alert.alert("user was logged out!");
        setLoggedIn(false);
      }
    });
  };

  function saveDataWithFirebase() {
    // *********************************************************************
    // When saving data, to create a new collection you can use SET
    // and when updating you can use UPDATE (refer to docs for more info)
    // -- https://firebase.google.com/docs/firestore/manage-data/add-data
    // *********************************************************************

    var userId = auth.currentUser.uid;

    // SAVE DATA TO REALTIME DB
    db.ref("users/" + userId).set({
      text: databaseData,
    });

    // SAVE DATA TO FIRESTORE
    firestore
      .collection("users")
      .doc(userId)
      .set(
        {
          text: databaseData,
        },
        {
          merge: true, // set with merge set to true to make sure we don't blow away existing data we didnt intend to
        }
      )
      .then(function () {
        Alert.alert("Document successfully written!");
      })
      .catch(function (error) {
        Alert.alert("Error writing document");
        console.log("Error writing document: ", error);
      });
  }

  function retrieveDataFromFirebase() {
    // *********************************************************************
    // When loading data, you can either fetch the data once like in these examples
    // -- https://firebase.google.com/docs/firestore/query-data/get-data
    // or you can listen to the collection and whenever it is updated on the server
    // it can be handled automatically by your code
    // -- https://firebase.google.com/docs/firestore/query-data/listen
    // *********************************************************************

    var userId = auth.currentUser.uid;

    /*****************************/
    // LOAD DATA FROM REALTIME DB
    /*****************************/

    // read once from data store
    // db.ref('/users/' + userId).once('value').then(function (snapshot) {
    //   setDatabaseData(snapshot.val().text);
    // });

    /*****************************/
    // LOAD DATA FROM FIRESTORE
    /*****************************/

    // read once from data store
    // firestore.collection("users").doc(userId).get()
    //   .then(function (doc) {
    //     if (doc.exists) {
    //       setDatabaseData(doc.data().text);
    //       console.log("Document data:", doc.data());
    //     } else {
    //       // doc.data() will be undefined in this case
    //       console.log("No such document!");
    //     }
    //   })
    //   .catch(function (error) {
    //     console.log("Error getting document:", error);
    //   });

    // For real-time updates:
    firestore
      .collection("users")
      .doc(userId)
      .onSnapshot(function (doc) {
        setDatabaseData(doc.data().text);
        console.log("Document data:", doc.data());
      });
  }

  return (
    <View style={styles.form}>
      {!loggedIn && (
        <View>
          {signUp && (
            <View>
              <Text style={styles.label}>Register with Firebase</Text>
              <TextInput
                style={styles.textInput}
                onChangeText={(value) => setRegistrationEmail(value)}
                autoCapitalize="none"
                autoCorrect={false}
                autoCompleteType="email"
                keyboardType="email-address"
                placeholder="email"
              />
              <TextInput
                style={styles.textInput}
                onChangeText={(value) => setRegistrationPassword(value)}
                autoCapitalize="none"
                autoCorrect={false}
                autoCompleteType="password"
                keyboardType="visible-password"
                placeholder="password"
              />
              <Button
                style={styles.button}
                title="Register"
                onPress={registerWithFirebase}
              />
              <Text
                style={styles.loginText}
                onPress={() => {
                  navigation.setOptions({ title: "Sign In" });
                  setSignUp(false);
                }}
              >
                Already Registered? Click here to login
              </Text>
            </View>
          )}
          {!signUp && (
            <View>
              <Text style={styles.label}>Sign In with Firebase</Text>
              <TextInput
                style={styles.textInput}
                onChangeText={(value) => setLoginEmail(value)}
                autoCapitalize="none"
                autoCorrect={false}
                autoCompleteType="email"
                keyboardType="email-address"
                placeholder="email"
              />
              <TextInput
                style={styles.textInput}
                onChangeText={(value) => setLoginPassword(value)}
                autoCapitalize="none"
                autoCorrect={false}
                autoCompleteType="password"
                keyboardType="visible-password"
                placeholder="password"
              />
              <Button
                style={styles.button}
                title="Login"
                onPress={loginWithFirebase}
              />
              <Text
                style={styles.loginText}
                onPress={() => {
                  navigation.setOptions({ title: "Sign Up" });
                  setSignUp(true);
                }}
              >
                Don't have account? Click here to signup
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    margin: 30,
    marginTop: 60,
  },
  label: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: "center",
  },
  textInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 15,
    paddingVertical: 4,
    paddingHorizontal: 2,
    textAlignVertical: "top",
  },
  loginText: {
    color: "#3740FE",
    marginTop: 25,
    textAlign: "center",
  },
  buttonContainer: {
    paddingVertical: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    width: "40%",
  },
  signOutButton: {
    paddingVertical: 40,
  },
});
