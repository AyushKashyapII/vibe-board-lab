import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';


export interface SignUpDate{
    email:string;
    password:string;
    username:string;

}

export async function signUp(data:SignUpDate){
    const{email,password,username}=data;

    const{data:authData,error:signUpError}=await supabase.auth.signUp({
        email,
        password,
    })

    if(!signUpError){
        console.log("SIGN up Successfull!!!")
    }

    if(signUpError){
        throw signUpError;
    }
    if(authData.user){
        const {error:profileError}=await supabase
        .from('profiles')
        .upsert({
            id:authData.user.id,
            username,
            updated_at:new Date().toISOString(),
        })

        if(profileError){
            throw profileError;
        }
    }

    return authData;

}
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) throw error;
  
    const user = data.user;
  
    if (user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          username: user.user_metadata?.username || "New User",
          updated_at: new Date().toISOString(),
        });
  
      if (profileError) throw profileError;
    }
  
    return { ...data, success: true };
  }
  
  
  export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }
  
  export async function getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }






