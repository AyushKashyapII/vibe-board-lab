import { BoardItemData } from "@/components/BoardItem";
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

const { data: profile, error: profileFetchError } = await supabase
  .from("profiles")
  .select("canvas_ids, personal_canvas_id, shared_canvas_ids")
  .eq("id", userId)
  .single();

if (profileFetchError) throw profileFetchError;

const updatedCanvasIds = [...(profile.canvas_ids || []), canvas.id];

const { error: profileUpdateError } = await supabase
  .from("profiles")
  .update({
    canvas_ids: updatedCanvasIds,
    personal_canvas_id: type === "personal" ? canvas.id : profile.personal_canvas_id,
    shared_canvas_ids:
      type === "shared"
        ? Array.from(new Set([...(profile.shared_canvas_ids || []), canvas.id]))
        : profile.shared_canvas_ids || [],
  })
  .eq("id", userId);

if (profileUpdateError) throw profileUpdateError;

  return canvas;
}


export async function saveCanvas(boardId:string,items:BoardItemData[]){
  //console.log("trying to save ",items)
  const {data,error}=await supabase
  .from("canvases")
  .update({items})
  .eq("id",boardId)

  if(error) throw error;
}

export async function fetchCanvas(boardId:string){
  const {data,error}=await supabase
  .from("canvases")
  .select("items")
  .eq("id",boardId)
  .single();
  if(error) throw error;

  if(data?.items){
    return data.items;
  }
}
