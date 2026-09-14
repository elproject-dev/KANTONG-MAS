const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fprtzdlaeobkuzqhdqaf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcnR6ZGxhZW9ia3V6cWhkcWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc2NDMzOSwiZXhwIjoyMDk5MzQwMzM5fQ.3pJSljfuI5G-g4jdkuhZz9XAhySEl_creQAMLZgnOuY');

async function run() {
  const ownerIdStr = '6d16c214-4dbd-43f7-b72c-7da232189e9c'; // Try Didit's tenant

  // Query 1: usePendingReceivablesCount
  let q1 = supabase
    .from('transactions')
    .select('id, payment_status, due_date')
    .not('due_date', 'is', null)
    .neq('payment_status', 'paid')
    .eq('owner_id', ownerIdStr);
    
  const { data: d1 } = await q1;
  console.log('usePendingReceivablesCount finds:', d1.map(x => x.id).sort());

  // Query 2: useListReceivables
  let q2 = supabase
    .from('transactions')
    .select(`*, customer:customers(id, name, phone), transaction_items(*)`)
    .not('due_date', 'is', null)
    .eq('owner_id', ownerIdStr);
    
  const { data: d2 } = await q2;
  const filtered = (d2 || []).filter(r => r.payment_status !== 'paid');
  console.log('useListReceivables (outstanding) finds:', filtered.map(x => x.id).sort());
}
run();
