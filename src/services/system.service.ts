import { db } from "@/lib/db";
import { CreateSystemInput } from "@/lib/validations";
import { ActionType } from "@/lib/types";

/**
 * Computes standard laboratory prefix from lab name:
 * "Digital Lab" -> "DL"
 * "Lab 1" -> "L1"
 * "Lab 2" -> "L2"
 * "Lab 3" -> "L3"
 * "Lab 4" -> "L4"
 */
function getLabCode(labName: string): string {
  const normalized = labName.trim().toUpperCase();
  if (normalized.includes("DIGITAL")) return "DL";
  const match = normalized.match(/LAB\s*(\d+)/);
  if (match) return `L${match[1]}`;
  return normalized.slice(0, 2);
}

export class SystemService {
  /**
   * Generates the next sequential unique system identifier (e.g., SYS-DL-001).
   */
  static async generateUniqueSystemId(labId: string): Promise<string> {
    const lab = await db.lab.findUnique({ where: { id: labId } });
    if (!lab) throw new Error(`Lab with ID ${labId} does not exist`);

    const code = getLabCode(lab.name);
    const prefix = `SYS-${code}-`;

    // Query highest existing sequence
    const systems = await db.system.findMany({
      where: { unique_id: { startsWith: prefix } },
      select: { unique_id: true },
      orderBy: { unique_id: "desc" },
      take: 1,
    });

    let nextSeq = 1;
    if (systems.length > 0) {
      const match = systems[0].unique_id.match(/-(\d+)$/);
      if (match) {
        nextSeq = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${String(nextSeq).padStart(3, "0")}`;
  }

  /**
   * Creates a new System, auto-generates its Unique System ID,
   * bundles specified items, and updates all items to the system's lab within a single transaction.
   */
  static async createSystemWithItems(input: CreateSystemInput) {
    const uniqueId = await this.generateUniqueSystemId(input.labId);

    return await db.$transaction(async (tx) => {
      // 1. Create System
      const system = await tx.system.create({
        data: {
          unique_id: uniqueId,
          name: input.name,
          status: input.status,
          labId: input.labId,
        },
        include: { lab: true },
      });

      // 2. Bundle items if provided
      if (input.itemIds && input.itemIds.length > 0) {
        // Verify all items exist
        const items = await tx.item.findMany({
          where: { id: { in: input.itemIds } },
        });

        if (items.length !== input.itemIds.length) {
          throw new Error("One or more item IDs specified for bundling do not exist");
        }

        // Update items to be assigned to this system and match the system's lab
        await tx.item.updateMany({
          where: { id: { in: input.itemIds } },
          data: {
            systemId: system.id,
            labId: input.labId,
          },
        });

        // Generate activity logs for each bundled item
        for (const item of items) {
          await tx.activityLog.create({
            data: {
              itemId: item.id,
              systemId: system.id,
              userId: input.userId,
              action_type: ActionType.UPDATE,
              fromLabId: item.labId !== input.labId ? item.labId : undefined,
              toLabId: input.labId,
              comment_text: `Item bundled into System ${system.unique_id} (${system.name})`,
            },
          });
        }
      }

      // 3. Log system creation
      await tx.activityLog.create({
        data: {
          systemId: system.id,
          userId: input.userId,
          action_type: ActionType.UPDATE,
          toLabId: input.labId,
          comment_text: `System created with ID ${system.unique_id} containing ${input.itemIds?.length || 0} initial components`,
        },
      });

      return await tx.system.findUnique({
        where: { id: system.id },
        include: {
          lab: true,
          items: true,
        },
      });
    });
  }

  /**
   * Assigns or unassigns items to/from an existing system atomically.
   */
  static async updateSystemItems(systemId: string, itemIdsToAdd: string[], itemIdsToRemove: string[], userId: string) {
    return await db.$transaction(async (tx) => {
      const system = await tx.system.findUnique({
        where: { id: systemId },
      });
      if (!system) throw new Error(`System ${systemId} not found`);

      // Add items
      if (itemIdsToAdd.length > 0) {
        await tx.item.updateMany({
          where: { id: { in: itemIdsToAdd } },
          data: {
            systemId: system.id,
            labId: system.labId,
          },
        });

        for (const id of itemIdsToAdd) {
          await tx.activityLog.create({
            data: {
              itemId: id,
              systemId: system.id,
              userId,
              action_type: ActionType.UPDATE,
              toLabId: system.labId,
              comment_text: `Component assigned to System ${system.unique_id}`,
            },
          });
        }
      }

      // Remove items
      if (itemIdsToRemove.length > 0) {
        await tx.item.updateMany({
          where: { id: { in: itemIdsToRemove }, systemId: system.id },
          data: {
            systemId: null,
          },
        });

        for (const id of itemIdsToRemove) {
          await tx.activityLog.create({
            data: {
              itemId: id,
              systemId: null,
              userId,
              action_type: ActionType.UPDATE,
              comment_text: `Component detached from System ${system.unique_id}`,
            },
          });
        }
      }

      return await tx.system.findUnique({
        where: { id: systemId },
        include: {
          lab: true,
          items: true,
          activityLogs: {
            include: { user: true },
            orderBy: { timestamp: "desc" },
          },
        },
      });
    });
  }

  /**
   * Lists all systems, optionally filtered by lab.
   */
  static async listSystems(labId?: string) {
    return await db.system.findMany({
      where: labId ? { labId } : undefined,
      include: {
        lab: true,
        items: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: { unique_id: "asc" },
    });
  }
}
