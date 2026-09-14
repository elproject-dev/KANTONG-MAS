const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fprtzdlaeobkuzqhdqaf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcnR6ZGxhZW9ia3V6cWhkcWFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc2NDMzOSwiZXhwIjoyMDk5MzQwMzM5fQ.3pJSljfuI5G-g4jdkuhZz9XAhySEl_creQAMLZgnOuY');

async function run() {
  const ownerIdStr = '6d16c214-4dbd-43f7-b72c-7da232189e9c'; 

  let q2 = supabase
    .from('transactions')
    .select(`*, customer:customers(id, name, phone), transaction_items(*)`)
    .not('due_date', 'is', null)
    .eq('owner_id', ownerIdStr);
    
  const { data: receivables } = await q2;
  console.log("Total fetched:", receivables.length);

  const activeTab = 'outstanding';
  const salesFilter = 'all';
  const statusFilter = 'all';
  const startDate = '';
  const endDate = '';
  const search = '';

  const filteredReceivables = receivables?.filter((r) => {
    if (activeTab === 'outstanding' && r.payment_status === 'paid') return false;
    if (activeTab === 'history' && r.payment_status !== 'paid') return false;
    if (salesFilter !== 'all' && r.cashier_name !== salesFilter) return false;
    if (statusFilter !== 'all' && r.payment_status !== statusFilter) return false;
    return true;
  });

  console.log("Filtered:", filteredReceivables.length);
}
run();
