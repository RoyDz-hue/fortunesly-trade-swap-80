// src/components/dashboard/DepositDialog.tsx

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

  const handleStatusUpdate = (status: PaymentStatusResponse) => {
    if (!status.success) {
      setCurrentStatus("Error checking status")
      return
    }

    switch (status.status) {
      case "completed":
        toast.success("Deposit completed successfully!")
        setCurrentStatus("Payment completed!")
        setTimeout(() => {
          setIsLoading(false)
          onSuccess?.()
          handleClose()
        }, 2000)
        break
      case "failed":
        toast.error(status.error || "Payment failed")
        setCurrentStatus("Payment failed")
        setTimeout(() => {
          setIsLoading(false)
          onError?.(new Error(status.error || "Payment failed"))
          handleClose()
        }, 2000)
        break
      case "canceled":
        toast.error("Payment was canceled")
        setCurrentStatus("Payment canceled")
        setTimeout(() => {
          setIsLoading(false)
          onError?.(new Error("Payment was canceled"))
          handleClose()
        }, 2000)
        break
      case "pending":
        setCurrentStatus("Waiting for payment...")
        break
      case "queued":
        setCurrentStatus("Payment is being processed...")
        break
      default:
        setCurrentStatus(`Status: ${status.status}`)
    }
  }

  const handleDeposit = async () => {
    if (!user) {
      toast.error("Please sign in to make a deposit")
      return
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error("Please enter a valid phone number")
      return
    }

    try {
      setIsLoading(true)
      setCurrentStatus("Initiating payment...")

      const response = await initiatePayment(
        user,
        Number(amount),
        phoneNumber,
        "deposit"
      )

      if (!response.success || !response.reference) {
        throw new Error(response.error || "Failed to initiate payment")
      }

      setCurrentStatus("Payment initiated. Please check your phone...")

      pollTransactionStatus(
        response.reference,
        handleStatusUpdate
      ).catch(error => {
        console.error("Status polling error:", error)
        setCurrentStatus("Error checking payment status")
        setIsLoading(false)
        onError?.(error)
      })

    } catch (error: any) {
      console.error("Deposit error:", error)
      setIsLoading(false)
      setCurrentStatus("")
      toast.error(error.message || "Failed to process deposit")
      onError?.(error)
    }
  }

  const handleClose = () => {
    if (isLoading && currentStatus !== "Payment completed!") {
      if (window.confirm("Are you sure you want to close? The payment might still be processing.")) {
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
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
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