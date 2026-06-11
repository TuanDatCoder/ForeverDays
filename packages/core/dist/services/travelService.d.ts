import type { TravelLocation, TravelTrip } from '../models';
export declare class TravelService {
    fetchLocations(): Promise<TravelLocation[]>;
    fetchTrips(coupleId: string): Promise<TravelTrip[]>;
    createTrip(tripData: Omit<TravelTrip, 'id' | 'created_at' | 'updated_at' | 'location'>): Promise<TravelTrip | null>;
    updateTrip(tripId: string, updates: Partial<TravelTrip>): Promise<TravelTrip | null>;
    deleteTrip(tripId: string): Promise<boolean>;
}
