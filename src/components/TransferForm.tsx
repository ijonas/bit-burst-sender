
import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const TransferForm: React.FC = () => {
  const { connected, balance, sendingTransaction, transactionHash, sendBitcoin } = useWallet();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('bc1q2nd77c0myssfed75v6he8tg905ftmv8wdef3ad');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimals up to 8 places
    if (/^(\d*\.?\d{0,8})$/.test(value) || value === '') {
      setAmount(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountValue = parseFloat(amount);

    // Validation
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (amountValue > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough BTC for this transaction",
        variant: "destructive",
      });
      return;
    }

    if (!recipient.trim()) {
      toast({
        title: "Invalid Recipient",
        description: "Please enter a valid recipient address",
        variant: "destructive",
      });
      return;
    }

    await sendBitcoin(amountValue, recipient);
  };

  if (!connected) {
    return (
      <Card className="w-full opacity-70">
        <CardHeader>
          <CardTitle>Transfer Bitcoin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            Connect your wallet to send Bitcoin
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactionHash) {
    return (
      <Card className="w-full border-green-500/30 bg-green-500/5">
        <CardHeader>
          <CardTitle className="text-green-600">Transaction Complete</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="mb-4 text-center">
              <p className="text-muted-foreground mb-2">
                Your transaction has been successfully sent to the Bitcoin network.
              </p>
              <p className="text-sm font-medium">Transaction ID:</p>
              <p className="text-xs font-mono text-muted-foreground mb-4 break-all">
                {transactionHash}
              </p>
            </div>
            <a
              href={`https://mempool.space/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-primary hover:underline"
            >
              View on Mempool <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setAmount('');
              setRecipient('');
            }}
          >
            Send Another Transaction
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Transfer Bitcoin</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Transfer (BTC)</Label>
            <Input
              id="amount"
              type="text"
              placeholder="0.00000000"
              value={amount}
              onChange={handleAmountChange}
              disabled={sendingTransaction}
            />
            <div className="text-xs text-muted-foreground">
              {amount && !isNaN(parseFloat(amount))
                ? `≈ ${Math.floor(parseFloat(amount) * 100000000).toLocaleString()} sats`
                : '0 sats'
              }
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="Enter Bitcoin address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={sendingTransaction}
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={sendingTransaction}
          >
            {sendingTransaction ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Send BTC <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default TransferForm;
