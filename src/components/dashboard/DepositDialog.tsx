// src/components/dashboard/DepositDialog.tsx

import { Fragment, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { useUser } from "@supabase/auth-helpers-react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { toast } from "react-hot-toast"
import { initiatePayment, pollTransactionStatus, PaymentStatusResponse } from "@/lib/payment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"

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
  const user = useUser()
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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-background p-6 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md text-muted-foreground hover:text-foreground focus:outline-none"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6">
                      Deposit Funds
                    </Dialog.Title>
                    
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
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

                      <div className="space-y-2">
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
                  </div>
                </div>

                <div className="mt-5 sm:mt-6">
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
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export { DepositDialog }