export function redactLine(line: string): string {
  return line
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://[redacted]")
    .replace(
      /((?:api[_-]?key|secret|password|token|authorization)\s*[=:]\s*)(\S+)/gi,
      "$1[redacted]",
    )
    .slice(0, 500);
}
