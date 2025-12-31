import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin (hardcoded admin emails)
    const adminEmails = ['info@botmotion.ai', 'admin@botmotion.ai']
    if (!adminEmails.includes(user.email || '')) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, ...data } = await req.json()

    switch (action) {
      case 'list': {
        // Get all users from auth.users
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
        
        if (error) {
          throw error
        }

        // Get all widgets to match with users
        const { data: widgets } = await supabaseAdmin
          .from('widgets')
          .select('user_id, user_email, is_partner, plan, status, is_active')

        const widgetMap = new Map(widgets?.map(w => [w.user_id, w]) || [])

        const enrichedUsers = users.users.map(u => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          widget: widgetMap.get(u.id) || null
        }))

        return new Response(JSON.stringify({ users: enrichedUsers }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'create': {
        const { email, password, isPartner, plan } = data

        // Create user via admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        })

        if (createError) {
          throw createError
        }

        // Determine widget settings based on partner status
        const widgetData: Record<string, unknown> = {
          user_id: newUser.user.id,
          user_email: email,
          api_key: crypto.randomUUID(),
          is_partner: isPartner || false,
        }

        if (isPartner) {
          widgetData.subscription_status = 'active'
          widgetData.status = 'partner'
          widgetData.is_active = true
          widgetData.plan = plan || 'basic'
          
          // Set limits based on plan
          switch (plan) {
            case 'enterprise':
              widgetData.messages_limit = 10000
              widgetData.retention_days = 180
              break
            case 'pro':
              widgetData.messages_limit = 5000
              widgetData.retention_days = 60
              break
            case 'basic':
            default:
              widgetData.messages_limit = 2000
              widgetData.retention_days = 30
              break
          }
        } else {
          widgetData.subscription_status = 'inactive'
          widgetData.status = 'new'
          widgetData.is_active = false
          widgetData.is_partner = false
        }

        // Create widget for the user
        const { error: widgetError } = await supabaseAdmin
          .from('widgets')
          .insert(widgetData)

        if (widgetError) {
          // Rollback: delete the user if widget creation fails
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
          throw widgetError
        }

        return new Response(JSON.stringify({ success: true, user: newUser.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'update': {
        const { userId, isPartner, plan } = data

        const updateData: Record<string, unknown> = {
          is_partner: isPartner || false,
          updated_at: new Date().toISOString()
        }

        if (isPartner) {
          updateData.subscription_status = 'active'
          updateData.status = 'partner'
          updateData.is_active = true
          updateData.plan = plan || 'basic'
          
          switch (plan) {
            case 'enterprise':
              updateData.messages_limit = 10000
              updateData.retention_days = 180
              break
            case 'pro':
              updateData.messages_limit = 5000
              updateData.retention_days = 60
              break
            case 'basic':
            default:
              updateData.messages_limit = 2000
              updateData.retention_days = 30
              break
          }
        } else {
          updateData.is_partner = false
        }

        const { error } = await supabaseAdmin
          .from('widgets')
          .update(updateData)
          .eq('user_id', userId)

        if (error) {
          throw error
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'delete': {
        const { userId } = data

        // Delete widget first
        await supabaseAdmin
          .from('widgets')
          .delete()
          .eq('user_id', userId)

        // Delete user
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) {
          throw error
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    console.error('Admin users error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
