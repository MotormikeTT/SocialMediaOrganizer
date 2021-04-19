import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AppNavigator from "./navigator/AppNavigator";

export default function App() {
  return <AppNavigator />;
}

const styles = StyleSheet.create({
  form: {
    padding: 10,
    marginTop: 80,
  },
  txt: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "bold",
  },
});
