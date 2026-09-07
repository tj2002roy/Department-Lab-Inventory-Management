import { NextRequest, NextResponse } from "next/server";
import { RelocationService } from "@/services/relocation.service";
import { RelocateItemSchema, RelocateSystemSchema } from "@/lib/validations";
import { getAuthenticatedUser, canModifyLab } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const RelocateRequestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("ITEM"),
    payload: RelocateItemSchema,
  }),
  z.object({
    type: z.literal("SYSTEM"),
    payload: RelocateSystemSchema,
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    const body = await request.json();
    const validated = RelocateRequestSchema.parse(body);

    if (validated.type === "ITEM") {
      const item = await db.item.findUnique({
        where: { id: validated.payload.itemId },
      });
      if (!item) {
        return NextResponse.json(
          { success: false, error: "Item not found" },
          { status: 404 }
        );
      }

      if (!authUser || !canModifyLab(authUser, item.labId)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Access Denied: You are not authorized to relocate instruments from this laboratory. Authorization is managed exclusively by the Head of Department (Admin).",
          },
          { status: 403 }
        );
      }

      const result = await RelocationService.relocateItem({
        ...validated.payload,
        userId: authUser.id,
      });
      return NextResponse.json({
        success: true,
        message: "Item relocated successfully in atomic transaction",
        data: result,
      });
    } else {
      const sys = await db.system.findUnique({
        where: { id: validated.payload.systemId },
      });
      if (!sys) {
        return NextResponse.json(
          { success: false, error: "System not found" },
          { status: 404 }
        );
      }

      if (!authUser || !canModifyLab(authUser, sys.labId)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Access Denied: You are not authorized to relocate systems from this laboratory. Authorization is managed exclusively by the Head of Department (Admin).",
          },
          { status: 403 }
        );
      }

      const result = await RelocationService.relocateSystem({
        ...validated.payload,
        userId: authUser.id,
      });
      return NextResponse.json({
        success: true,
        message: `System and ${result.bundledItemCount} components relocated successfully in atomic transaction`,
        data: result,
      });
    }
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
