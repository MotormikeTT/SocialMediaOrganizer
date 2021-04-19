import * as React from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import HomePageGallery from "../screens/homepagegallery";
import Authentication from "../screens/authentication";
import GalleryPost from "../screens/gallerypost";

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomePageGallery} />
        <Stack.Screen name="Authentication" component={Authentication} />
        <Stack.Screen name="Joke2" component={GalleryPost} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
