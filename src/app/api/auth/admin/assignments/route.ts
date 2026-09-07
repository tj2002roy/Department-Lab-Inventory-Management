import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const AssignmentSchema = z.object({
  teacherId: z.string().uuid("Invalid teacher ID"),
  labId: z.string().uuid("Invalid laboratory ID"),
  action: z.enum(["ASSIGN", "UNASSIGN"]),
});

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access restricted to Head of Department (Admin)" },
        { status: 403 }
      );
    }

    const teachers = await AuthService.listTeachersWithAssignments();
    return NextResponse.json({ success: true, data: teachers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access restricted to Head of Department (Admin)" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { teacherId, labId, action } = AssignmentSchema.parse(body);

    if (action === "ASSIGN") {
      const result = await AuthService.assignTeacherToLab(user.id, teacherId, labId);
      
      // Audit Log
      await db.activityLog.create({
        data: {
          action_type: "ASSIGN_LAB",
          comment_text: `Authorized in-charge faculty: ${result.user.name} assigned to ${result.lab.name}`,
          userId: user.id,
          userName: user.name,
          toLabId: labId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Teacher assigned to laboratory successfully",
        data: result,
      });
    } else {
      const teacher = await db.user.findUnique({ where: { id: teacherId } });
      const lab = await db.lab.findUnique({ where: { id: labId } });

      await AuthService.unassignTeacherFromLab(user.id, teacherId, labId);

      // Audit Log
      await db.activityLog.create({
        data: {
          action_type: "UNASSIGN_LAB",
          comment_text: `Revoked laboratory authorization: Removed ${teacher?.name || "Teacher"} from ${lab?.name || "Laboratory"}`,
          userId: user.id,
          userName: user.name,
          fromLabId: labId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Teacher unassigned from laboratory successfully",
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
