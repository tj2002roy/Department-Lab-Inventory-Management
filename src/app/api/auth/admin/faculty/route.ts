import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser, hashPassword } from "@/lib/auth";
import { z } from "zod";

const FacultySchema = z.object({
  prefix: z.string().min(1, "Prefix is required (e.g. Dr., Prof., Mr., Ms., Mrs.)"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional().default(""),
  lastName: z.string().min(1, "Last name is required"),
  officialEmailId: z.string().email("Invalid official email address"),
  employeeCode: z.string().min(1, "Employee code is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  position: z.enum(["Faculty", "Staff"], {
    errorMap: () => ({ message: "Position must be either 'Faculty' or 'Staff'" }),
  }),
  initialPassword: z.string().optional(),
});

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access Denied: Only Head of Department can view faculty records." },
        { status: 403 }
      );
    }

    const faculty = await db.user.findMany({
      where: { role: { in: ["TEACHER"] } },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        prefix: true,
        firstName: true,
        middleName: true,
        lastName: true,
        employeeCode: true,
        contactNumber: true,
        position: true,
        labAssignments: {
          include: {
            lab: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: faculty });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve faculty list" },
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
          error: "Access Denied: Only the Head of Department (Admin) can add faculty and staff.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = FacultySchema.parse(body);

    const {
      prefix,
      firstName,
      middleName,
      lastName,
      officialEmailId,
      employeeCode,
      contactNumber,
      position,
      initialPassword,
    } = validated;

    // Check unique email
    const existingEmail = await db.user.findUnique({
      where: { email: officialEmailId.toLowerCase().trim() },
    });

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: `A user with email '${officialEmailId}' is already registered.` },
        { status: 400 }
      );
    }

    // Check unique employee code
    const existingCode = await db.user.findFirst({
      where: { employeeCode: employeeCode.trim() },
    });

    if (existingCode) {
      return NextResponse.json(
        { success: false, error: `Employee code '${employeeCode}' is already assigned to ${existingCode.name}.` },
        { status: 400 }
      );
    }

    // Build standard composite name: Prefix First [Middle] Last
    const middleClean = middleName?.trim() ? `${middleName.trim()} ` : "";
    const fullName = `${prefix.trim()} ${firstName.trim()} ${middleClean}${lastName.trim()}`.trim();

    // Auto-generate consistent login username (e.g. prof.lastname or emp.code)
    let usernameCandidate = `${position.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    if (usernameCandidate.length < 4) {
      usernameCandidate = `user.${employeeCode.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    }

    // Ensure username uniqueness
    const existingUsername = await db.user.findUnique({
      where: { username: usernameCandidate },
    });

    if (existingUsername) {
      usernameCandidate = `${usernameCandidate}.${employeeCode.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    }

    // Default or specified initial password with PBKDF2 (100,000 iterations)
    const rawDefaultPassword = initialPassword?.trim() || "teacher123";
    const initialPasswordHash = hashPassword(rawDefaultPassword);

    const newUser = await db.user.create({
      data: {
        name: fullName,
        username: usernameCandidate,
        password: initialPasswordHash,
        email: officialEmailId.toLowerCase().trim(),
        role: "TEACHER",
        designation: position,
        prefix: prefix.trim(),
        firstName: firstName.trim(),
        middleName: middleName?.trim() || null,
        lastName: lastName.trim(),
        employeeCode: employeeCode.trim(),
        contactNumber: contactNumber.trim(),
        position,
      },
    });

    // Audit Log Entry
    await db.activityLog.create({
      data: {
        action_type: "CREATE_FACULTY",
        comment_text: `Registered new ${position}: ${fullName} (Employee Code: ${employeeCode.trim()}, Username: ${usernameCandidate})`,
        userId: authUser.id,
        userName: authUser.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${position} member '${fullName}' registered successfully. Default login: username '${usernameCandidate}', password '${rawDefaultPassword}'`,
      data: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        employeeCode: newUser.employeeCode,
        position: newUser.position,
        defaultPassword: rawDefaultPassword,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register faculty member" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access Denied: Only Head of Department can edit faculty records." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, prefix, firstName, middleName, lastName, officialEmailId, employeeCode, contactNumber, position } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing faculty ID" }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "Faculty member not found" }, { status: 404 });
    }

    // Check duplicate email for another user
    if (officialEmailId) {
      const emailConflict = await db.user.findFirst({
        where: {
          email: officialEmailId.toLowerCase().trim(),
          id: { not: id },
        },
      });
      if (emailConflict) {
        return NextResponse.json({ success: false, error: `Email '${officialEmailId}' is already used by another member.` }, { status: 400 });
      }
    }

    // Check duplicate employee code for another user
    if (employeeCode) {
      const codeConflict = await db.user.findFirst({
        where: {
          employeeCode: employeeCode.trim(),
          id: { not: id },
        },
      });
      if (codeConflict) {
        return NextResponse.json({ success: false, error: `Employee code '${employeeCode}' is already assigned to another member.` }, { status: 400 });
      }
    }

    const middleClean = middleName?.trim() ? `${middleName.trim()} ` : "";
    const fullName = `${prefix.trim()} ${firstName.trim()} ${middleClean}${lastName.trim()}`.trim();

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        name: fullName,
        email: officialEmailId.toLowerCase().trim(),
        prefix: prefix.trim(),
        firstName: firstName.trim(),
        middleName: middleName?.trim() || null,
        lastName: lastName.trim(),
        employeeCode: employeeCode.trim(),
        contactNumber: contactNumber.trim(),
        position,
        designation: position,
      },
    });

    // Audit Log Entry
    await db.activityLog.create({
      data: {
        action_type: "EDIT_FACULTY",
        comment_text: `Updated profile details for ${fullName} (Employee Code: ${employeeCode.trim()})`,
        userId: authUser.id,
        userName: authUser.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Profile updated for ${fullName}`,
      data: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update faculty member" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access Denied: Only Head of Department can remove faculty records." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing faculty ID parameter" }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "Faculty member not found" }, { status: 404 });
    }

    if (targetUser.role === "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Action Prohibited: The Head of Department (Admin) account cannot be deleted." },
        { status: 400 }
      );
    }

    // Delete any lab assignments for this user
    await db.labAssignment.deleteMany({ where: { userId: id } });

    // Delete the user record
    await db.user.delete({ where: { id } });

    // Audit Log Entry
    await db.activityLog.create({
      data: {
        action_type: "DELETE_FACULTY",
        comment_text: `Removed faculty member: ${targetUser.name} (Employee Code: ${targetUser.employeeCode || targetUser.username}) and revoked laboratory authorizations`,
        userId: authUser.id,
        userName: authUser.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Faculty member '${targetUser.name}' removed successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove faculty member" },
      { status: 500 }
    );
  }
}
