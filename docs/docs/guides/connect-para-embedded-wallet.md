# Integrating Para Embedded Wallet with Graz

Para is a wallet connector that enables seamless integration with Cosmos-based chains in your Graz-powered application. This guide shows how to enable Para support, including the modal for user authentication and wallet selection.

**Note:** The Para integration is completely optional. You only need to install `@getpara/graz-integration` if you want to use Para wallet. Graz will work without it for users who don't configure Para support.

## Prerequisites

- A Graz project set up with React and `@tanstack/react-query`.
- Access to a Para API key (sign up at [developer.getpara.com](https://developer.getpara.com)).
- Enabled Cosmos network in you Para project settings
- Familiarity with Graz hooks like `useAccount` and `useConnect`.

## Step 1: Install Dependencies

Install the required packages:

```bash
npm install @getpara/graz-integration @getpara/react-sdk-lite @tanstack/react-query
```

Add a postinstall script to your `package.json` to stub out unused packages from react-sdk-lite:

```json
{
  "scripts": {
    "postinstall": "npx setup-para"
  }
}
```

Ensure Graz and its peer dependencies (e.g., `@cosmjs/*`) are already installed.

## Step 2: Create a ParaWeb Client

Create a ParaWeb instance using your API key and environment. Place this in a utility file (e.g., `lib/para/client.ts`):

```typescript
import { ParaWeb, Environment } from "@getpara/react-sdk-lite";

const API_KEY = process.env.NEXT_PUBLIC_PARA_API_KEY; // Set in .env
const ENVIRONMENT = (process.env.NEXT_PUBLIC_PARA_ENVIRONMENT as Environment) || Environment.BETA;

if (!API_KEY) {
  throw new Error("Para API key is required.");
}

export const para = new ParaWeb(API_KEY, ENVIRONMENT);
```

## Step 3: Configure GrazProvider

Wrap your app with `QueryClientProvider` and `GrazProvider`. Pass a `paraConfig` object to `GrazProvider` with your ParaWeb instance, modal props, and a shared QueryClient.

In your provider context (e.g., `context/Provider.tsx`):

```tsx
"use client";

import { para } from "@/lib/para/client"; // From Step 2
import { ParaGrazConfig } from "@getpara/graz-integration";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GrazProvider } from "graz"; // Note: Use "graz" import path
import { cosmosicsprovidertestnet } from "graz/chains"; // Example chain; adjust as needed
import { PropsWithChildren } from "react";

const queryClient = new QueryClient();

const paraConfig: ParaGrazConfig = {
  paraWeb: para,
  modalProps: { appName: "Your App Name" }, // Customize modal appearance. Learn more at https://docs.getpara.com/v2/react/guides/customization/modal
  queryClient, // Share with the internal ParaProvider
};

export const Provider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <GrazProvider
        grazOptions={{
          chains: [cosmosicsprovidertestnet], // Add your chains
          paraConfig,
        }}
      >
        {children}
      </GrazProvider>
    </QueryClientProvider>
  );
};
```

Wrap your root layout or app entry with this `Provider` (e.g., in `app/layout.tsx`):

```tsx
import { Provider } from "@/context/Provider";
// ... other imports

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
```

## Step 4: Connect and Use Para Wallet

Use Graz hooks to connect. Para will appear as an option (WalletType.PARA internally). The modal handles login and wallet selection.

Example in a header component:

```tsx
"use client";

import { useAccount, useConnect, WalletType } from "graz";

export default function Header() {
  const { data: account, isConnected } = useAccount();
  const { connect } = useConnect();

  const handleConnect = () => {
    connect({ walletType: WalletType.PARA }); // Triggers Para modal if needed
  };

  return (
    <header>
      {isConnected ? (
        <button>
          Connected: {account?.bech32Address?.slice(0, 12)}...{account?.bech32Address?.slice(-6)}
        </button>
      ) : (
        <button onClick={handleConnect}>Connect Para Wallet</button>
      )}
    </header>
  );
}
```

## Troubleshooting

- **Module Not Found Errors:** If you see "Cannot find module '@getpara/graz-integration'" when connecting with Para, install it with `npm install @getpara/graz-integration @getpara/react-sdk-lite`. The Para integration is optional - you only need these packages if you're using Para wallet.
- **Modal Styling Not Appearing:** Ensure `@getpara/react-sdk-lite/styles.css` is imported globally in your app.
- **Chain Mismatch:** Verify the chains configured in `GrazProvider` match your app's requirements and are enabled in your Para project settings.
- **Authentication Errors:** Check the browser console for Para-specific error messages. Verify your API key and environment settings at [developer.getpara.com](https://developer.getpara.com).

For advanced customization, refer to the Para Docs at [docs.getpara.com](https://docs.getpara.com/v2/react/).
