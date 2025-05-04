
-- Function to safely update a user's fiat balance
CREATE OR REPLACE FUNCTION public.updateUserFiatBalance(
    user_id UUID,
    amount_change NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance NUMERIC;
    new_balance NUMERIC;
    result JSONB;
BEGIN
    -- Get current balance with row lock to prevent race conditions
    SELECT balance_fiat INTO current_balance
    FROM users
    WHERE id = user_id
    FOR UPDATE;

    -- Handle case where user doesn't exist
    IF current_balance IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found',
            'user_id', user_id
        );
    END IF;

    -- Calculate new balance
    new_balance := current_balance + amount_change;

    -- Prevent negative balance for withdrawals
    IF amount_change < 0 AND new_balance < 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient balance',
            'current_balance', current_balance,
            'requested_change', amount_change
        );
    END IF;

    -- Update the balance
    UPDATE users
    SET balance_fiat = new_balance
    WHERE id = user_id;

    -- Return success with balances
    RETURN jsonb_build_object(
        'success', true,
        'previous_balance', current_balance,
        'new_balance', new_balance,
        'change', amount_change
    );
END;
$$;

-- Update function to process payment status and handle balance updates
CREATE OR REPLACE FUNCTION public.update_payment_status(
    p_reference VARCHAR,
    p_status VARCHAR,
    p_provider_reference VARCHAR DEFAULT NULL,
    p_checkout_request_id VARCHAR DEFAULT NULL,
    p_callback_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction RECORD;
    v_result JSONB;
    v_old_status VARCHAR;
BEGIN
    -- Get transaction info and lock
    SELECT * INTO v_transaction 
    FROM payment_requests 
    WHERE reference = p_reference
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE LOG 'Transaction not found for reference: %', p_reference;
        RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
    END IF;

    -- Store old status for comparison
    v_old_status := v_transaction.status;

    -- Update payment request
    UPDATE payment_requests
    SET 
        status = p_status,
        provider_reference = COALESCE(p_provider_reference, provider_reference),
        checkout_request_id = COALESCE(p_checkout_request_id, checkout_request_id),
        callback_data = COALESCE(p_callback_data, callback_data),
        updated_at = NOW()
    WHERE reference = p_reference;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Payment status updated successfully',
        'old_status', v_old_status,
        'new_status', p_status
    );
END;
$$;
