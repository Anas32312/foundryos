export function formatWhen(value: Date | string | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export function statusLabel(status: string | null): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "running":
      return "Running";
    case "succeeded":
      return "Built";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Not started";
  }
}

export function activityLabel(action: string): string {
  switch (action) {
    case "project.created":
      return "Project created";
    case "project.generated":
      return "Build finished";
    case "project.generate_failed":
      return "Build failed";
    case "project.exported":
      return "ZIP downloaded";
    case "job.cancelled":
      return "Build cancelled";
    default:
      return action;
  }
}

export function isActiveStatus(status: string | null): boolean {
  return status === "queued" || status === "running";
}
