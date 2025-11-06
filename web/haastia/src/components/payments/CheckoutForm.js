import React from 'react';
import { useCheckout } from '@stripe/react-stripe-js/checkout';

export const CheckoutForm = () => {
    const checkoutState = useCheckout();
    switch (checkoutState.type) {
        case "loading":
            return <div>Loading ...</div>;
        case "error":
            return <div>Error: {checkoutState.error.message}</div>;
        case "success":
            return (
                <pre>
                    {JSON.stringify(checkoutState.checkout.lineItems, null, 2)}
                    Total: {checkoutState.checkout.total.total.amount}
                </pre>
            );
        default:
            return null; // can add a placeholder like <div>Idle...</div>
    }

};