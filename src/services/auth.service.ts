import { db } from "@/lib/db";
import { hashPassword, verifyPassword, createSessionToken } from "@/lib/auth";

export class AuthService {
  /**
   * Authenticates a user (Admin or Teacher) and returns user details and signed token.
   */
  static async login(username: string, password: string) {
    const user = await db.user.findUnique({
      where: { username },
      include: {
        labAssignments: {
          include: { lab: true },
        },
      },
    });

    if (!user) {
      throw new Error("Invalid username or password");
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error("Invalid username or password");
    }

    const token = createSessionToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role as "ADMIN" | "TEACHER" | "AUDITOR",
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedLabs: user.labAssignments.map((a) => a.lab),
      },
      token,
    };
  }

  /**
   * Updates Admin/HOD unique ID and password.
   * Strictly enforces that only an ADMIN can update these credentials.
   */
  static async updateAdminCredentials(
    adminId: string,
    newUsername: string,
    newPassword?: string
  ) {
    const user = await db.user.findUnique({ where: { id: adminId } });
    if (!user || user.role !== "ADMIN") {
      throw new Error("Unauthorized: Only the Head of Department (Admin) can update admin credentials");
    }

    // Check if new username is taken by someone else
    if (newUsername !== user.username) {
      const existing = await db.user.findUnique({ where: { username: newUsername } });
      if (existing && existing.id !== adminId) {
        throw new Error("This login ID is already taken. Please choose another unique ID.");
      }
    }

    const updated = await db.user.update({
      where: { id: adminId },
      data: {
        username: newUsername,
        ...(newPassword ? { password: hashPassword(newPassword) } : {}),
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return updated;
  }

  /**
   * Assigns a teacher to a specific lab.
   * Strictly restricted to the Admin / Head of the Department.
   */
  static async assignTeacherToLab(hodUserId: string, teacherUserId: string, labId: string) {
    const hod = await db.user.findUnique({ where: { id: hodUserId } });
    if (!hod || hod.role !== "ADMIN") {
      throw new Error("Unauthorized: Only the Head of Department can assign teachers to laboratories");
    }

    const teacher = await db.user.findUnique({ where: { id: teacherUserId } });
    if (!teacher) throw new Error("Teacher user not found");

    const lab = await db.lab.findUnique({ where: { id: labId } });
    if (!lab) throw new Error("Target laboratory not found");

    const assignment = await db.labAssignment.upsert({
      where: {
        userId_labId: {
          userId: teacherUserId,
          labId,
        },
      },
      update: {
        assignedById: hodUserId,
        assignedAt: new Date(),
      },
      create: {
        userId: teacherUserId,
        labId,
        assignedById: hodUserId,
      },
      include: {
        user: true,
        lab: true,
      },
    });

    return assignment;
  }

  /**
   * Removes a teacher's authorization from a lab.
   */
  static async unassignTeacherFromLab(hodUserId: string, teacherUserId: string, labId: string) {
    const hod = await db.user.findUnique({ where: { id: hodUserId } });
    if (!hod || hod.role !== "ADMIN") {
      throw new Error("Unauthorized: Only the Head of Department can modify laboratory authorizations");
    }

    await db.labAssignment.deleteMany({
      where: {
        userId: teacherUserId,
        labId,
      },
    });

    return { success: true };
  }

  /**
   * Lists all faculty / teachers and their assigned laboratories.
   */
  static async listTeachersWithAssignments() {
    return await db.user.findMany({
      where: { role: { in: ["TEACHER", "ADMIN"] } },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        designation: true,
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
  }
}
