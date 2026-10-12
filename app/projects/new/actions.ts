"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DEFAULT_TEMPLATE_ID } from "@/lib/config";
import { createProject } from "@/lib/domain/projects";
import { DomainError } from "@/lib/errors";

export type CreateState = { error: string } | null;

export async function createProjectAction(
  _state: CreateState,
  formData: FormData,
): Promise<CreateState> {
  let projectId = "";
  try {
    const templateId = String(formData.get("templateId") ?? "");
    const created = await createProject({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      templateId: templateId || DEFAULT_TEMPLATE_ID,
    });
    projectId = created.project.id;
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message };
    throw error;
  }
  revalidatePath("/");
  redirect(`/projects/${projectId}`);
}
