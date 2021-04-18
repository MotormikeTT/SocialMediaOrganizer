import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Authentication from "./screens/authentication";
import Gallery from "./screens/homepagegallery";
import GalleryPost from "./screens/gallerypost";

export default function App() {
	return (
		<View style={styles.form}>
			<Text style={styles.txt}>Social Media Organizer</Text>
			<Gallery></Gallery>
		</View>
	);
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
