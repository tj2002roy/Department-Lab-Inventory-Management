import { NextRequest, NextResponse } from "next/server";
import { ItemService } from "@/services/item.service";
import { CreateItemSchema } from "@/lib/validations";
import { getAuthenticatedUser, canModifyLab } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const labId = searchParams.get("labId") || undefined;
    const standaloneOnly = searchParams.get("standaloneOnly") === "true";

    const items = await ItemService.listItems({ labId, standaloneOnly });
    return NextResponse.json({ success: true, data: items });
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
    const body = await request.json();
    const validated = CreateItemSchema.parse(body);

    // If authenticated user exists, enforce that they have authorization for this lab
    if (authUser && !canModifyLab(authUser, validated.labId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Access Denied: You are not authorized to register instruments in this laboratory. Authorization is managed exclusively by the Head of Department (Admin).",
        },
        { status: 403 }
      );
    }

    const item = await ItemService.createItem({
      ...validated,
      userId: authUser?.id || validated.userId,
    });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
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
