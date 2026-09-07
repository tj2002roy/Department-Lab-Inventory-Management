import { NextRequest, NextResponse } from "next/server";
import { ItemService } from "@/services/item.service";
import { AuditService } from "@/services/audit.service";
import { UpdateItemSchema } from "@/lib/validations";
import { getAuthenticatedUser, canModifyLab } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const item = await ItemService.getItemByQrUuid(params.uuid);
    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found for this QR identifier" },
        { status: 404 }
      );
    }

    // Format audit trail into compliant human-readable entries
    const formattedTimeline = item.activityLogs.map((log) =>
      AuditService.formatLogEntry({
        ...log,
        item: { name: item.name },
        system: item.system ? { name: item.system.name, unique_id: item.system.unique_id } : null,
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        ...item,
        timeline: formattedTimeline,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const authUser = await getAuthenticatedUser();
    const item = await ItemService.getItemByQrUuid(params.uuid);
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
            "Access Denied: You are not authorized to alter instrument specifications in this laboratory. Only the assigned Teacher or Head of Department (Admin) can modify lab data.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = UpdateItemSchema.parse(body);

    const updated = await ItemService.updateItem(params.uuid, {
      ...validated,
      userId: authUser?.id || validated.userId,
    });
    return NextResponse.json({ success: true, data: updated });
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
