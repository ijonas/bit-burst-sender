
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

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

  const connect = async () => {
    try {
      setConnecting(true);
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful connection
      setConnected(true);
      setAddress('bc1q7cyrfmck2ffu2ud3rn5l5a8yv6f0chkp9y89p7');
      setBalance(0.00385291); // Mock balance in BTC
      
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
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock successful transaction
      setTransactionHash('a25c2f9c204dde2d582e878c2056ffb93e4df10cfc545a5b7d371cad170ee772');
      
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
