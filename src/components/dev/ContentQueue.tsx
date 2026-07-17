"use client";

import type { StudioLevelRow } from "@/lib/dev/content-library";
import type { LevelPipelineStatus } from "@/lib/dev/level-pipeline-status";

function statusTone(status: LevelPipelineStatus): string {
  if (status === "published") return "border-sky-400/40 text-sky-200";
  if (status === "ready") return "border-emerald-400/40 text-emerald-200";
  if (status === "needs_answers") return "border-amber-400/40 text-amber-200";
  if (status === "needs_regions") return "border-orange-400/40 text-orange-200";
  return "border-white/20 text-white/45";
}

function PipelineChain({ stages }: { stages: StudioLevelRow["pipeline"]["stages"] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {stages.map((stage, index) => (
        <span key={stage.id} className="inline-flex items-center gap-1.5">
          {index > 0 && <span className="text-white/20">→</span>}
          <span
            className={
              stage.done ? "text-emerald-300" : "text-white/30"
            }
            title={stage.done ? `${stage.label} done` : `${stage.label} pending`}
          >
            {stage.done ? "●" : "○"} {stage.label}
          </span>
        </span>
      ))}
    </div>
  );
}

interface ContentQueueProps {
  levels: StudioLevelRow[];
  onOpenLevel: (slug: string) => void;
}

export function ContentQueue({ levels, onOpenLevel }: ContentQueueProps) {
  if (levels.length === 0) {
    return (
      <p className="px-4 py-10 text-sm text-white/35">
        Нет Level — нажми «+ Import Image», чтобы создать первый.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/30">
          <tr>
            <th className="px-4 py-3 font-medium">Movie</th>
            <th className="px-4 py-3 font-medium">Pipeline</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Challenge</th>
          </tr>
        </thead>
        <tbody>
          {levels.map((row) => (
            <tr
              key={row.slug}
              className="cursor-pointer border-b border-white/5 text-white/70 transition-colors hover:bg-white/[0.04]"
              onClick={() => onOpenLevel(row.slug)}
            >
              <td className="px-4 py-3">
                <p className="text-white">{row.label}</p>
                <p className="font-mono text-[10px] text-white/30">{row.slug}</p>
              </td>
              <td className="px-4 py-3">
                <PipelineChain stages={row.pipeline.stages} />
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block border px-2 py-0.5 text-xs ${statusTone(row.pipelineStatus)}`}
                >
                  {row.pipeline.statusLabel}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-white/45">
                {row.challenge?.date ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
