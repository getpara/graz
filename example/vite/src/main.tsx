
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GrazProvider, WalletType } from "graz";
import { cosmoshub, osmosis } from "graz/chains";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "@getpara/react-sdk/styles.css";
import { Environment } from "@getpara/react-sdk";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
      <GrazProvider
        grazOptions={{
          chains: [cosmoshub, osmosis],
          defaultWallet: WalletType.KEPLR,
          paraConfig: {
            apiKey: "3e185167932bc6cc7ed11c0abed4dfb8",
            env:Environment.BETA
          }
        }}
      >
        <App />
      </GrazProvider>
    </QueryClientProvider>
);