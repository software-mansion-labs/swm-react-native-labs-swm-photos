//@ts-ignore
import { Stack, useNavigation } from "expo-router";

/**
 * Just an alias for expo-router Stack
 */
export function NavigationStack(props: React.ComponentProps<typeof Stack>) {
    return <Stack {...props} />
}

// Export a preferred navigation hook - in this case, from expo-router
export { useNavigation };