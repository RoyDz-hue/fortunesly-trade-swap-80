// src/components/dashboard/WithdrawDialog.tsx

import { useState } from "react"
import { toast } from "react-hot-toast"
import { initiatePayment, pollTransactionStatus, PaymentStatusResponse } from "@/lib/payment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { useAuth } from "@/lib/hooks/use-auth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WithdrawDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  onError?: (error: Error) => void
  maxAmount?: number
}

export default function WithdrawDialog({ 
  isOpen, 
  onClose, 
  onSuccess,
  onError,
  maxAmount 
}: WithdrawDialogProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string>("")

  const handleStatusUpdate = (status: PaymentStatusResponse) => {
    if (!status.success) {
      setCurrentStatus("Error checking status")
      return
    }

    switch (status.status) {
      case "completed":
        toast.success("Withdrawal completed successfully!")
        setCurrentStatus("Withdrawal completed!")
        setTimeout(() => {
          setIsLoading(false)
          onSuccess?.()
          handleClose()
        }, 2000)
        break
      case "failed":
        toast.error(status.error || "Withdrawal failed")
        setCurrentStatus("Withdrawal failed")
        setTimeout(() => {
          setIsLoading(false)
          onError?.(new Error(status.error || "Withdrawal failed"))
          handleClose()
        }, 2000)
        break
      case "canceled":
        toast.error("Withdrawal was canceled")
        setCurrentStatus("Withdrawal canceled")
        setTimeout(() => {
          setIsLoading(false)
          onError?.(new Error("Withdrawal was canceled"))
          handleClose()
        }, 2000)
        break
      case "pending":
        setCurrentStatus("Processing withdrawal...")
        break
      case "queued":
        setCurrentStatus("Withdrawal is queued...")
        break
      default:
        setCurrentStatus(`Status: ${status.status}`)
    }
  }

  const handleWithdraw = async () => {
    if (!user) {
      toast.error("Please sign in to make a withdrawal")
      return
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (maxAmount && Number(amount) > maxAmount) {
      toast.error(`Maximum withdrawal amount is ${maxAmount} KES`)
      return
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error("Please enter a valid phone number")
      return
    }

    try {
      setIsLoading(true)
      setCurrentStatus("Initiating withdrawal...")

      const response = await initiatePayment(
        user,
        Number(amount),
        phoneNumber,
        "withdrawal"
      )

      if (!response.success || !response.reference) {
        throw new Error(response.error || "Failed to initiate withdrawal")
      }

      setCurrentStatus("Withdrawal initiated. Processing...")

      pollTransactionStatus(
        response.reference,
        handleStatusUpdate
      ).catch(error => {
        console.error("Status polling error:", error)
        setCurrentStatus("Error checking withdrawal status")
        setIsLoading(false)
        onError?.(error)
      })

    } catch (error: any) {
      console.error("Withdrawal error:", error)
      setIsLoading(false)
      setCurrentStatus("")
      toast.error(error.message || "Failed to process withdrawal")
      onError?.(error)
    }
  }

  const handleClose = () => {
    if (isLoading && currentStatus !== "Withdrawal completed!") {
      if (window.confirm("Are you sure you want to close? The withdrawal might still be processing.")) {
        resetForm()
      }
    } else {
      resetForm()
    }
  }

  const resetForm = () => {
    setAmount("")
    setPhoneNumber("")
    setCurrentStatus("")
    setIsLoading(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
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
              max={maxAmount}
            />
            {maxAmount && (
              <p className="text-sm text-muted-foreground">
                Maximum: {maxAmount.toLocaleString()} KES
              </p>
            )}
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
          onClick={handleWithdraw}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Withdraw'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export { WithdrawDialog }