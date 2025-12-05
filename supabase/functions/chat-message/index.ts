import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Blocked patterns for server-side validation
const BLOCKED_PATTERNS: RegExp[] = [
  /n[i!1|l][g9][g9][e3]r/gi,
  /n[i!1|l][g9]{2}[a@4]/gi,
  /n[i!1|l][g9][a@4]/gi,
  /n[i!1|l]gg/gi,
  /n[i!1|l][g9][g9]/gi,
  /\|\|?[i!1|l][g9]/gi,
  /n[\s._\-]*[i!1|l][\s._\-]*[g9][\s._\-]*[g9]/gi,
  /n[\W_]*i[\W_]*g[\W_]*g/gi,
  /[n|\|/\\][i!1|l\|][g9][g9]/gi,
  /f[u\*@][c\(k]/gi,
  /f[\s._\-]*u[\s._\-]*c[\s._\-]*k/gi,
  /sh[i!1][t\+]/gi,
  /f[a@4][g9]{2}[o0]t/gi,
  /f[a@4][g9]/gi,
  /r[e3]t[a@4]rd/gi,
  /c[u\*][n\*]t/gi,
  /b[i!1]tch/gi,
  /wh[o0]r[e3]/gi,
  /sl[u\*]t/gi,
  /k[i!1]ll[\s]*y[o0]urs[e3]lf/gi,
  /kys/gi,
];

const BLOCKED_WORDS = new Set([
  'nigger', 'nigga', 'nig', 'niger', 'n1gger', 'n1gga',
  'fuck', 'fucker', 'fucking', 'fck', 'fuk',
  'shit', 'shitty', 'sh1t',
  'cunt', 'cunts',
  'fag', 'faggot', 'fags',
  'retard', 'retarded',
  'kys', 'nazi', 'hitler', 'kkk',
]);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[0@]/g, 'o')
    .replace(/[1!|l]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4@/g, 'a')
    .replace(/5\$/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/9/g, 'g')
    .replace(/\*/g, '')
    .replace(/[\s._\-]+/g, '')
    .replace(/[^\w]/g, '');
}

function containsBlockedContent(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const normalizedMessage = normalizeText(message);
  
  const words = lowerMessage.split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (BLOCKED_WORDS.has(cleanWord)) return true;
  }
  
  for (const blockedWord of BLOCKED_WORDS) {
    if (normalizedMessage.includes(blockedWord.replace(/\s/g, ''))) return true;
  }
  
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(message) || pattern.test(normalizedMessage)) return true;
  }
  
  return false;
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) matrix[i] = [i];
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  return 1 - matrix[s1.length][s2.length] / Math.max(s1.length, s2.length);
}

const TIMEOUT_DURATIONS = [1, 10, 60, 360, 720, 1440]; // minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { username, message, user_id, source = 'website' } = await req.json();
    
    console.log(`Processing message from ${username} (${source}): ${message.substring(0, 50)}...`);
    
    // Validate input
    if (!username || !message) {
      return new Response(
        JSON.stringify({ error: 'Username and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (message.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Message too long (max 500 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check username for blocked content
    if (containsBlockedContent(username)) {
      return new Response(
        JSON.stringify({ error: 'Username contains inappropriate content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get or create user warnings record
    let { data: warnings, error: warningsError } = await supabase
      .from('chat_warnings')
      .select('*')
      .eq('username', username)
      .single();
    
    if (warningsError && warningsError.code !== 'PGRST116') {
      console.error('Error fetching warnings:', warningsError);
    }
    
    // Check if user is timed out
    if (warnings?.timeout_until && new Date(warnings.timeout_until) > new Date()) {
      const remaining = Math.ceil((new Date(warnings.timeout_until).getTime() - Date.now()) / 60000);
      return new Response(
        JSON.stringify({ 
          error: `You are timed out for ${remaining} more minute${remaining !== 1 ? 's' : ''}`,
          timeout: true 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for blocked content in message
    if (containsBlockedContent(message)) {
      const newWarningCount = (warnings?.warning_count || 0) + 1;
      let timeoutUntil = null;
      let response: { error: string; warning?: number; timeout?: boolean; timeoutMinutes?: number };
      
      if (newWarningCount >= 3) {
        const timeoutIndex = Math.min(newWarningCount - 3, TIMEOUT_DURATIONS.length - 1);
        const timeoutMinutes = TIMEOUT_DURATIONS[timeoutIndex];
        timeoutUntil = new Date(Date.now() + timeoutMinutes * 60000).toISOString();
        response = { 
          error: `Your message contains inappropriate content. You have been timed out for ${timeoutMinutes} minute${timeoutMinutes !== 1 ? 's' : ''}.`,
          warning: newWarningCount,
          timeout: true,
          timeoutMinutes 
        };
      } else {
        response = { 
          error: `Warning ${newWarningCount}/3: Your message contains inappropriate content. ${3 - newWarningCount} more warning${3 - newWarningCount !== 1 ? 's' : ''} before timeout.`,
          warning: newWarningCount 
        };
      }
      
      // Update warnings
      if (warnings) {
        await supabase
          .from('chat_warnings')
          .update({ 
            warning_count: newWarningCount, 
            timeout_until: timeoutUntil,
            updated_at: new Date().toISOString()
          })
          .eq('id', warnings.id);
      } else {
        await supabase
          .from('chat_warnings')
          .insert({ 
            username, 
            user_id: user_id || null,
            warning_count: newWarningCount,
            timeout_until: timeoutUntil
          });
      }
      
      return new Response(
        JSON.stringify(response),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for similar messages (spam)
    if (warnings?.last_message) {
      const similarity = calculateSimilarity(message, warnings.last_message);
      const timeSinceLastMessage = warnings.last_message_time 
        ? Date.now() - new Date(warnings.last_message_time).getTime() 
        : Infinity;
      
      // If very similar and within 30 seconds, reject
      if (similarity >= 0.8 && timeSinceLastMessage < 30000) {
        return new Response(
          JSON.stringify({ error: 'Message too similar to your previous message. Please wait before sending similar messages.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Update last message tracking
    if (warnings) {
      await supabase
        .from('chat_warnings')
        .update({ 
          last_message: message,
          last_message_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', warnings.id);
    } else {
      await supabase
        .from('chat_warnings')
        .insert({ 
          username, 
          user_id: user_id || null,
          warning_count: 0,
          last_message: message,
          last_message_time: new Date().toISOString()
        });
    }
    
    // Insert the message
    const { data: insertedMessage, error: insertError } = await supabase
      .from('global_chat')
      .insert({
        username,
        message,
        source
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting message:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to send message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Clean up old messages (keep only 100)
    const { data: allMessages } = await supabase
      .from('global_chat')
      .select('id')
      .order('created_at', { ascending: false });
    
    if (allMessages && allMessages.length > 100) {
      const idsToDelete = allMessages.slice(100).map(m => m.id);
      await supabase
        .from('global_chat')
        .delete()
        .in('id', idsToDelete);
      console.log(`Cleaned up ${idsToDelete.length} old messages`);
    }
    
    console.log(`Message sent successfully: ${insertedMessage.id}`);
    
    return new Response(
      JSON.stringify({ success: true, message: insertedMessage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing message:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
