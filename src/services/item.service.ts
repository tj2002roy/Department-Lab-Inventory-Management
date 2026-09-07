import { db } from "@/lib/db";
import { generateQrDataUrl, generateQrSvg, getItemUrl } from "@/lib/qr";
import { CreateItemInput, UpdateItemInput } from "@/lib/validations";
import { randomUUID } from "crypto";
import { ActionType } from "@/lib/types";

export class ItemService {
  /**
   * Generates a new laboratory item, assigns a unique static UUID,
   * generates its QR code asset, and logs creation in the immutable audit trail.
   */
  static async createItem(input: CreateItemInput) {
    const qrUuid = randomUUID();
    const qrDataUrl = await generateQrDataUrl(qrUuid);
    const qrSvg = await generateQrSvg(qrUuid);

    return await db.$transaction(async (tx) => {
      // 1. Verify lab exists
      const lab = await tx.lab.findUnique({
        where: { id: input.labId },
      });
      if (!lab) {
        throw new Error(`Target Lab with ID ${input.labId} does not exist`);
      }

      // 2. If assigned to a system, verify system and enforce matching lab
      if (input.systemId) {
        const system = await tx.system.findUnique({
          where: { id: input.systemId },
        });
        if (!system) {
          throw new Error(`Target System with ID ${input.systemId} does not exist`);
        }
        if (system.labId !== input.labId) {
          throw new Error(
            `Item lab must match System lab location (${system.labId}). Move the system or adjust lab selection.`
          );
        }
      }

      // 3. Create Item record
      const item = await tx.item.create({
        data: {
          qr_uuid: qrUuid,
          name: input.name,
          category: input.category,
          labId: input.labId,
          systemId: input.systemId || null,
          attributes: typeof input.attributes === "object" ? JSON.stringify(input.attributes) : (input.attributes || "{}"),
        },
        include: {
          lab: true,
          system: true,
        },
      });

      // 4. Create initial immutable ActivityLog entry
      await tx.activityLog.create({
        data: {
          itemId: item.id,
          systemId: input.systemId || null,
          userId: input.userId,
          action_type: "UPDATE",
          toLabId: input.labId,
          comment_text: `Item registered with static QR asset: ${item.name} (${item.category})`,
        },
      });

      return {
        ...item,
        qrCode: {
          uuid: qrUuid,
          dataUrl: qrDataUrl,
          svg: qrSvg,
          url: getItemUrl(qrUuid),
        },
      };
    });
  }

  /**
   * Resolves an item by its static QR UUID.
   * Includes lab, parent system, and complete history ordered chronologically.
   */
  static async getItemByQrUuid(qrUuid: string) {
    const item = await db.item.findUnique({
      where: { qr_uuid: qrUuid },
      include: {
        lab: true,
        system: {
          include: {
            lab: true,
            items: {
              select: {
                id: true,
                name: true,
                category: true,
                qr_uuid: true,
              },
            },
          },
        },
        activityLogs: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
            fromLab: { select: { id: true, name: true } },
            toLab: { select: { id: true, name: true } },
          },
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!item) return null;

    const qrDataUrl = await generateQrDataUrl(item.qr_uuid);
    const qrSvg = await generateQrSvg(item.qr_uuid);

    const attributes =
      typeof item.attributes === "string"
        ? (() => {
            try {
              return JSON.parse(item.attributes);
            } catch {
              return {};
            }
          })()
        : item.attributes || {};

    return {
      ...item,
      attributes,
      qrCode: {
        uuid: item.qr_uuid,
        dataUrl: qrDataUrl,
        svg: qrSvg,
        url: getItemUrl(item.qr_uuid),
      },
    };
  }

  /**
   * Updates an item's editable attributes while strictly maintaining
   * the static invariant of its QR Code / UUID.
   */
  static async updateItem(qrUuid: string, input: UpdateItemInput) {
    return await db.$transaction(async (tx) => {
      const existing = await tx.item.findUnique({
        where: { qr_uuid: qrUuid },
        include: { lab: true },
      });

      if (!existing) {
        throw new Error(`Item with QR UUID ${qrUuid} not found`);
      }

      // If systemId is changing, ensure target system is in same lab
      if (input.systemId && input.systemId !== existing.systemId) {
        const targetSystem = await tx.system.findUnique({
          where: { id: input.systemId },
        });
        if (!targetSystem) {
          throw new Error(`System ${input.systemId} not found`);
        }
        if (targetSystem.labId !== existing.labId) {
          throw new Error("Cannot assign item to a System located in a different lab");
        }
      }

      const updated = await tx.item.update({
        where: { qr_uuid: qrUuid },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.category ? { category: input.category } : {}),
          ...(input.systemId !== undefined ? { systemId: input.systemId } : {}),
          ...(input.attributes
            ? {
                attributes:
                  typeof input.attributes === "object"
                    ? JSON.stringify(input.attributes)
                    : input.attributes,
              }
            : {}),
        },
        include: {
          lab: true,
          system: true,
        },
      });

      // Record update log
      await tx.activityLog.create({
        data: {
          itemId: existing.id,
          systemId: updated.systemId,
          userId: input.userId,
          action_type: "UPDATE",
          comment_text: input.comment || `Item specs updated for ${updated.name}`,
        },
      });

      return updated;
    });
  }

  /**
   * Fetches all items, optionally filtered by lab and system status.
   */
  static async listItems(params?: { labId?: string; standaloneOnly?: boolean }) {
    const items = await db.item.findMany({
      where: {
        ...(params?.labId ? { labId: params.labId } : {}),
        ...(params?.standaloneOnly ? { systemId: null } : {}),
      },
      include: {
        lab: true,
        system: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return items.map((item) => ({
      ...item,
      attributes:
        typeof item.attributes === "string"
          ? (() => {
              try {
                return JSON.parse(item.attributes);
              } catch {
                return {};
              }
            })()
          : item.attributes || {},
    }));
  }
}
