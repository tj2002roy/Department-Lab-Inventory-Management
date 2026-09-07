import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { z } from "zod";

const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = LoginSchema.parse(body);

    const { user, token } = await AuthService.login(username, password);

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${user.name}`,
      token,
      data: user,
    });

    // Set secure HTTP-only cookie
    response.cookies.set("lab_auth_token", token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Invalid credentials" },
      { status: 401 }
    );
  }
}
