//@ts-ignore
import { Link, LinkProps } from "expo-router";
import React from "react";

/**
 * Helper types - NavigationLink props
 */
type NavigationLinkProps = {
	href: LinkProps["href"];       // A route path
	children: React.ReactElement;
};


/**
 * Wrapps any component inside the <Link> component from expo-router
 */
export function NavigationLink({href, children}: NavigationLinkProps) {
	return (
		<Link href={href} asChild>
			{children}
		</Link>
	);
}