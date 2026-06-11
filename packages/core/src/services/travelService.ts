import { supabase } from '../supabaseClient';
import type { TravelLocation, TravelTrip } from '../models';

export class TravelService {
  async fetchLocations(): Promise<TravelLocation[]> {
    const { data, error } = await supabase
      .from('travel_locations')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching travel locations:', error);
      throw error;
    }

    return data || [];
  }

  async fetchTrips(coupleId: string): Promise<TravelTrip[]> {
    const { data, error } = await supabase
      .from('travel_trips')
      .select(`
        *,
        location:travel_locations(*)
      `)
      .eq('couple_id', coupleId)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching travel trips:', error);
      throw error;
    }

    return data || [];
  }

  async createTrip(tripData: Omit<TravelTrip, 'id' | 'created_at' | 'updated_at' | 'location'>): Promise<TravelTrip | null> {
    const { data, error } = await supabase
      .from('travel_trips')
      .insert([tripData])
      .select(`
        *,
        location:travel_locations(*)
      `)
      .single();

    if (error) {
      console.error('Error creating travel trip:', error);
      throw error;
    }

    return data;
  }

  async updateTrip(tripId: string, updates: Partial<TravelTrip>): Promise<TravelTrip | null> {
    const { data, error } = await supabase
      .from('travel_trips')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', tripId)
      .select(`
        *,
        location:travel_locations(*)
      `)
      .single();

    if (error) {
      console.error('Error updating travel trip:', error);
      throw error;
    }

    return data;
  }

  async deleteTrip(tripId: string): Promise<boolean> {
    const { error } = await supabase
      .from('travel_trips')
      .delete()
      .eq('id', tripId);

    if (error) {
      console.error('Error deleting travel trip:', error);
      return false;
    }
    return true;
  }
}
