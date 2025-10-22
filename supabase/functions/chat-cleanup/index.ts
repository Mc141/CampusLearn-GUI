// Supabase Edge Function for Chat Cleanup
// Deploy this as a scheduled function to automatically clean up expired chats

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Call the cleanup function
    const { data, error } = await supabaseClient.rpc('cleanup_expired_chats')

    if (error) {
      console.error('Error cleaning up expired chats:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const deletedCount = data || 0
    console.log(`Cleaned up ${deletedCount} expired conversations`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount,
        message: `Cleaned up ${deletedCount} expired conversations`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* 
To deploy this function:

1. Create a new Supabase Edge Function:
   supabase functions new chat-cleanup

2. Replace the generated code with this file content

3. Deploy the function:
   supabase functions deploy chat-cleanup

4. Set up a cron job to call this function daily:
   - Go to Supabase Dashboard > Edge Functions
   - Add a cron trigger for daily execution
   - Or use external cron service to call the function URL

5. Test manually:
   curl -X POST https://your-project.supabase.co/functions/v1/chat-cleanup \
     -H "Authorization: Bearer YOUR_ANON_KEY"
*/
