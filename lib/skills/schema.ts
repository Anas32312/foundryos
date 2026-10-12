import { z } from "zod";

const pathPattern = z.string().min(1).max(120);

export const skillManifestSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1).max(80),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().min(1).max(300),
  publisher: z.string().min(1).max(40),
  license: z.string().min(1).max(40),
  compatibility: z.object({
    frameworks: z.array(z.literal("nextjs")).min(1).max(4),
  }),
  inputs: z.object({
    type: z.literal("object"),
    properties: z.record(
      z.string(),
      z.object({
        type: z.literal("string"),
        description: z.string().min(1).max(200),
      }),
    ),
    required: z.array(z.string()).max(12),
  }),
  permissions: z.object({
    filesystem: z.object({
      read: z.array(pathPattern).max(12),
      write: z.array(pathPattern).max(12),
    }),
    network: z.array(z.string().max(80)).max(8),
  }),
  sideEffects: z.object({
    external: z.literal(false),
  }),
  execution: z.object({
    mode: z.literal("instructions"),
    timeoutSeconds: z.number().int().min(30).max(600),
  }),
  validation: z.object({
    commands: z.array(z.string().min(1).max(80)).max(6),
  }),
});

export type SkillManifest = z.infer<typeof skillManifestSchema>;
