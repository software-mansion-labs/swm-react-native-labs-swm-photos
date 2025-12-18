import React from "react";
// Kepler-specific packages - available in Kepler runtime but not in dev environment
import {
  NavigationContainer,
  useNavigation,
  // eslint-disable-next-line import/no-unresolved
} from "@amzn/react-navigation__native";
// eslint-disable-next-line import/no-unresolved
import { createStackNavigator } from "@amzn/react-navigation__stack";
import GalleryScreen from "@/app/index";
import SettingsScreen from "@/app/settings";

// Stack navigator
const Stack = createStackNavigator();

/**
 * NavigationStack component using react-navigation
 */
export function NavigationStack(
  props: React.ComponentProps<typeof Stack.Navigator>,
) {
  // In order to use this Stack, we need to explicitely define each screen
  return (
    <NavigationContainer>
      <Stack.Navigator {...props}>
        <Stack.Screen name="/gallery" component={GalleryScreen} />
        <Stack.Screen name="/settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Export a preferred navigation hook - in this case, from expo-router
export { useNavigation };
