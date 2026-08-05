import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1. Validate Authorization header - Step 1: Check existence
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      return new Response(JSON.stringify({ error: 'Authorization header não informado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. Validate Authorization header - Step 2: Check Bearer prefix
    if (!authorization.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Bearer token inválido.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. Validate Authorization header - Step 3: Extract and check token
    const token = authorization.replace('Bearer ', '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token vazio.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const userClient = createClient(supabaseUrl, token, {
      auth: { persistSession: false }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido ou expirado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Initialize privileged client
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // 3. Confirm caller role (admin) and status (active)
    const { data: callerProfile, error: callerError } = await adminClient
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();

    if (callerError || !callerProfile || callerProfile.role !== 'admin' || callerProfile.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Acesso negado: Apenas administradores ativos podem gerenciar usuários.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Parse request parameters
    const { action, name, cpf, role, email, target_uid } = await req.json();

    // ACTION A: CREATE USER
    if (action === 'create_user') {
      if (!name || !cpf || !role || !email) {
        return new Response(JSON.stringify({ error: 'Nome, E-mail, CPF e Role são obrigatórios.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create authentication credentials using the provided email
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: email.trim(),
        password: '1234',
        email_confirm: true,
        user_metadata: { name }
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create corresponding row in public.profiles (including the email)
      const { error: insertError } = await adminClient
        .from('profiles')
        .insert([{
          id: newUser.user.id,
          name,
          cpf: cpf.replace(/\D/g, ''),
          role,
          status: 'active',
          first_access: true,
          email: email.trim()
        }]);

      if (insertError) {
        // Rollback created user if profile row insert fails
        await adminClient.auth.admin.deleteUser(newUser.user.id);
        return new Response(JSON.stringify({ error: 'Erro ao criar perfil no banco: ' + insertError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    // ACTION B: RESET PASSWORD
    } else if (action === 'reset_password') {
      if (!target_uid) {
        return new Response(JSON.stringify({ error: 'ID do usuário é obrigatório.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Reset password to 1234
      const { error: resetError } = await adminClient.auth.admin.updateUserById(target_uid, {
        password: '1234'
      });

      if (resetError) {
        return new Response(JSON.stringify({ error: resetError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Force first access password change
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ first_access: true })
        .eq('id', target_uid);

      if (updateError) {
        return new Response(JSON.stringify({ error: 'Senha alterada, mas falha ao ajustar first_access: ' + updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({ error: 'Ação inválida.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || err }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
