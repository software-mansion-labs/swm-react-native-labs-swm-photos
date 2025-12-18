import { observable } from "@legendapp/state";
import { use$ } from "@legendapp/state/react";
import { stateNetwork } from "./stateNetwork";
import { State } from "./types";

/**
 * State machine mechanism definition
 */

export namespace StateMachine {
  // A global store utilizing Legend State
  const store$ = observable(
    Object.fromEntries(
      Object.entries(stateNetwork).map(([name, config]) => [
        name,
        config.initialState,
      ]),
    ),
  );

  // Getters - observe a state
  export function observe<T extends State>(key: keyof typeof stateNetwork): T {
    return use$(store$[key]) as T;
  }

  /**
   * Setters - setting a new state
   * @param key - node identifier (name)
   * @param state - new state value to save
   * @param withUnlock - allows unlocking a node immediately before saving a new state.
   */
  export function set<T extends State>(
    key: keyof typeof stateNetwork,
    state: T,
    withUnlock?: boolean,
  ): void {
    if (withUnlock) unlock(key);

    // Do not update neither push updates through locked nodes
    if (isLocked(key)) return;

    // Store previous state before override
    const previous = store$[key].get();
    store$[key].set(state);

    // Send information to all connected nodes
    for (const link of stateNetwork[key].links) {
      const result = link.transition(previous, state, store$[link.name].get());

      // If the next state is valid, use a recursive call to propagate the change through the network in DFS style
      if (result) set(link.name, result);
    }
  }

  // Lock a state
  export function lock(key: keyof typeof stateNetwork): void {
    stateNetwork[key].locked = true;
  }

  // Unlock a state
  export function unlock(key: keyof typeof stateNetwork): void {
    stateNetwork[key].locked = false;
  }

  // A getter for state lock status
  export function isLocked(key: keyof typeof stateNetwork): boolean {
    return stateNetwork[key].locked;
  }
}
