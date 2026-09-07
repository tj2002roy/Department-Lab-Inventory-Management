import { db } from "@/lib/db";
import { RelocateItemInput, RelocateSystemInput } from "@/lib/validations";
import { ActionType } from "@/lib/types";

export class RelocationService {
  /**
   * Relocates a single laboratory item to a new laboratory.
   * Enforces that the item location update and the immutable ActivityLog entry
   * are executed in a single, atomic Database Transaction.
   *
   * If the item is currently assigned to a System:
   * - If detachFromSystem is true: detaches item from the system and moves it.
   * - If detachFromSystem is false: rejects transaction with clear guidance.
   */
  static async relocateItem(input: RelocateItemInput) {
    return await db.$transaction(async (tx) => {
      // 1. Fetch item with current location and system affiliation
      const item = await tx.item.findUnique({
        where: { id: input.itemId },
        include: {
          lab: true,
          system: true,
        },
      });

      if (!item) {
        throw new Error(`Item with ID ${input.itemId} does not exist`);
      }

      // 2. Validate target lab
      const toLab = await tx.lab.findUnique({
        where: { id: input.toLabId },
      });

      if (!toLab) {
        throw new Error(`Destination Lab with ID ${input.toLabId} does not exist`);
      }

      if (item.labId === input.toLabId) {
        throw new Error(`Item is already located in ${toLab.name}`);
      }

      // 3. Handle System affiliation constraints
      let willDetach = false;
      if (item.systemId) {
        if (!input.detachFromSystem) {
          throw new Error(
            `Item "${item.name}" is part of System "${item.system?.name || item.systemId}". ` +
            `Either relocate the entire System or explicitly detach the item.`
          );
        }
        willDetach = true;
      }

      const fromLabId = item.labId;
      const originalSystemId = item.systemId;

      // 4. Update Item location (and detach if applicable)
      const updatedItem = await tx.item.update({
        where: { id: item.id },
        data: {
          labId: input.toLabId,
          ...(willDetach ? { systemId: null } : {}),
        },
        include: {
          lab: true,
          system: true,
        },
      });

      // 5. Build audit log comment
      let logComment = input.comment || "";
      if (willDetach) {
        const detachNotice = `[Detached from System ${item.system?.unique_id || originalSystemId}]`;
        logComment = logComment ? `${detachNotice} ${logComment}` : detachNotice;
      }

      // 6. Create immutable ActivityLog entry within the SAME transaction
      const logEntry = await tx.activityLog.create({
        data: {
          itemId: item.id,
          systemId: updatedItem.systemId,
          userId: input.userId,
          action_type: ActionType.MOVE,
          fromLabId: fromLabId,
          toLabId: input.toLabId,
          comment_text: logComment || null,
        },
        include: {
          user: true,
          fromLab: true,
          toLab: true,
        },
      });

      return {
        item: updatedItem,
        logEntry,
      };
    });
  }

  /**
   * Relocates an entire System and all its bundled Items to a new laboratory.
   * Wraps the System location update, all bundled Items' location updates,
   * and all corresponding ActivityLog entries in a single, atomic Database Transaction.
   */
  static async relocateSystem(input: RelocateSystemInput) {
    return await db.$transaction(async (tx) => {
      // 1. Fetch system with bundled items and current lab
      const system = await tx.system.findUnique({
        where: { id: input.systemId },
        include: {
          lab: true,
          items: true,
        },
      });

      if (!system) {
        throw new Error(`System with ID ${input.systemId} does not exist`);
      }

      // 2. Validate target lab
      const toLab = await tx.lab.findUnique({
        where: { id: input.toLabId },
      });

      if (!toLab) {
        throw new Error(`Destination Lab with ID ${input.toLabId} does not exist`);
      }

      if (system.labId === input.toLabId) {
        throw new Error(`System is already located in ${toLab.name}`);
      }

      const fromLabId = system.labId;

      // 3. Update System location
      const updatedSystem = await tx.system.update({
        where: { id: system.id },
        data: {
          labId: input.toLabId,
        },
        include: {
          lab: true,
        },
      });

      // 4. Update all bundled Items to match new lab location
      const bundledItemCount = system.items.length;
      if (bundledItemCount > 0) {
        await tx.item.updateMany({
          where: { systemId: system.id },
          data: {
            labId: input.toLabId,
          },
        });
      }

      // 5. Create ActivityLog entry for the System
      const systemLog = await tx.activityLog.create({
        data: {
          systemId: system.id,
          userId: input.userId,
          action_type: ActionType.MOVE,
          fromLabId: fromLabId,
          toLabId: input.toLabId,
          comment_text: input.comment || `System relocated with ${bundledItemCount} bundled components`,
        },
      });

      // 6. Create individual ActivityLog entries for each bundled Item
      const itemLogs = [];
      for (const item of system.items) {
        const itemLog = await tx.activityLog.create({
          data: {
            itemId: item.id,
            systemId: system.id,
            userId: input.userId,
            action_type: ActionType.MOVE,
            fromLabId: fromLabId,
            toLabId: input.toLabId,
            comment_text: `Relocated as part of System ${system.unique_id} (${system.name})`,
          },
        });
        itemLogs.push(itemLog);
      }

      return {
        system: updatedSystem,
        bundledItemCount,
        systemLog,
        itemLogs,
      };
    });
  }
}
