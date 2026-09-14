const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fprtzdlaeobkuzqhdqaf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcnR6ZGxhZW9ia3V6cWhkcWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc2NDMzOSwiZXhwIjoyMDk5MzQwMzM5fQ.3pJSljfuI5G-g4jdkuhZz9XAhySEl_creQAMLZgnOuY');

async function run() {
  const ownerIdStr = '6d16c214-4dbd-43f7-b72c-7da232189e9c'; 

  let q1 = supabase
    .from('transactions')
    .select('id, payment_status, due_date, status')
    .not('due_date', 'is', null)
    .neq('payment_status', 'paid')
    .eq('owner_id', ownerIdStr);
    
  const { data: d1 } = await q1;
  console.log('Items status:', d1.map(x => `${x.id}:${x.status}`));
}
run();
