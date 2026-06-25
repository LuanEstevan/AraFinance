import { createClient } from "@supabase/supabase-js";

const SUPA_URL = "https://nafgucdgqqxenzqngpwh.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hZmd1Y2RncXF4ZW56cW5ncHdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1OTczNTcsImV4cCI6MjA5NjE3MzM1N30._iCdDLlI0TD5A0MBnvoRab3qgvWSGVeeWua_9LM-FTo";

export const supabase = createClient(SUPA_URL, SUPA_KEY);
