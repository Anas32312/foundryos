import type { Metadata } from "next";
import { listSkills } from "@/lib/skills/registry";

export const metadata: Metadata = { title: "Skills" };

export default function SkillsPage() {
  const skills = listSkills();

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Skills</h1>
      <p className="mt-2 max-w-xl text-muted">
        Instruction packages for a generated Next.js site. FoundryOS lists them and does not run
        them. Open the <code className="font-mono text-ink">SKILL.md</code> in the local folder
        when you want Cursor to follow one.
      </p>
      {skills.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No skills yet.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {skills.map((skill) => (
            <li key={skill.manifest.id} className="rounded-2xl border border-line bg-panel p-6">
              <h2 className="text-lg font-medium">
                {skill.manifest.name}{" "}
                <span className="text-sm font-normal text-muted">{skill.manifest.version}</span>
              </h2>
              <p className="mt-2 text-sm text-muted">{skill.manifest.description}</p>
              <p className="mt-3 text-sm">
                {skill.manifest.license} · writes{" "}
                {skill.manifest.permissions.filesystem.write.join(", ")}
              </p>
              <p className="mt-1 font-mono text-xs text-muted">skills/{skill.manifest.id}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
