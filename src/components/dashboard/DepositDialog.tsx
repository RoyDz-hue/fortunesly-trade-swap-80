// src/components/dashboard/WithdrawDialog.tsx

import { useState } from "react"
import { toast } from "sonner"
import { initiatePayment, pollTransactionStatus, PaymentStatusResponse } from "@/services/payHeroService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DepositDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export default function DepositDialog({ 
  isOpen, 
  onClose, 
  onSuccess,
  onError 
}: DepositDialogProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string>("")

  // Rest of your existing code stays the same until the return statement

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Deposit Funds</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter M-Pesa number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {currentStatus && (
            <div className="text-sm text-muted-foreground">
              {currentStatus}
            </div>
          )}
        </div>

        <Button
          className="w-full"
          onClick={handleDeposit}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Deposit'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export { DepositDialog }