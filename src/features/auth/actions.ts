"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = Object.fromEntries(formData);
  const result = authSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = Object.fromEntries(formData);
  const result = authSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
