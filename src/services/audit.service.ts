import { db } from "@/lib/db";
import { formatAuditDateTime } from "@/lib/date";
import { AddCommentInput } from "@/lib/validations";
import { ActionType } from "@/lib/types";

export interface FormattedAuditEntry {
  id: string;
  actionType: ActionType;
  primaryText: string;
  commentText?: string | null;
  timestamp: string;
  rawTimestamp: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  fromLab?: string | null;
  toLab?: string | null;
  systemId?: string | null;
}

export class AuditService {
  /**
   * Adds an immutable free-text comment entry attached to an Item or System.
   */
  static async addComment(input: AddCommentInput) {
    return await db.activityLog.create({
      data: {
        itemId: input.itemId || null,
        systemId: input.systemId || null,
        userId: input.userId,
        action_type: ActionType.COMMENT,
        comment_text: input.commentText,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Formats a raw ActivityLog database record into the exact human-readable representation
   * specified by laboratory audit compliance standards.
   *
   * Example: "Chair #L1-5 was moved from Lab 1 to Lab 2 by Dr. Sarah Chen on 07/09/2026 at 10:15"
   */
  static formatLogEntry(log: {
    id: string;
    action_type: ActionType | string;
    comment_text: string | null;
    timestamp: Date;
    user?: { id: string; name: string; email: string; role: string } | null;
    userName?: string | null;
    fromLab?: { name: string } | null;
    toLab?: { name: string } | null;
    item?: { name: string } | null;
    system?: { name: string; unique_id: string } | null;
    systemId?: string | null;
  }): FormattedAuditEntry {
    const formattedDate = formatAuditDateTime(log.timestamp);
    const targetName = log.item?.name || log.system?.name || "Entity";
    const userName = log.user?.name || "System Operator";

    let primaryText = "";

    switch (log.action_type) {
      case ActionType.MOVE: {
        const from = log.fromLab?.name || "Unassigned Location";
        const to = log.toLab?.name || "Unassigned Location";
        primaryText = `${targetName} was moved from ${from} to ${to} by ${userName} on ${formattedDate}`;
        break;
      }
      case ActionType.COMMENT: {
        primaryText = `Comment logged by ${userName} on ${formattedDate}`;
        break;
      }
      case ActionType.UPDATE:
      default: {
        primaryText = `${targetName} was updated by ${userName} on ${formattedDate}`;
        break;
      }
    }

    return {
      id: log.id,
      actionType: log.action_type as ActionType,
      primaryText,
      commentText: log.comment_text,
      timestamp: formattedDate,
      rawTimestamp: log.timestamp,
      user: log.user || {
        id: "system",
        name: log.userName || "System Operator",
        email: "system@institution.edu",
        role: "ADMIN",
      },
      fromLab: log.fromLab?.name,
      toLab: log.toLab?.name,
      systemId: log.systemId,
    };
  }

  /**
   * Retrieves all activity logs for an item, sorted descending with formatted messages.
   */
  static async getItemTimeline(itemId: string): Promise<FormattedAuditEntry[]> {
    const logs = await db.activityLog.findMany({
      where: { itemId },
      include: {
        user: true,
        fromLab: true,
        toLab: true,
        item: { select: { name: true } },
        system: { select: { name: true, unique_id: true } },
      },
      orderBy: { timestamp: "desc" },
    });

    return logs.map((log) => this.formatLogEntry(log));
  }

  /**
   * Retrieves all activity logs across the entire laboratory environment.
   */
  static async getGlobalActivity(limit = 50): Promise<FormattedAuditEntry[]> {
    const logs = await db.activityLog.findMany({
      take: limit,
      include: {
        user: true,
        fromLab: true,
        toLab: true,
        item: { select: { name: true } },
        system: { select: { name: true, unique_id: true } },
      },
      orderBy: { timestamp: "desc" },
    });

    return logs.map((log) => this.formatLogEntry(log));
  }
}
