import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GrazProvider } from "graz";
import { cosmoshub } from "graz/chains";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { ParaGrazConfig } from "@getpara/graz-integration";

import App from "./App";
import ParaWeb from "@getpara/react-sdk-lite";

const queryClient = new QueryClient();

// Get an API key at https://developer.getpara.com
// Modal will open with fake key but will not authenticate
export const para = new ParaWeb("beta_3e185167932bc6cc7ed11c0abed4dfb8");

const paraConfig: ParaGrazConfig = {
  paraWeb: para!,
  modalProps: { appName: "MyApp" },
  queryClient: queryClient,
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GrazProvider
        grazOptions={{
          chains: [cosmoshub],
          paraConfig: paraConfig,
        }}
      >
        <App />
      </GrazProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
