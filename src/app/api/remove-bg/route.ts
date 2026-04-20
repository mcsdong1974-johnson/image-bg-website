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

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      let errorMessage = `API 请求失败: ${response.status}`;
      
      if (contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.errors?.[0]?.title || errorMessage;
      } else {
        const text = await response.text();
        console.error("Remove.bg API error (non-JSON):", response.status, text.slice(0, 200));
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // 检查返回类型
    if (!contentType.includes("image")) {
      const text = await response.text();
      console.error("Unexpected response type:", contentType, text.slice(0, 200));
      return NextResponse.json(
        { error: "收到意外响应格式，请重试" },
        { status: 500 }
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
