import { DomainError } from "@/lib/errors";
import {
  templateManifestSchema,
  type TemplateManifest,
} from "@/lib/templates/schema";

export function parseTemplateManifest(
  data: unknown,
  filePath: string,
): TemplateManifest {
  const parsed = templateManifestSchema.safeParse(data);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => {
        const where = issue.path.map(String).join(".") || "manifest";
        return `${where}: ${issue.message}`;
      })
      .join("; ");
    throw new DomainError(
      "VALIDATION_ERROR",
      `Template manifest ${filePath} is invalid. ${detail}`,
      500,
    );
  }
  return parsed.data;
}
