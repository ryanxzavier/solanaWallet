import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Greet } from "./Greet";
import {
  ChakraProvider,
  Box,
  Text,
  VStack,
  HStack,
  Grid,
  theme,
  Button,
  useToast,
  Heading,
  Code
} from "@chakra-ui/react";
import { ColorModeSwitcher } from "./ColorModeSwitcher";
import * as web3 from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";

import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  SolletWalletAdapter,
  SolletExtensionWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
require("@solana/wallet-adapter-react-ui/styles.css");

function useSolanaAccount() {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const init = useCallback(async () => {
    if (publicKey) {
      let acc = await connection.getAccountInfo(publicKey);
      setAccount(acc);
      let transactions = await connection.getConfirmedSignaturesForAddress2(
        publicKey,
        {
          limit: 10,
        }
      );
      setTransactions(transactions);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (publicKey) {
      setInterval(init, 1000);
    }
  }, [init, publicKey]);

  return { account, transactions };
}

function Home() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { account, transactions } = useSolanaAccount();
  const toast = useToast();
  const [airdropProcessing, setAirdropProcessing] = useState(false);

  const getAirdrop = useCallback(async () => {
    setAirdropProcessing(true);
    try {
      var airdropSignature = await connection.requestAirdrop(
        publicKey,
        web3.LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdropSignature);
    } catch (error) {
      console.log(error);
      toast({ title: "Airdrop failed", description: "unknown error" });
    }
    setAirdropProcessing(false);
  }, [toast, publicKey, connection]);

  return (
    <Box textAlign="center" fontSize="xl">
      <Grid minH="100vh" p={3}>
        <ColorModeSwitcher justifySelf="flex-end" />
        {publicKey && (
          <VStack spacing={8}>
            <Text>Wallet Public Key: {publicKey.toBase58()}</Text>
            <Text>
              Balance:{" "}
              {account
                ? account.lamports / web3.LAMPORTS_PER_SOL + " SOL"
                : "Loading.."}
            </Text>
            <Button onClick={getAirdrop} isLoading={airdropProcessing}>
              Get Airdrop of 1 SOL
            </Button>
            <Greet />
            <Heading>Transactions</Heading>
            {transactions && (
              <VStack>
                {transactions.map((v, i, arr) => (
                  <HStack key={"transaction-" + i}>
                    <Text>Signature: </Text>
                    <Code>{v.signature}</Code>
                  </HStack>
                ))}
              </VStack>
            )}
          </VStack>
        )}
        {!publicKey && <WalletMultiButton />}
      </Grid>
    </Box>
  );
}

function App() {

  //network in use 
  const network = "devnet";
  //Select the network (which is devnet) and connect to it 
  const endpoint = web3.clusterApiUrl(network);
  //array of wallets we want to use (and of course connected to devnet)
  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
      new PhantomWalletAdapter(),
      new SolletWalletAdapter({ network }),
      new SolletExtensionWalletAdapter({ network }),
    ], [network]
  );


  return (
    <ChakraProvider theme={theme}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Home></Home>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ChakraProvider>
  );
}

export default App;
