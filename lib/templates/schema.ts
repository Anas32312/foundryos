import { z } from "zod";

export const templateManifestSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1).max(80),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().min(1).max(300),
  framework: z.literal("nextjs"),
  language: z.literal("typescript"),
  features: z.array(z.string().min(1).max(60)).max(20),
  requiredEnvironmentVariables: z.array(z.string().min(1).max(80)).max(20),
  permissions: z.array(z.string().min(1).max(80)).max(20),
  entrypoint: z.string().min(1).max(120),
  license: z.string().min(1).max(40),
});

export type TemplateManifest = z.infer<typeof templateManifestSchema>;

export const projectManifestSchema = z.object({
  schemaVersion: z.literal(1),
  platform: z.literal("foundryos"),
  projectId: z.string().min(1),
  template: z.object({
    id: z.string().min(1),
    version: z.string().min(1),
  }),
  generatorVersion: z.string().min(1),
  createdAt: z.string().min(1),
  features: z.array(z.string()),
  filesManifestVersion: z.literal(1),
  files: z.array(z.string()),
});

export type ProjectManifest = z.infer<typeof projectManifestSchema>;
