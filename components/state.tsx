import React, { createContext, useState } from "react";

interface TState {
  botUrl: string;
  directLineSecret: string;
}

const initialContext = {
  botUrl: "",
  directLineSecret: "",
};

export const State = createContext<[TState, (state: TState) => void]>([
  initialContext,
  () => {},
]);

export const Provider: React.FC = ({ children }) => {
  const [state, setState] = useState<TState>(initialContext);

  return <State.Provider value={[state, setState]}>{children}</State.Provider>;
};
