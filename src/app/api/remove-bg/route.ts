import { NextRequest, NextResponse } from "next/server";

const REMOVE_BG_API_KEY = "ftdZ8BchgCTAjZJDzgNvT4JK";
const REMOVE_BG_API_URL = "https://api.remove.bg/v1.0/removebg";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image_file") as File | null;
    const imageUrl = formData.get("image_url") as string | null;

    if (!imageFile && !imageUrl) {
      return NextResponse.json(
        { error: "请提供图片文件或图片URL" },
        { status: 400 }
      );
    }

    const formDataToSend = new FormData();
    formDataToSend.append("size", "auto");
    formDataToSend.append("output_format", "png");

    if (imageFile) {
      formDataToSend.append("image_file", imageFile);
    } else if (imageUrl) {
      formDataToSend.append("image_url", imageUrl);
    }

    const response = await fetch(REMOVE_BG_API_URL, {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVE_BG_API_KEY,
      },
      body: formDataToSend,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Remove.bg API error:", response.status, errorText);
      return NextResponse.json(
        { error: `API 请求失败: ${response.status}` },
        { status: response.status }
      );
    }

    // 返回 PNG 图片
    const resultBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(resultBuffer).toString("base64");

    return NextResponse.json({
      success: true,
      data: `data:image/png;base64,${base64}`,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "服务器错误，请重试" },
      { status: 500 }
    );
  }
}
