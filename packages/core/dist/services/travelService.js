import { supabase } from '../supabaseClient';
export class TravelService {
    async fetchLocations() {
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
    async fetchTrips(coupleId) {
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
    async createTrip(tripData) {
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
    async updateTrip(tripId, updates) {
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
    async deleteTrip(tripId) {
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
