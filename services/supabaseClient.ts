import { createClient } from '@supabase/supabase-js';

// NOTE FOR DEVELOPER/USER:
// To fully enable Supabase:
// 1. Create a project at https://supabase.com
// 2. Run the SQL below in the Supabase SQL Editor to create tables.
// 3. Get your URL and ANON KEY from Project Settings -> API.
// 4. Set them in a .env file or replace the empty strings below (not recommended for production).

/*
-- SQL SCHEMA --

create table if not exists entries (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  challan_number text,
  material text not null,
  quantity numeric not null,
  unit text,
  vehicle_number text,
  site_name text,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  supplier_name text not null,
  amount numeric not null,
  payment_mode text,
  notes text,
  created_by text,
  created_at timestamptz default now()
);

-- RLS Policies (Simple public access for this internal app demo, secure properly in production)
alter table entries enable row level security;
create policy "Public access" on entries for all using (true);
alter table payments enable row level security;
create policy "Public access" on payments for all using (true);
*/

// For this demo, we check if env vars exist. If not, the DataService will fall back to LocalStorage.
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export const isSupabaseConfigured = () => !!supabase;
