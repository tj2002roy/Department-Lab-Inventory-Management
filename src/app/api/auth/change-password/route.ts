import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, newPassword } = body;

    if (!employeeId || !employeeId.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter your Employee ID / Code." },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 4 characters long." },
        { status: 400 }
      );
    }

    const cleanId = employeeId.trim();

    // Look up user by unique employeeCode or username
    const user = await db.user.findFirst({
      where: {
        OR: [
          { employeeCode: cleanId },
          { username: cleanId.toLowerCase() },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: `No employee account found matching ID '${cleanId}'. Please check your Employee Code or contact the Head of Department.`,
        },
        { status: 404 }
      );
    }

    // Hash new password using PBKDF2 100k
    const newPasswordHash = hashPassword(newPassword);

    await db.user.update({
      where: { id: user.id },
      data: {
        password: newPasswordHash,
      },
    });

    // Record into daily audit log
    await db.activityLog.create({
      data: {
        action_type: "PASSWORD_CHANGE",
        comment_text: `Security credential updated: Password changed for ${user.name} (Employee Code: ${user.employeeCode || user.username})`,
        userId: user.id,
        userName: user.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Password successfully updated for ${user.name} (${user.employeeCode || user.username}). You can now log in with your new password.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update password." },
      { status: 500 }
    );
  }
}
