import { NextRequest, NextResponse } from "next/server";
import { SystemService } from "@/services/system.service";
import { CreateSystemSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const labId = searchParams.get("labId") || undefined;

    const systems = await SystemService.listSystems(labId);
    return NextResponse.json({ success: true, data: systems });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateSystemSchema.parse(body);

    const system = await SystemService.createSystemWithItems(validated);
    return NextResponse.json({ success: true, data: system }, { status: 201 });
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
