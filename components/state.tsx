import * as t from "runtypes";
import React, { createContext, useState } from "react";

export const StateT = t.Record({
  botUrl: t.String,
  directLineSecret: t.String,
});

const initialContext: t.Static<typeof StateT> = {
  botUrl: "",
  directLineSecret: "",
};

export const State = createContext<
  [t.Static<typeof StateT>, (state: t.Static<typeof StateT>) => void]
>([initialContext, () => {}]);

export const Provider: React.FC = ({ children }) => {
  const [state, setState] = useState<t.Static<typeof StateT>>(initialContext);

  return <State.Provider value={[state, setState]}>{children}</State.Provider>;
};
