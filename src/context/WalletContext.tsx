
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';

interface WalletContextType {
  connected: boolean;
  address: string | null;
  balance: number;
  connecting: boolean;
  sendingTransaction: boolean;
  transactionHash: string | null;
  balanceFormat: 'btc' | 'sats';
  toggleBalanceFormat: () => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendBitcoin: (amount: number, recipient: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [sendingTransaction, setSendingTransaction] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [balanceFormat, setBalanceFormat] = useState<'btc' | 'sats'>('btc');

  const toggleBalanceFormat = () => {
    setBalanceFormat(balanceFormat === 'btc' ? 'sats' : 'btc');
  };

  const getProvider = () => {
    if ('phantom' in window) {
      const anyWindow: any = window;
      const provider = anyWindow.phantom.bitcoin;

      if (provider && provider.isPhantom) {
        return provider;
      }
    }

    window.open('https://phantom.app/', '_blank');
  };

  type BtcAccount = {
    address: string;
    addressType: "p2tr" | "p2wpkh" | "p2sh" | "p2pkh";
    publicKey: string;
    purpose: "payment" | "ordinals";
    balance: number;
  };

  interface Provider {
    requestAccounts(): [BtcAccount];
  }

  const getAccounts = (provider: Provider): [BtcAccount] => provider.requestAccounts();

  const getPaymentAccount = (accounts: [BtcAccount]): BtcAccount | undefined => accounts.find(acc => acc.addressType === 'p2wpkh')

  const getBitcoinBalance = async (address: string) => {
    const data = await getAddrInfo(address, '');
    // Confirmed + unconfirmed balance (in sats)
    const confirmed = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
    const unconfirmed = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;
    return (confirmed + unconfirmed) / 1e8; // convert sats to BTC
  };

  type UTXOStatus = {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  }
  type UTXO = {
    txid: string;
    vout: number;
    status: UTXOStatus;
    value: number;
  }
  type TxnInput = {
    txid: string;
    vout: number;
    prevout: any;
    scriptsig: string;
    scriptsig_asm: string;
    witness: [string];
    is_coinbase: boolean;
    sequence: number;
  }
  type TxnOutput = {
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address: string;
    value: number;
  }
  type BTCTxn = {
    txid: string;
    version: number;
    locktime: number;
    size: number;
    weight: number;
    fee: number;
    status: UTXOStatus;
    vin: TxnInput[];
    vout: TxnOutput[];
  }
  type Fees = {
    [key: number]: number;
  }
  const getAddrInfo = async (address: string, component: string): Promise<any> => {
    const url = `https://blockstream.info/api/address/${address}${component}`;
    console.log({ url })
    const res = await fetch(url);
    return res.json();
  }
  const getFees = async (): Promise<Fees> => (await fetch('https://blockstream.info/api/fee-estimates')).json()
  const broadcast = async (txHex: string): Promise<string> => {
    const res = await fetch('https://blockstream.info/api/tx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: txHex,
    })
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Broadcast failed: ${res.status} ${res.statusText} - ${errText}`);
    } else {
      return res.text()
    }
  }
  const getUTXOs = async (address: string): Promise<[UTXO]> => {
    return getAddrInfo(address, '/utxo');
  }
  const getTransactions = async (address: string): Promise<[BTCTxn]> => {
    return getAddrInfo(address, '/txs');
  };
  const findWitness = (utxo: UTXO, txn: BTCTxn): Buffer => {
    // feels dodgy match utxo to vout purely on size of value being transferred.
    const output = txn.vout.find(v => v.value === utxo.value);
    return Buffer.from(output.scriptpubkey, 'hex');
  };
  const createPSBT = (paymentAccount: BtcAccount, utxos: UTXO[], prevTxns: BTCTxn[], satsToSend: number, recipient: string) => {
    const satsReservedForFee = 1000;
    const utxo = utxos.find(utxo => utxo.value > satsToSend + satsReservedForFee);
    console.log({ selectedUTXO: utxo })
    const network = bitcoin.networks.bitcoin;

    // find the txn of the selected UTXO
    const txn = prevTxns.find(txn => txn.txid === utxo.txid)
    console.log({ selectedTxn: txn });

    const psbt = new bitcoin.Psbt({ network });
    // Add input
    // "This input is spending a UTXO that was locked to the script OP_0 <pubkeyhash> (i.e., a SegWit address controlled by this public key)."
    // The keypair represents the pair of public and private keys. Later when calling psbt.signInput(0, keypair) we're passing in the private key.
    const input = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: findWitness(utxo, txn),
        value: utxo.value,
      },
    };
    const output: bitcoin.PsbtTxOutput = {
      address: recipient,
      value: satsToSend
    }
    const changeValue = utxo.value - satsToSend - satsReservedForFee;
    const change = {
      address: paymentAccount.address,
      value: changeValue,
    };
    if (changeValue > 0) {
      psbt.addOutput(change);
    }

    console.log({ input, output, change })
    psbt.addInput(input);
    psbt.addOutput(output);

    return psbt;


  }

  const ECPair = ECPairFactory(ecc);
  const validator = (
    pubkey: Uint8Array,
    msghash: Uint8Array,
    signature: Uint8Array,
  ): boolean => ECPair.fromPublicKey(pubkey).verify(msghash, signature);

  const connect = async () => {
    try {
      setConnecting(true);

      const provider = getProvider();
      const accounts = await getAccounts(provider);

      console.log(accounts);

      const paymentAccount = accounts.find(acc => acc.purpose === "ordinals")
      let totalBalance = 0;
      for (const account of accounts) {
        account.balance = await getBitcoinBalance(account.address)
        totalBalance += account.balance
      }

      setConnected(true);
      setAddress(paymentAccount.address);
      setBalance(totalBalance);

      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Phantom wallet",
      });
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Phantom wallet",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setAddress(null);
    setBalance(0);
    setTransactionHash(null);

    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const sendBitcoin = async (amount: number, recipient: string) => {
    try {
      setSendingTransaction(true);
      setTransactionHash(null);

      // Validate amount and recipient
      if (!amount || amount <= 0) {
        throw new Error('Invalid amount');
      }

      if (!recipient || !recipient.trim()) {
        throw new Error('Invalid recipient address');
      }

      const phantomProvider = getProvider();
      const accounts = await getAccounts(phantomProvider);
      const allUTXOs = await Promise.all(accounts.map(acc => getUTXOs(acc.address)));
      console.log({ allUTXOs: allUTXOs.flat() })

      console.log({ satsToSend: amount * 10 ** 8 })
      const paymentAccount = getPaymentAccount(accounts);
      if (!paymentAccount) {
        throw new Error("Unable to find Phantom's Native Segwit wallet.")
      }
      const prevTxns = await getTransactions(paymentAccount.address);
      const psbt = createPSBT(paymentAccount, allUTXOs.flat(), prevTxns, amount * 10 ** 8, recipient);

      const signedPSBTBytes = await phantomProvider.signPSBT(
        psbt.toBuffer(),
        {
          inputsToSign: [
            {
              address: paymentAccount.address,
              signingIndexes: [0],
              sigHash: 0,
            },
          ],
        },
      );

      console.log({ signedPSBTBytes });
      
      // Create a new PSBT from the signed bytes returned by Phantom
      const signedPsbt = bitcoin.Psbt.fromBuffer(Buffer.from(signedPSBTBytes), { network: bitcoin.networks.bitcoin });
      
      // Validate and finalize the signed PSBT
      signedPsbt.validateSignaturesOfInput(0, validator);
      signedPsbt.finalizeAllInputs();
      const finalisedPSBTHex = signedPsbt.extractTransaction().toHex(); // broadcast this mofo at your own risk :-)
      const txHash = await broadcast(finalisedPSBTHex);


      // Mock successful transaction
      setTransactionHash(txHash);

      // Update balance
      setBalance(prev => Math.max(0, prev - amount));

      toast({
        title: "Transaction Sent",
        description: `Successfully sent ${amount} BTC to ${recipient.substring(0, 8)}...`,
      });
    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Could not complete the transaction",
        variant: "destructive",
      });
    } finally {
      setSendingTransaction(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        connected,
        address,
        balance,
        connecting,
        sendingTransaction,
        transactionHash,
        balanceFormat,
        toggleBalanceFormat,
        connect,
        disconnect,
        sendBitcoin,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
