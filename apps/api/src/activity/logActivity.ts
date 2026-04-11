import { prisma } from "../db.js";

export async function logActivity(opts: {
  actorUserId?: string | null;
  patientId?: string | null;
  action: string;
  detail: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.activityEvent.create({
      data: {
        actorUserId: opts.actorUserId ?? undefined,
        patientId: opts.patientId ?? undefined,
        action: opts.action,
        detail: opts.detail,
        metaJson: opts.meta ? JSON.stringify(opts.meta) : undefined,
      },
    });
  } catch (e) {
    console.error("logActivity failed", e);
  }
}
