// stripe.service.ts
import { Injectable } from '@angular/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';

@Injectable({
    providedIn: 'root'
})
export class StripeService {
    private priceId = new String();
    private packId = new String();
    private state = new String();
    stripePromise = loadStripe('pk_test_51Slx4QErP4tLezcC67V19JsuQm2DuOe9iBF9F2HHsgbh7dd9sW8bSCu3mao6nfA276JjIVaUy8caPbv0pM2evI9M00PtuBzcYf');

    async getStripe(): Promise<Stripe> {
        return await this.stripePromise as Stripe;
    }

    setPackId(packId: string) {
        this.packId = packId;
    }

    getPackId(): string {
        return this.packId.toString();
    }

    setPriceId(priceId: string) {
        this.priceId = priceId;
    }

    getPriceId(): string {
        return this.priceId.toString();
    }

    setState(state: string) {
        this.state = state;
    }

    getState(): string {
        return this.state.toString();
    }
}
