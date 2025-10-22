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
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables')
      return new Response(
        JSON.stringify({ 
          error: 'Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Starting chat cleanup process...')

    // Call the cleanup function
    const { data, error } = await supabaseClient.rpc('cleanup_expired_chats')

    if (error) {
      console.error('Error cleaning up expired chats:', error)
      return new Response(
        JSON.stringify({ 
          error: error.message,
          details: error.details,
          hint: error.hint
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const deletedCount = data || 0
    console.log(`Successfully cleaned up ${deletedCount} expired conversations`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount,
        message: `Cleaned up ${deletedCount} expired conversations`,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

