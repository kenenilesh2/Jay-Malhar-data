import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Keys for LocalStorage
const LS_SUPABASE_URL = 'jay_malhar_supabase_url';
const LS_SUPABASE_KEY = 'jay_malhar_supabase_key';

// Default configuration provided by user
const DEFAULT_SUPABASE_URL = 'https://fuezuatlryjvqtwzxabb.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1ZXp1YXRscnlqdnF0d3p4YWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjgzMzQsImV4cCI6MjA3OTg0NDMzNH0._SxQK9Flc4564yVlMyzcIjjNcrC7FKt9trHP_-JisgI';

// 1. Try Environment Variables first
let supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
let supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// 2. If not found in Env, check LocalStorage
if (!supabaseUrl || !supabaseKey) {
  const lsUrl = localStorage.getItem(LS_SUPABASE_URL);
  const lsKey = localStorage.getItem(LS_SUPABASE_KEY);
  if (lsUrl && lsKey) {
    supabaseUrl = lsUrl;
    supabaseKey = lsKey;
  }
}

// 3. If still not found, use Defaults (Hardcoded)
if (!supabaseUrl || !supabaseKey) {
  supabaseUrl = DEFAULT_SUPABASE_URL;
  supabaseKey = DEFAULT_SUPABASE_KEY;
}

// 4. Create Client
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const isSupabaseConfigured = () => !!supabase;

// Helpers for UI Configuration
export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem(LS_SUPABASE_URL, url);
  localStorage.setItem(LS_SUPABASE_KEY, key);
  window.location.reload(); // Reload to re-initialize client
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem(LS_SUPABASE_URL);
  localStorage.removeItem(LS_SUPABASE_KEY);
  window.location.reload();
};

export const getStoredSupabaseConfig = () => {
  return {
    url: localStorage.getItem(LS_SUPABASE_URL) || DEFAULT_SUPABASE_URL,
    key: localStorage.getItem(LS_SUPABASE_KEY) || DEFAULT_SUPABASE_KEY
  };
};

/*
-- SQL SCHEMA FOR SUPABASE --
-- Run this in Supabase SQL Editor to set up your tables --

-- 1. Entries Table
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

-- 2. Payments Table
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

-- 3. Users Table
create table if not exists app_users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  name text not null,
  role text not null,
  password_hash text not null,
  created_at timestamptz default now()
);

-- RLS Policies (Enable public access for this app)
alter table entries enable row level security;
alter table payments enable row level security;
alter table app_users enable row level security;

create policy "Public access entries" on entries for all using (true) with check (true);
create policy "Public access payments" on payments for all using (true) with check (true);
create policy "Public access users" on app_users for all using (true) with check (true);
*/