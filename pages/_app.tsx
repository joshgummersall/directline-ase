import type { AppProps } from "next/app";
import { Provider } from "../components/state";

import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider>
      <Component {...pageProps} />
    </Provider>
  );
}
