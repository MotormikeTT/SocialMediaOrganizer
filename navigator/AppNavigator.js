import * as React from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";

import HomePageGallery from "../screens/homepagegallery";
import Authentication from "../screens/authentication";
import GalleryPost from "../screens/gallerypost";

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function AppNavigator() {
	function drawerNavigator() {
		return (
			<Drawer.Navigator>
				<Drawer.Screen name="Home" component={HomePageGallery} />
				<Drawer.Screen
					name="New Post"
					component={GalleryPost}
					initialParams={{ post: null }}
				/>
			</Drawer.Navigator>
		);
	}

	return (
		<NavigationContainer>
			<Stack.Navigator>
				<Stack.Screen
					name="Home"
					children={drawerNavigator}
					options={{
						headerLeft: () => null,
					}}
				/>
				<Stack.Screen
					name="Authentication"
					component={Authentication}
					options={{ title: "Sign In", headerLeft: () => null }}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
}

export default AppNavigator;
