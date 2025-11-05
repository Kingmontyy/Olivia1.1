import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Parse file function called');

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with service role for storage access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create client with user's auth for verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { fileId, filePath } = await req.json();

    if (!fileId || !filePath) {
      return new Response(
        JSON.stringify({ error: 'Missing fileId or filePath' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Parsing file: ${filePath} for user: ${user.id}`);

    // Download file from storage using service role for reliable access
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('uploaded-files')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('File downloaded successfully, parsing...');

    // Import XLSX dynamically
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs');

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellFormula: true,
      cellStyles: true,
      cellDates: true
    });

    // Parse all sheets
    const sheets = workbook.SheetNames.map((sheetName: string, index: number) => {
      const worksheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const rows: any[][] = [];

      for (let R = range.s.r; R <= range.e.r; ++R) {
        const row: any[] = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = worksheet[cellAddress];

          if (cell) {
            row.push({
              v: cell.v,
              f: cell.f,
              t: cell.t,
              s: cell.s,
              w: cell.w
            });
          } else {
            row.push(null);
          }
        }
        rows.push(row);
      }

      return {
        name: sheetName,
        index: index,
        data: rows,
        config: {
          columnCount: range.e.c + 1,
          rowCount: range.e.r + 1
        }
      };
    });

    const parsedData = { sheets };
    console.log(`Parsed ${sheets.length} sheets successfully`);

    // Update the database record with parsed data using service role
    const { error: updateError } = await supabaseAdmin
      .from('uploaded_files')
      .update({ edited_data: parsedData })
      .eq('id', fileId)
      .eq('user_id', user.id); // Security: only update user's own files

    if (updateError) {
      console.error('Error updating file record:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save parsed data' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('File parsed and saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        sheetCount: sheets.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in parse-file function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});