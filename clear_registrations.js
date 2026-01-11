import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bbwalfnkdjfoljzomqpl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJid2FsZm5rZGpmb2xqem9tcXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNzg2MTAsImV4cCI6MjA4MjY1NDYxMH0.zF9GJ0U6ayfCN2hjYKlrISCVDpx7B2EYq76Y_pBuFUY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearRegistrations() {
  console.log('Clearing registrations for tournament: community-weekly-cup-42...');
  try {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .delete()
      .eq('tournament_id', 'community-weekly-cup-42');

    if (error) {
      console.error('Error clearing registrations:', error.message);
    } else {
      console.log('Successfully cleared registrations.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

clearRegistrations();
