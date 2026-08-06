async function run() {
  const url = "https://zehewmwgherxhrleliwe.supabase.co/rest/v1/request_logs?select=*,projects!inner(user_id)&limit=1";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaGV3bXdnaGVyeGhybGVsaXdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjA0MzIzMCwiZXhwIjoyMTAxNjE5MjMwfQ.u5I9l2JRtZmq1GsetnmJn26YavTtJOHRt1ViQlfxJOU";
  const res = await fetch(url, {
    headers: {
      "apikey": key,
      "Authorization": "Bearer " + key
    }
  });
  const data = await res.json();
  console.log("RESPONSE:", JSON.stringify(data, null, 2));
}
run();
