import React, { useReducer } from "react";
import {
	TouchableOpacity,
	FlatList,
	Text,
	Image,
	Button,
	View,
} from "react-native";
import { auth, firestore } from "../FirebaseConfig";
import { Audio } from "expo-av";
import { useFocusEffect } from "@react-navigation/native";

const HomePageGallery = (props) => {
	const initialState = {
		postList: [],
	};

	const reducer = (state, newState) => ({ ...state, ...newState });
	const [state, setState] = useReducer(reducer, initialState);
	const COLLECTION = "posts";

	useFocusEffect(() => {
		if (!auth.currentUser) props.navigation.navigate("Authentication");
		else {
			var uid = auth.currentUser.uid;

			firestore
				.collection(COLLECTION)
				.where("author", "==", uid)
				.get()
				.then((querySnapshot) => {
					const retrievedPostList = querySnapshot.docs.map((doc) => {
						return { id: doc.id, ...doc.data() };
					});
					setState({ postList: retrievedPostList });
				})
				.catch((error) => {
					console.error(error);
				});
		}
	});

	const playRecordedAudio = async (recordinguri) => {
		await Audio.setAudioModeAsync({
			// set to false to play through speaker (instead of headset)
			allowsRecordingIOS: false,
			interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
			playsInSilentModeIOS: true,
			shouldDuckAndroid: true,
			interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
			playThroughEarpieceAndroid: false,
			staysActiveInBackground: false,
		});

		try {
			const soundObject = new Audio.Sound();
			await soundObject.loadAsync({ uri: recordinguri });
			await soundObject.setStatusAsync({ isLooping: false });
			await soundObject.playAsync();
			console.log("playing the recording!");
		} catch (error) {
			console.log("An error occurred on playback:");
			console.log(error);
		}
	};

	return (
		<View>
			<Text
				style={{
					textAlign: "center",
					fontSize: 28,
					fontWeight: "bold",
					marginTop: 20,
				}}
			>
				List of posts
			</Text>
			<FlatList
				style={{ marginTop: 20, height: "85%" }}
				data={state.postList}
				renderItem={(itemData) => (
					<TouchableOpacity
						style={{ alignSelf: "center", marginTop: 15, marginBottom: 15 }}
						activeOpacity={0.8}
						onPress={() => {
							props.navigation.navigate("New Post", { post: itemData.item });
						}}
					>
						<Image
							source={{ uri: itemData.item.pictureuri }}
							style={{ width: 280, height: 180 }}
						/>
						<Text
							style={{
								textAlign: "center",
								fontSize: 18,
								fontWeight: "bold",
							}}
						>
							{itemData.item.caption}
						</Text>
						<Text
							style={{
								textAlign: "center",
								fontSize: 18,
								fontWeight: "bold",
							}}
						>
							{itemData.item.location}
						</Text>
						<Button
							title="Play Caption"
							onPress={() => playRecordedAudio(itemData.item.recordinguri)}
						/>
					</TouchableOpacity>
				)}
			></FlatList>
		</View>
	);
};

export default HomePageGallery;
