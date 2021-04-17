import React, { useState, useReducer, useEffect } from "react";
import {
	TouchableOpacity,
	View,
	TextInput,
	Image,
	StyleSheet,
	Button,
	Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Permissions from "expo-permissions";
import * as FileSystem from "expo-file-system";
import { db, firestore } from "../FirebaseConfig";
import { Audio } from "expo-av";

import BlankImage from "../assets/blankimage.png";

const AudioCaption = () => {
	const initialState = {
		caption: "",
		picUri: "",
		recordingUri: "",
		recording: null,
		soundObject: null,
	};

	const reducer = (state, newState) => ({ ...state, ...newState });
	const [state, setState] = useReducer(reducer, initialState);
	const [selectedImage, setSelectedImage] = useState(BlankImage);
	const COLLECTION = "posts";

	const verifyCameraPermissions = async () => {
		const result = await Permissions.askAsync(Permissions.CAMERA);
		if (result.status !== "granted") {
			Alert.alert(
				"Insufficient Permissions!",
				"You need to grant camera permissions to use this app.",
				[{ text: "Okay" }]
			);
			return false;
		}
		return true;
	};

	const verifyAudioPermissions = async () => {
		const result = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
		if (result.status !== "granted") {
			Alert.alert(
				"Insufficient Permissions!",
				"You need to grant audio recording permissions to use this app.",
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
		const hasPermission = await verifyCameraPermissions();
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

	startRecordingAudio = async () => {
		const hasPermission = await verifyAudioPermissions();
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

	stopRecordingAudio = async () => {
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

	playRecordedAudio = async () => {
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
		firestore
			.collection(COLLECTION)
			.add(
				{
					pictureuri: newPicPath,
					recordinguri: newRecordPath,
					caption: state.caption,
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

	return (
		<View style={styles.inputContainer}>
			<View style={{ alignItems: "center" }}>
				<TouchableOpacity
					style={styles.image}
					activeOpacity={0.8}
					onPress={promptForPictureResponse}
				>
					<Image source={selectedImage} style={styles.image} />
				</TouchableOpacity>
			</View>
			<View style={{ marginTop: 20, alignItems: "center" }}>
				<TextInput
					placeholder="Caption..."
					style={styles.input}
					onChangeText={(val) => {
						setState({ caption: val });
					}}
					value={state.caption}
				/>
			</View>
			<View style={styles.buttonContainer}>
				<View style={{ flexDirection: "row", marginTop: 20 }}>
					<View style={{ flexDirection: "column", marginRight: 20 }}>
						<Button
							title={
								state.recording === null ? "Start Recording" : "Stop Recording"
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
				<View style={styles.button}>
					<Button title="Save" color="red" onPress={SaveItemHandler} />
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	inputContainer: { margin: 10 },
	image: {
		width: 180,
		height: 180,
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

export default AudioCaption;
