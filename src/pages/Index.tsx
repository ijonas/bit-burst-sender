
import React from 'react';
import { WalletProvider } from '@/context/WalletContext';
import WalletCard from '@/components/WalletCard';
import TransferForm from '@/components/TransferForm';
import { Bitcoin } from 'lucide-react';

const Index = () => {
  return (
    <WalletProvider>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border/40 py-4">
          <div className="container max-w-3xl">
            <div className="flex items-center gap-2">
              <Bitcoin className="h-6 w-6 text-bitcoin-orange" />
              <h1 className="text-xl font-bold">BitBurst Sender</h1>
            </div>
          </div>
        </header>
        
        <main className="flex-1">
          <div className="container max-w-3xl py-8 px-4 sm:px-6 space-y-6">
            <WalletCard />
            <TransferForm />
          </div>
        </main>
        
        <footer className="border-t border-border/40 py-4">
          <div className="container max-w-3xl">
            <div className="text-center text-sm text-muted-foreground">
              <p>This is a demo Bitcoin wallet interface. However, the connections to Phantom and the block explorer are real and it will send real BTC. Your funds are at risk!</p>
            </div>
          </div>
        </footer>
      </div>
    </WalletProvider>
  );
};

export default Index;
