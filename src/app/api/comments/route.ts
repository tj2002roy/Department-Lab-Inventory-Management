import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/services/audit.service";
import { AddCommentSchema } from "@/lib/validations";
import { getAuthenticatedUser, canModifyLab } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    const body = await request.json();
    const validated = AddCommentSchema.parse(body);

    // Strict Moved-Only Comment Policy:
    // Authorized actors: Admin/HOD or Teacher assigned to this instrument's lab.
    // Non-authorized actors: CAN ONLY comment if the item has at least one MOVE activity in its audit trail.
    let isAuthorized = authUser?.role === "ADMIN";
    let hasBeenMoved = false;

    if (validated.itemId) {
      const item = await db.item.findUnique({
        where: { id: validated.itemId },
        include: {
          activityLogs: {
            where: { action_type: "MOVE" },
          },
        },
      });

      if (!item) {
        return NextResponse.json(
          { success: false, error: "Instrument not found" },
          { status: 404 }
        );
      }

      if (authUser && canModifyLab(authUser, item.labId)) {
        isAuthorized = true;
      }
      hasBeenMoved = item.activityLogs.length > 0;
    }

    if (!isAuthorized && !hasBeenMoved) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Access Restricted: Non-authorized users can only add comments if the instrument has been moved/relocated.",
        },
        { status: 403 }
      );
    }

    let actorUserId = authUser?.id || validated.userId;
    if (!actorUserId) {
      const fallbackUser = await db.user.findFirst();
      actorUserId = fallbackUser?.id || "unassigned";
    }

    const comment = await AuditService.addComment({
      itemId: validated.itemId,
      systemId: validated.systemId,
      commentText: validated.commentText || validated.comment_text || "",
      userId: actorUserId,
    });
    return NextResponse.json({
      success: true,
      message: "Comment appended to immutable audit trail",
      data: comment,
    }, { status: 201 });
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
