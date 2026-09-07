import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser, canModifyLab } from "@/lib/auth";

export async function GET() {
  try {
    const labs = await db.lab.findMany({
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
            systems: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: labs });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    const body = await request.json();
    const { labId, name, workingPcs, inactivePcs, description } = body;

    if (!labId) {
      return NextResponse.json(
        { success: false, error: "Missing labId parameter" },
        { status: 400 }
      );
    }

    // Check authorization: Admin can edit any lab; assigned teacher can edit their lab
    if (authUser && !canModifyLab(authUser, labId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Access Denied: You are not authorized to edit this laboratory. Authorization is managed by the Head of Department (Admin).",
        },
        { status: 403 }
      );
    }

    const dataToUpdate: any = {};

    if (name !== undefined && name.trim()) {
      // Check if name is taken by another lab
      const conflict = await db.lab.findFirst({
        where: {
          name: name.trim(),
          id: { not: labId },
        },
      });
      if (conflict) {
        return NextResponse.json(
          { success: false, error: `A laboratory named '${name.trim()}' already exists.` },
          { status: 400 }
        );
      }
      dataToUpdate.name = name.trim();
    }

    if (workingPcs !== undefined) {
      const parsedWorking = parseInt(workingPcs, 10);
      if (isNaN(parsedWorking) || parsedWorking < 0) {
        return NextResponse.json(
          { success: false, error: "Working PCs must be a non-negative integer" },
          { status: 400 }
        );
      }
      dataToUpdate.workingPcs = parsedWorking;
    }

    if (inactivePcs !== undefined) {
      const parsedInactive = parseInt(inactivePcs, 10);
      if (isNaN(parsedInactive) || parsedInactive < 0) {
        return NextResponse.json(
          { success: false, error: "Inactive PCs must be a non-negative integer" },
          { status: 400 }
        );
      }
      dataToUpdate.inactivePcs = parsedInactive;
    }

    if (description !== undefined) {
      dataToUpdate.description = description.trim();
    }

    const updatedLab = await db.lab.update({
      where: { id: labId },
      data: dataToUpdate,
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
            systems: true,
          },
        },
      },
    });

    // Record audit log
    if (authUser) {
      await db.activityLog.create({
        data: {
          action_type: "EDIT_LAB",
          comment_text: `Updated facility parameters for ${updatedLab.name} (Working PCs: ${updatedLab.workingPcs}, Inactive: ${updatedLab.inactivePcs})`,
          userId: authUser.id,
          userName: authUser.name,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Laboratory counts updated successfully",
      data: updatedLab,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Access Denied: Only the Head of Department (Admin) can provision new laboratories.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, workingPcs, inactivePcs } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Laboratory name is required" },
        { status: 400 }
      );
    }

    const existing = await db.lab.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `A laboratory named '${name.trim()}' already exists.` },
        { status: 400 }
      );
    }

    const newLab = await db.lab.create({
      data: {
        name: name.trim(),
        description: description?.trim() || "Institutional Laboratory Facility",
        workingPcs: Number(workingPcs) || 0,
        inactivePcs: Number(inactivePcs) || 0,
      },
    });

    // Audit Log Entry
    await db.activityLog.create({
      data: {
        action_type: "CREATE_LAB",
        comment_text: `Provisioned new laboratory facility: ${newLab.name} (${newLab.workingPcs} initial working PCs)`,
        userId: authUser.id,
        userName: authUser.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Laboratory '${newLab.name}' provisioned successfully`,
      data: newLab,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access Denied: Only the Head of Department (Admin) can remove laboratories." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const labId = searchParams.get("id");

    if (!labId) {
      return NextResponse.json({ success: false, error: "Missing laboratory ID parameter" }, { status: 400 });
    }

    const targetLab = await db.lab.findUnique({
      where: { id: labId },
      include: {
        _count: {
          select: {
            items: true,
            systems: true,
          },
        },
      },
    });

    if (!targetLab) {
      return NextResponse.json({ success: false, error: "Laboratory not found" }, { status: 404 });
    }

    if (targetLab._count.items > 0 || targetLab._count.systems > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete '${targetLab.name}': It currently houses ${targetLab._count.systems} system rigs and ${targetLab._count.items} instruments. Please relocate these assets before deleting this laboratory.`,
        },
        { status: 400 }
      );
    }

    // Unassign all teachers from this lab
    await db.labAssignment.deleteMany({ where: { labId } });

    // Delete the lab
    await db.lab.delete({ where: { id: labId } });

    // Audit Log Entry
    await db.activityLog.create({
      data: {
        action_type: "DELETE_LAB",
        comment_text: `Decommissioned and removed laboratory facility: ${targetLab.name}`,
        userId: authUser.id,
        userName: authUser.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Laboratory '${targetLab.name}' removed successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove laboratory" },
      { status: 500 }
    );
  }
}
