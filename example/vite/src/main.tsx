import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GrazProvider } from "graz";
import { cosmoshub } from "graz/chains";
import * as React from "react";
import * as ReactDOM from "react-dom/client";

import App from "./App";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GrazProvider
        grazOptions={{
          chains: [cosmoshub],

        }}
      >
        <App />
      </GrazProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
