import { supabase } from "./supabase";
import { User } from "@supabase/supabase-js";

export interface SignUpData {
  email: string;
  password: string;
  username: string;
}

export async function signUp(data: SignUpData) {
  const { email, password, username } = data;

  // Create user in auth
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) throw signUpError;

  const user = authData.user;
  if (user) {
    // Update the profile username (trigger already created a row in profiles)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user.id);

    if (profileError) throw profileError;
  }

  return authData;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return { ...data, success: true };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Optional helper: fetch full profile
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}
