import React, { useState, useReducer, useEffect } from "react";
import { TouchableOpacity, FlatList, Alert } from "react-native";
import GalleryPost from "./screens/gallerypost";

const HomePageGallery = () => {
	return (
		<FlatList
			style={styles.list}
			data={contactList}
			renderItem={(itemData) => (
				<ContactListItem
					id={itemData.item.key}
					onDelete={removeContactItemHandler}
					item={itemData.item.value}
				/>
			)}
		></FlatList>
	);
};

export default HomePageGallery;
