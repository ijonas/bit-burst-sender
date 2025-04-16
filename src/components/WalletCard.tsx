
import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Bitcoin, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

const WalletCard: React.FC = () => {
  const { 
    connected, 
    address, 
    balance, 
    connecting, 
    balanceFormat, 
    toggleBalanceFormat, 
    connect, 
    disconnect 
  } = useWallet();

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const formatBalance = () => {
    if (balanceFormat === 'btc') {
      return balance.toFixed(8);
    } else {
      // Convert BTC to sats (1 BTC = 100,000,000 sats)
      return Math.floor(balance * 100000000).toLocaleString();
    }
  };

  const getFormatLabel = () => {
    if (balanceFormat === 'btc') {
      return 'BTC';
    } else {
      return 'sats';
    }
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="bitcoin-gradient p-6">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bitcoin className="h-6 w-6" />
            <span>Bitcoin Wallet</span>
          </div>
          {connected && (
            <Button
              variant="outline"
              size="sm"
              onClick={disconnect}
              className="text-sm text-white hover:text-primary bg-white/10 hover:bg-white/20 border-white/20"
            >
              Disconnect
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {connected ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Wallet Address</div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-mono">
                  {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : ''}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={copyAddress}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="pt-2 pb-4">
              <div className="text-sm text-muted-foreground mb-1">Balance</div>
              <div 
                className="text-3xl font-bold flex items-center gap-2 cursor-pointer" 
                onClick={toggleBalanceFormat}
              >
                {formatBalance()}
                <span className="text-sm font-normal text-muted-foreground">
                  {getFormatLabel()}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Click to toggle between BTC and sats
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-muted-foreground mb-4">Connect your wallet to get started</p>
            <Button
              disabled={connecting}
              onClick={connect}
              className="w-full"
            >
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Bitcoin className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletCard;
