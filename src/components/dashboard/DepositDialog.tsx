import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useUser } from '@supabase/auth-helpers-react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { initiatePayment, pollTransactionStatus, PaymentStatusResponse } from '@/services/payHeroService';
import { LoaderCircle } from './LoaderCircle';

interface DepositDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const DepositDialog = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  onError 
}: DepositDialogProps) => {
  const user = useUser();
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [reference, setReference] = useState<string>('');

  const handleStatusUpdate = (status: PaymentStatusResponse) => {
    if (!status.success) {
      setCurrentStatus('Error checking status');
      return;
    }

    switch (status.status) {
      case 'completed':
        setCurrentStatus('Payment completed successfully!');
        setTimeout(() => {
          setIsLoading(false);
          onSuccess?.();
          handleClose();
        }, 2000);
        break;
      case 'failed':
        setCurrentStatus('Payment failed');
        setTimeout(() => {
          setIsLoading(false);
          onError?.(new Error(status.error || 'Payment failed'));
          handleClose();
        }, 2000);
        break;
      case 'canceled':
        setCurrentStatus('Payment was canceled');
        setTimeout(() => {
          setIsLoading(false);
          onError?.(new Error('Payment was canceled'));
          handleClose();
        }, 2000);
        break;
      case 'pending':
        setCurrentStatus('Waiting for payment...');
        break;
      case 'queued':
        setCurrentStatus('Payment is being processed...');
        break;
      default:
        setCurrentStatus(`Status: ${status.status}`);
    }
  };

  const handleDeposit = async () => {
    if (!user) {
      toast.error('Please sign in to make a deposit');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error('Please enter a valid phone number');
      return;
    }

    try {
      setIsLoading(true);
      setCurrentStatus('Initiating payment...');

      const response = await initiatePayment(
        user,
        Number(amount),
        phoneNumber,
        'deposit'
      );

      if (!response.success || !response.reference) {
        throw new Error(response.error || 'Failed to initiate payment');
      }

      setReference(response.reference);
      setCurrentStatus('Payment initiated. Please check your phone...');

      // Start polling for status updates
      pollTransactionStatus(
        response.reference,
        handleStatusUpdate
      ).catch(error => {
        console.error('Status polling error:', error);
        setCurrentStatus('Error checking payment status');
        setIsLoading(false);
        onError?.(error);
      });

    } catch (error: any) {
      console.error('Deposit error:', error);
      setIsLoading(false);
      setCurrentStatus('');
      toast.error(error.message || 'Failed to process deposit');
      onError?.(error);
    }
  };

  const handleClose = () => {
    setAmount('');
    setPhoneNumber('');
    setCurrentStatus('');
    setReference('');
    setIsLoading(false);
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Deposit Funds
                    </Dialog.Title>
                    
                    <div className="mt-4">
                      <div className="mb-4">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                          Amount (KES)
                        </label>
                        <input
                          type="number"
                          id="amount"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Enter amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="mb-4">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Enter M-Pesa number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>

                      {currentStatus && (
                        <div className="mt-2 text-sm text-gray-500">
                          {currentStatus}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={handleDeposit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <LoaderCircle className="mr-2 h-4 w-4" />
                        Processing...
                      </div>
                    ) : (
                      'Deposit'
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default DepositDialog;

  
  