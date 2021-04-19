import React, { useState, useReducer } from "react";
import {
	TouchableOpacity,
	View,
	TextInput,
	Image,
	StyleSheet,
	Button,
	Alert,
} from "react-native";
import * as Sharing from "expo-sharing";
import * as ImagePicker from "expo-image-picker";
import * as Permissions from "expo-permissions";
import * as FileSystem from "expo-file-system";
import * as Location from "expo-location";
import { auth, firestore } from "../FirebaseConfig";
import { Audio } from "expo-av";

import BlankImage from "../assets/blankimage.png";

const GalleryPost = ({ route }) => {
	const PostData = route.params.post;
	const initialState = {
		caption: PostData?.caption ?? "",
		location: PostData?.location ?? "",
		picUri: PostData?.pictureuri ?? "",
		recordingUri: PostData?.recordinguri ?? "",
		recording: null,
		soundObject: null,
	};

	const reducer = (state, newState) => ({ ...state, ...newState });
	const [state, setState] = useReducer(reducer, initialState);
	const [selectedImage, setSelectedImage] = useState(
		PostData ? { uri: PostData.pictureuri } : BlankImage
	);
	const COLLECTION = "posts";

	const verifyPermissions = async (permission) => {
		const result = await Permissions.askAsync(permission);
		if (result.status !== "granted") {
			Alert.alert(
				"Insufficient Permissions!",
				"You need to grant permissions to use this app.",
				[{ text: "Okay" }]
			);
			return false;
		}
		return true;
	};

	const promptForPictureResponse = () => {
		Alert.alert(
			"Change Audio Picture",
			"",
			[{ text: "Pick existing picture", onPress: retrieveImageHandler }],
			{
				cancelable: true,
			}
		);
	};

	const retrieveImageHandler = async () => {
		const hasPermission = await verifyPermissions(Permissions.CAMERA);
		if (!hasPermission) {
			return false;
		}

		const image = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.5,
		});

		if (!image.cancelled) {
			setSelectedImage(image);
		}
	};

	const getCurrentLocation = async () => {
		if (await verifyPermissions(Permissions.LOCATION)) {
			let location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Highest,
			});
			// Reverse geocode a location to postal address
			let reverseGeocode = await Location.reverseGeocodeAsync(location.coords);
			let locationValue;
			if (reverseGeocode.length !== 0) {
				locationValue = `${reverseGeocode[0].street}, ${reverseGeocode[0].city}, ${reverseGeocode[0].region}`;
				setState({ location: locationValue });
			}
		}
	};

	const startRecordingAudio = async () => {
		const hasPermission = await verifyPermissions(Permissions.AUDIO_RECORDING);
		if (!hasPermission) {
			return false;
		} else {
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
				playsInSilentModeIOS: true,
				shouldDuckAndroid: true,
				interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
				playThroughEarpieceAndroid: false,
				staysActiveInBackground: true,
			});

			try {
				const recording = new Audio.Recording();
				await recording.prepareToRecordAsync(
					Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
				);
				await recording.startAsync();
				setState({ recording: recording });
				console.log("We are now recording!");
			} catch (error) {
				console.log("An error occurred on starting record:");
				console.log(error);
			}
		}
	};

	const stopRecordingAudio = async () => {
		try {
			await state.recording.stopAndUnloadAsync();
			const uri = state.recording.getURI();
			setState({ recordingUri: uri, recording: null });
			console.log("Recording stopped and stored at", uri);
		} catch (error) {
			console.log("An error occurred on stopping record:");
			console.log(error);
		}
	};

	const playRecordedAudio = async () => {
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
			await soundObject.loadAsync({ uri: state.recordingUri });
			await soundObject.setStatusAsync({ isLooping: false });
			await soundObject.playAsync();
			setState({ soundObject: soundObject });
			console.log("playing the recording!");
		} catch (error) {
			console.log("An error occurred on playback:");
			console.log(error);
		}
	};

	const saveFileToPermanentStorage = async (fileUri, fileName) => {
		const filePath =
			FileSystem.documentDirectory +
			state.caption.split(" ").join("-") +
			fileName;
		try {
			await FileSystem.copyAsync({ from: fileUri, to: filePath });
			console.log("File was copied to system! new path: " + filePath);
			return filePath;
		} catch (error) {
			console.log("An error occurred while coping: ");
			console.log(error);
			return filePath;
		}
	};

	const SaveItemHandler = async () => {
		// move pic to storage
		var newPicPath = await saveFileToPermanentStorage(
			selectedImage.uri,
			"captionpic.png"
		);
		setState({ picUri: newPicPath });
		// move audio to storage
		var newRecordPath = await saveFileToPermanentStorage(
			state.recordingUri,
			"captionaudio.m4a"
		);
		setState({ recordingUri: newRecordPath });

		// save contact to database
		var uid = auth.currentUser.uid;
		firestore
			.collection(COLLECTION)
			.add(
				{
					author: uid,
					pictureuri: newPicPath,
					recordinguri: newRecordPath,
					caption: state.caption,
					location: state.location,
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
	};

	const onShare = async () => {
		if (!(await Sharing.isAvailableAsync())) {
			alert(`Uh oh, sharing isn't available on your platform`);
			return;
		}

		await Sharing.shareAsync(selectedImage.uri);
	};

	return (
		<View style={styles.inputContainer}>
			<View style={{ alignItems: "center" }}>
				<TouchableOpacity
					style={{ padding: 10 }}
					activeOpacity={0.8}
					onPress={promptForPictureResponse}
				>
					<Image source={selectedImage} style={styles.image} />
				</TouchableOpacity>
			</View>
			<View style={{ marginTop: 20, alignItems: "center" }}>
				<TextInput
					placeholder="Caption"
					style={styles.input}
					onChangeText={(val) => {
						setState({ caption: val });
					}}
					value={state.caption}
				/>
				<TextInput
					placeholder="Enter Location or press button to retrieve"
					style={styles.input}
					onChangeText={(val) => {
						setState({ location: val });
					}}
					value={state.location}
				/>
				<Button
					style={styles.button}
					title="Get Current Location"
					onPress={getCurrentLocation}
				/>
			</View>
			<View style={styles.buttonContainer}>
				<View style={{ flexDirection: "row", marginTop: 20 }}>
					<View style={{ flexDirection: "column", marginRight: 20 }}>
						<Button
							title={
								state.recording === null ? "Record Caption" : "Stop Recording"
							}
							onPress={() => {
								state.recording === null
									? startRecordingAudio()
									: stopRecordingAudio();
							}}
						/>
					</View>
					<View style={{ flexDirection: "column" }}>
						<Button title="Play Recording" onPress={playRecordedAudio} />
					</View>
				</View>
			</View>
			<View style={styles.buttonContainer}>
				<View style={{ marginTop: 150, width: "30%" }}>
					<Button onPress={onShare} title="Share" />
				</View>
				<View style={{ width: "30%", marginTop: 10 }}>
					<Button title="Save" color="red" onPress={SaveItemHandler} />
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	inputContainer: { margin: 10 },
	image: {
		marginBottom: 10,
		width: 380,
		height: 280,
	},
	buttonContainer: {
		alignItems: "center",
		width: "100%",
	},
	button: {
		width: "40%",
		marginTop: 20,
	},
	input: {
		marginBottom: 10,
		width: "80%",
		borderColor: "grey",
		borderWidth: 0.5,
		borderRadius: 4,
		paddingHorizontal: 20,
		padding: 5,
	},
	statusLabel: {
		backgroundColor: "#dabddb",
		padding: 17,
		textAlign: "center",
		fontSize: 17,
	},
	label: {
		marginTop: 15,
	},
});

export default GalleryPost;
