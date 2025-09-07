import { supabase } from "./supabase";

export async function createBoard(
  userId: string,
  name: string,
  type: "personal" | "shared" = "personal"
) {
  const { data: canvas, error: canvasError } = await supabase
    .from("canvases")
    .insert([
      {
        name,
        members: [userId],
        owner_id: userId,
        type,
      },
    ])
    .select()
    .single();

  if (canvasError) throw canvasError;

  return canvas;
}
