import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { getAuthenticatedUser } from "@/lib/auth";
import { z } from "zod";

const UpdateCredentialsSchema = z.object({
  newUsername: z.string().min(3, "Username must be at least 3 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
});

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
    const { newUsername, newPassword } = UpdateCredentialsSchema.parse(body);

    const updated = await AuthService.updateAdminCredentials(
      user.id,
      newUsername,
      newPassword
    );

    return NextResponse.json({
      success: true,
      message: "Admin credentials successfully updated",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
