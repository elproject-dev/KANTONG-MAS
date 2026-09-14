const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fprtzdlaeobkuzqhdqaf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcnR6ZGxhZW9ia3V6cWhkcWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NjQzMzksImV4cCI6MjA5OTM0MDMzOX0.dniOa1dBajexguQvjy-xkO5qQha1GNVKmVkel2kmxxg');

async function run() {
  const ownerIdStr = '6d16c214-4dbd-43f7-b72c-7da232189e9c'; 
  
  let query = supabase
    .from('transactions')
    .select(`
      *,
      customer:customers(id, name, phone),
      transaction_items(*)
    `)
    .not('due_date', 'is', null)
    .eq('owner_id', ownerIdStr);
    
  const { data, error } = await query;
  console.log('Error:', error);
  console.log('Data length:', data?.length);
}
run();
