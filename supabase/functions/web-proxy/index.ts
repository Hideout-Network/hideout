import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SSRF protection - block internal networks
    try {
      const target = new URL(url);
      if (!/^https?:$/.test(target.protocol)) {
        return new Response(
          JSON.stringify({ error: 'Invalid protocol' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Block private IP ranges and localhost
      const hostname = target.hostname.toLowerCase();
      const blockedPatterns = [
        /^localhost$/i,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[01])\./,
        /^192\.168\./,
        /^169\.254\./,  // AWS/GCP metadata
        /^0\./,
        /^\[?::1\]?$/,  // IPv6 localhost
        /^\[?fe80:/i,   // IPv6 link-local
        /^\[?fc00:/i,   // IPv6 unique local
      ];
      
      if (blockedPatterns.some(pattern => pattern.test(hostname))) {
        return new Response(
          JSON.stringify({ error: 'Blocked: Cannot access internal resources' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Proxying request to:', url);

    // Forward cookies from request if any
    const requestCookies = req.headers.get('cookie') || '';
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/avif,image/jxl,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'Cookie': requestCookies,
      },
      redirect: 'follow'
    });

    // Forward cookies from response
    const responseCookies = response.headers.get('set-cookie') || '';


    if (!response.ok) {
      console.error('Fetch failed:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ 
          error: `Failed to load page: ${response.status}`,
          success: false 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    let content = await response.text();

    if (contentType.includes('text/html')) {
      const baseUrl = new URL(url).origin;
      
      // Remove ALL restrictive headers and meta tags that block iframing
      content = content
        // Add base tag at the very beginning
        .replace(/<head>/i, `<head><base href="${baseUrl}/">`)
        // Remove X-Frame-Options meta tags
        .replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, '')
        // Remove CSP meta tags
        .replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '')
        // Remove any other frame-busting scripts
        .replace(/<script[^>]*>[\s\S]*?(if|while)[\s\S]*?(top|self|parent)[\s\S]*?<\/script>/gi, '');

      // Inject sandbox attribute remover and resource rewriter
      const injector = `<script>
(function() {
  // Remove sandbox restrictions from iframes
  if (window.frameElement) {
    try {
      window.frameElement.removeAttribute('sandbox');
    } catch(e) {}
  }
  
  const currentUrl = '${url}';
  const baseOrigin = '${baseUrl}';
  
  // Helper to convert relative URLs to absolute
  function toAbsolute(url) {
    if (!url || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:')) return url;
    try {
      return new URL(url, currentUrl).href;
    } catch(e) {
      return url;
    }
  }
  
  // Rewrite resources to load through proxy
  function rewriteElements() {
    // Fix all link hrefs (including stylesheets)
    document.querySelectorAll('link[href], a[href]').forEach(el => {
      const href = el.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        const abs = toAbsolute(href);
        if (abs !== href) el.setAttribute('href', abs);
      }
    });
    
    // Fix all src attributes (img, script, iframe, video, audio, source)
    document.querySelectorAll('[src]').forEach(el => {
      const src = el.getAttribute('src');
      if (src) {
        const abs = toAbsolute(src);
        if (abs !== src) el.setAttribute('src', abs);
      }
    });
    
    // Fix srcset attributes
    document.querySelectorAll('[srcset]').forEach(el => {
      const srcset = el.getAttribute('srcset');
      if (srcset) {
        const fixed = srcset.split(',').map(s => {
          const parts = s.trim().split(/\\s+/);
          if (parts[0]) parts[0] = toAbsolute(parts[0]);
          return parts.join(' ');
        }).join(', ');
        el.setAttribute('srcset', fixed);
      }
    });
    
    // Fix form actions
    document.querySelectorAll('form[action]').forEach(form => {
      const action = form.getAttribute('action');
      if (action) {
        const abs = toAbsolute(action);
        if (abs !== action) form.setAttribute('action', abs);
      }
    });
  }
  
  // Run immediately and on DOM changes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', rewriteElements);
  } else {
    rewriteElements();
  }
  
  // Watch for new elements
  const observer = new MutationObserver(rewriteElements);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'href', 'srcset', 'action']
  });
  
  // Override window.open to stay in proxy
  const originalOpen = window.open;
  window.open = function(url, ...args) {
    if (url) {
      url = toAbsolute(url);
    }
    return originalOpen.call(this, url, ...args);
  };
})();
<\/script>`;

      // Inject the script before closing head or body tag
      if (/<\/head>/i.test(content)) {
        content = content.replace(/<\/head>/i, injector + '</head>');
      } else if (/<\/body>/i.test(content)) {
        content = content.replace(/<\/body>/i, injector + '</body>');
      } else {
        content = injector + content;
      }
    }

    return new Response(
      JSON.stringify({ 
        html: content,
        success: true,
        cookies: responseCookies
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          ...(responseCookies ? { 'Set-Cookie': responseCookies } : {})
        } 
      }
    );

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
