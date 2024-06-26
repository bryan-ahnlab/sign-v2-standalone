import React from "react";
import "./App.css";

import { useState, useEffect } from "react";
import { SignClient } from "@walletconnect/sign-client";

import { Web3Modal } from "@web3modal/standalone";
import { SessionTypes } from "@walletconnect/types";
import { ErrorResponse } from "@walletconnect/jsonrpc-types";

const WALLET_ID =
  "b956da9052132e3dabdcd78feb596d5194c99b7345d8c4bd7a47cabdcb69a25f";
const web3Modal = new Web3Modal({
  projectId: process.env.REACT_APP_PROJECT_ID || "",
  standaloneChains: ["eip155:1001"],
  walletConnectVersion: 2,
  explorerRecommendedWalletIds: [WALLET_ID],
  explorerExcludedWalletIds: "ALL",
});

function App() {
  const [signClient, setSignClient] = useState<InstanceType<
    typeof SignClient
  > | null>(null);
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    if (!signClient) {
      createClient();
    }
  }, [signClient]);

  async function createClient() {
    try {
      const signClient = await SignClient.init({
        projectId: process.env.REACT_APP_PROJECT_ID,
      });
      setSignClient(signClient);
    } catch (e) {
      console.log(e);
    }
  }

  const reset = () => {
    setSignClient(null);
    setSession(null);
    setAccount(null);
  };

  async function onSessionConnected(sessionNamespace: SessionTypes.Struct) {
    try {
      setSession(sessionNamespace);
      setAccount(
        sessionNamespace.namespaces.eip155.accounts[0]
          .split(":")
          .slice(2)
          .join(":")
      );
    } catch (e) {
      console.log(e);
    }
  }

  async function handleConnect() {
    if (!signClient) throw Error("SignClient does not exist");
    try {
      const proposalNamespace = {
        eip155: {
          methods: [
            "personal_sign",
            "eth_signTransaction",
            "eth_signTypedData",
            "eth_sendTransaction",
          ],
          chains: ["eip155:1001"],
          events: ["chainChanged", "accountsChanged"],
        },
      };
      const { uri, approval } = await signClient.connect({
        requiredNamespaces: proposalNamespace,
      });
      if (uri) {
        web3Modal.openModal({ uri });
        const sessionNamespace = await approval();
        onSessionConnected(sessionNamespace);
        web3Modal.closeModal();
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function handleDisconnect() {
    if (!signClient) throw Error("SignClient does not exist");
    try {
      if (session) {
        await signClient.disconnect({
          topic: session.topic,
          reason: { code: 600, message: "Disconnected" } as ErrorResponse,
        });
        reset();
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function handlePersonalSign() {
    if (!signClient) throw Error("SignClient does not exist");
    try {
      if (session && account) {
        const tx = {
          message: "Hello World!",
          address: account,
        };
        const response = await signClient.request({
          topic: session.topic,
          chainId: "eip155:1001",
          request: {
            method: "personal_sign",
            params: [tx.message, tx.address],
          },
        });
        console.log(`response: ${response}`);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function handleEthSignTransaction() {
    if (!signClient) throw Error("SignClient does not exist");
    try {
      if (session && account) {
        const tx = {
          from: account,
          to: process.env.REACT_APP_TEST_ACCOUNT || "",
          data: "0x",
          value: "0x00",
        };
        const response = await signClient.request({
          topic: session.topic,
          chainId: "eip155:1001",
          request: {
            method: "eth_signTransaction",
            params: [tx],
          },
        });
        console.log(`response: ${response}`);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function handleEthSignTypedData() {
    if (!signClient) throw Error("SignClient does not exist");
    try {
      if (session && account) {
        const tx = {
          address: account,
          message: {
            types: {
              EIP712Domain: [
                {
                  name: "name",
                  type: "string",
                },
                {
                  name: "version",
                  type: "string",
                },
                {
                  name: "chainId",
                  type: "uint256",
                },
                {
                  name: "verifyingContract",
                  type: "address",
                },
              ],
              Person: [
                {
                  name: "name",
                  type: "string",
                },
                {
                  name: "wallet",
                  type: "address",
                },
              ],
              Mail: [
                {
                  name: "from",
                  type: "Person",
                },
                {
                  name: "to",
                  type: "Person",
                },
                {
                  name: "contents",
                  type: "string",
                },
              ],
            },
            primaryType: "Mail",
            domain: {
              name: "Ether Mail",
              version: "1",
              chainId: "1001",
              verifyingContract: "0xa",
            },
            message: {
              from: {
                name: "Cow",
                wallet: process.env.REACT_APP_TEST_ACCOUNT || "",
              },
              to: {
                name: "Bob",
                wallet: process.env.REACT_APP_TEST_ACCOUNT || "",
              },
              contents: "Hello, Bob!",
            },
          },
        };
        const response = await signClient.request({
          topic: session.topic,
          chainId: "eip155:1001",
          request: {
            method: "eth_signTypedData",
            params: [tx.address, tx.message],
          },
        });
        console.log(`response: ${response}`);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function handleEthSendTransaction() {
    if (!signClient) throw Error("SignClient does not exist");
    try {
      if (session && account) {
        const tx = {
          from: account,
          to: process.env.REACT_APP_TEST_ACCOUNT || "",
          data: "0x",
          gasLimit: "0x5208",
          value: "0x00",
        };
        const response = await signClient.request({
          topic: session.topic,
          chainId: "eip155:1001",
          request: {
            method: "eth_sendTransaction",
            params: [tx],
          },
        });
        console.log(`response: ${response}`);
      }
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className="App" style={{ textAlign: "center", padding: "0 2rem" }}>
      <h1>Wallet Connect v2.0 Sign SDK Sample</h1>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <button
          style={{
            width: "100%",
            minHeight: "3rem",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            borderRadius: "0.5rem",
            padding: "0.5rem",
            wordBreak: "break-all",
          }}
          onClick={handleConnect}
          disabled={!signClient}
        >
          Connect
        </button>
        <button
          style={{
            width: "100%",
            minHeight: "3rem",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            borderRadius: "0.5rem",
            padding: "0.5rem",
            wordBreak: "break-all",
          }}
          onClick={handleDisconnect}
          disabled={!signClient}
        >
          Disconnect
        </button>
        <button
          style={{
            width: "100%",
            minHeight: "3rem",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            borderRadius: "0.5rem",
            padding: "0.5rem",
            wordBreak: "break-all",
          }}
          onClick={handlePersonalSign}
          disabled={!signClient}
        >
          Personal Sign
        </button>
        <button
          style={{
            width: "100%",
            minHeight: "3rem",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            borderRadius: "0.5rem",
            padding: "0.5rem",
            wordBreak: "break-all",
          }}
          onClick={handleEthSignTransaction}
          disabled={!signClient}
        >
          Sign Transaction
        </button>
        <button
          style={{
            width: "100%",
            minHeight: "3rem",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            borderRadius: "0.5rem",
            padding: "0.5rem",
            wordBreak: "break-all",
          }}
          onClick={handleEthSignTypedData}
          disabled={!signClient}
        >
          Sign Typed Data
        </button>
        <button
          style={{
            width: "100%",
            minHeight: "3rem",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            borderRadius: "0.5rem",
            padding: "0.5rem",
            wordBreak: "break-all",
          }}
          onClick={handleEthSendTransaction}
          disabled={!signClient}
        >
          Send Transaction
        </button>
        {account ? (
          <span style={{ wordBreak: "break-all" }}>account: {account}</span>
        ) : null}
      </div>
    </div>
  );
}

export default App;
