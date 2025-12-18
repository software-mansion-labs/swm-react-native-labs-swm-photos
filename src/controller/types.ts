/**
 * Type definitions - state
 *
 * The state of a component is any data that completely represents its current lifecycle stage.
 */

export type State = NonNullable<boolean | number | string | object>;

/**
 * Type definitions - state transitions
 *
 * State transition is a function, that updates next component state based on its current value and changes in the previous, linked component state.
 * Each state transition returns a boolean value that indicates whether the transition should be applied (= save its result as next component state).
 */

// In this context, Ptype and Ntype are types of previous and next component states respectively
// When null is returned, then result should not be applied
export type StateTransition<Ptype, Ntype> = (
  pprev: Ptype,
  pnext: Ptype,
  nprev: Ntype,
) => Ntype | null;

/**
 * Type definitions - state transition graph
 *
 * State transition graph defines the flow of state transitions between components.
 * Each node (component) has a list of dependable components, whose states depend on the given component state.
 */

// Nodes are indexed by names (string values)
export type StateNetwork = Record<string, StateNetworkNode>;

// Helper definitions - state graph node
export type StateNetworkNode = {
  initialState: State; // Initial state
  locked: boolean; // A flag which decides whether node is in locked state (and should reject any state updates) or not
  links: StateLink<any, any>[]; // Connected nodes
};

// Helper definitions - state relation
export type StateLink<Ptype, Ntype> = {
  name: string; // If we have A -> B edge in a graph, then "name" indicates the B node
  transition: StateTransition<Ptype, Ntype>;
};
