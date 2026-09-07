import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access Denied: Only Head of Department (Admin) can access audit logs." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase() || "";
    const actionFilter = searchParams.get("action")?.trim() || "";

    const whereClause: any = {};

    if (actionFilter && actionFilter !== "ALL") {
      whereClause.action_type = actionFilter;
    }

    if (query) {
      whereClause.OR = [
        { comment_text: { contains: query } },
        { action_type: { contains: query } },
        { userName: { contains: query } },
        { user: { name: { contains: query } } },
        { user: { username: { contains: query } } },
        { user: { employeeCode: { contains: query } } },
      ];
    }

    const logs = await db.activityLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            employeeCode: true,
          },
        },
        item: {
          select: {
            id: true,
            name: true,
            category: true,
            qr_uuid: true,
          },
        },
        system: {
          select: {
            id: true,
            unique_id: true,
            name: true,
          },
        },
        fromLab: { select: { id: true, name: true } },
        toLab: { select: { id: true, name: true } },
      },
      orderBy: { timestamp: "desc" },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load audit logs" },
      { status: 500 }
    );
  }
}
