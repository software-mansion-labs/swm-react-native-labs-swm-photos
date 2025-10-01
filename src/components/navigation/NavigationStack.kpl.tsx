import React from "react";
//@ts-ignore
import { NavigationContainer, useNavigation } from '@amzn/react-navigation__native';
import { createStackNavigator } from '@amzn/react-navigation__stack';

// Stack navigator
const Stack = createStackNavigator();

/**
 * NavigationStack component using react-navigation
 */
export function NavigationStack(props: React.ComponentProps<typeof Stack.Navigator>) {
    // In order to use this Stack, we need to explicitely define each screen
    return (
        <NavigationContainer>
            <Stack.Navigator {...props}>
                <Stack.Screen name="/gallery" component={require('@/app/index').default} />
                <Stack.Screen name="/settings" component={require('@/app/settings').default} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

// Export a preferred navigation hook - in this case, from expo-router
export { useNavigation };