const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const { createClient } = require('@supabase/supabase-js');

const rootDir = path.resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function getArg(flag) {
  const exact = `${flag}=`;
  for (let i = 2; i < process.argv.length; i += 1) {
    const value = process.argv[i];
    if (value === flag) return process.argv[i + 1];
    if (value.startsWith(exact)) return value.slice(exact.length);
  }
  return undefined;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function deriveNameFromEmail(email) {
  const localPart = (email || '').split('@')[0] || 'Admin User';
  const cleaned = localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\d+/g, ' ')
    .trim();

  if (!cleaned) return localPart;

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

async function findUserByEmail(client, email) {
  let page = 1;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const users = data?.users || [];
    const match = users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;

    if (users.length < 1000) return null;
    page += 1;
  }
}

function extractUser(payload) {
  return payload?.user ?? payload ?? null;
}

async function countRows(client, table, column, value) {
  const { count, error } = await client
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, value);

  if (error) throw error;
  return count || 0;
}

async function replaceProfileAsAdminIfSafe(client, user, email, name) {
  const dependencies = [
    ['courses', 'instructor_id'],
    ['enrollments', 'user_id'],
    ['progress', 'user_id'],
    ['certificates', 'user_id'],
    ['lesson_notes', 'user_id'],
    ['bookmarks', 'user_id'],
  ];

  for (const [table, column] of dependencies) {
    const count = await countRows(client, table, column, user.id);
    if (count > 0) {
      throw new Error(
        `Profile role is protected and ${email} already has related data in ${table}. Run SQL Editor: UPDATE public.profiles SET role = 'admin' WHERE id = '${user.id}';`
      );
    }
  }

  const { error: deleteError } = await client.from('profiles').delete().eq('id', user.id);
  if (deleteError) throw deleteError;

  const { error: insertError } = await client.from('profiles').insert({
    id: user.id,
    email,
    name,
    role: 'admin',
  });

  if (insertError) throw insertError;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/create-admin.cjs --email user@example.com --password "StrongPassword" [--name "Display Name"]

Required env:
  VITE_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
`);
}

async function main() {
  loadEnvFile(path.join(rootDir, '.env'));
  loadEnvFile(path.join(rootDir, '.env.local'));

  if (hasFlag('--help') || hasFlag('-h')) {
    printHelp();
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = getArg('--email');
  const password = getArg('--password');
  const name = getArg('--name') || deriveNameFromEmail(email || '');
  if (!supabaseUrl) {
    fail('Missing VITE_SUPABASE_URL in .env');
  }

  if (!serviceRoleKey) {
    fail('Missing SUPABASE_SERVICE_ROLE_KEY in .env. Add your Supabase service role key, then rerun this script.');
  }

  if (!email) {
    fail('Missing --email argument');
  }

  if (!password) {
    fail('Missing --password argument');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    let user = await findUserByEmail(supabase, email);

    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

      if (error) throw error;
      user = extractUser(data);

      if (!user?.id) {
        fail(`User creation returned no user for ${email}`);
      }

      console.log(`Created auth user: ${user.id}`);
    } else {
      const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
        user_metadata: {
          ...(user.user_metadata || {}),
          name,
        },
      });

      if (error) throw error;
      user = extractUser(data) || user;
      console.log(`Updated existing auth user: ${user.id}`);
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email,
          name,
          role: 'admin',
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      if (profileError.message?.includes('Only admins can change roles')) {
        await replaceProfileAsAdminIfSafe(supabase, user, email, name);
      } else {
        throw profileError;
      }
    }

    const { data: profile, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', user.id)
      .single();

    if (verifyError) throw verifyError;

    console.log('\nAdmin user is ready:');
    console.log(`Email: ${profile.email}`);
    console.log(`Name:  ${profile.name}`);
    console.log(`Role:  ${profile.role}`);
  } catch (error) {
    fail(error?.message || 'Failed to create or promote admin user');
  }
}

main();
