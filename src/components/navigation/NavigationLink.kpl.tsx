import React from "react";
// eslint-disable-next-line import/no-unresolved
import { useNavigation } from "@amzn/react-navigation__native";

/**
 * Helper types - NavigationLink props
 */
type NavigationLinkProps = {
  href: string; // A route path
  children: React.ReactElement;
};

/**
 * Wrapps any component inside the <Pressable> with react-native navigation functionality
 */
export function NavigationLink({ href, children }: NavigationLinkProps) {
  // This time we need to relay on build-in navigation from react-native
  const navigation = useNavigation() as any;

  const childElement = children as React.ReactElement<{
    onPress?: (event: any) => void;
  }>;

  // This attempts to mimic Link's asChild property
  // - It ensures that children's onPress is being executed each time
  return React.cloneElement(childElement, {
    onPress: (event: any) => {
      navigation.navigate(href);
      if (childElement.props.onPress) {
        childElement.props.onPress(event);
      }
    },
  });
}
