const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fprtzdlaeobkuzqhdqaf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcnR6ZGxhZW9ia3V6cWhkcWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NjQzMzksImV4cCI6MjA5OTM0MDMzOX0.dniOa1dBajexguQvjy-xkO5qQha1GNVKmVkel2kmxxg');

async function run() {
  const ownerIdStr = '6d16c214-4dbd-43f7-b72c-7da232189e9c'; 

  let q1 = supabase
    .from('transactions')
    .select('id')
    .not('due_date', 'is', null)
    .neq('payment_status', 'paid')
    .eq('owner_id', ownerIdStr);
    
  const { data: d1, error } = await q1;
  console.log('Anon key error:', error);
  console.log('Anon key count:', d1?.length);
}
run();
