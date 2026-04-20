"use client";

import { useState, useRef, useCallback } from "react";
import Head from "next/head";

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("请上传图片文件");
      return;
    }

    // 限制 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError("图片大小不能超过 10MB");
      return;
    }

    setError(null);
    setLoading(true);
    setProgress("正在上传并处理...");

    // 预览原图
    const reader = new FileReader();
    reader.onload = (e) => setOriginalImage(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("image_file", file);

      const response = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "处理失败");
      }

      setResultImage(data.data);
      setProgress("");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "处理失败，请重试");
      setProgress("");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processImage(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const downloadResult = () => {
    if (!resultImage) return;
    const a = document.createElement("a");
    a.href = resultImage;
    a.download = "removed-background.png";
    a.click();
  };

  const reset = () => {
    setOriginalImage(null);
    setResultImage(null);
    setError(null);
    setProgress("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <Head>
        <title>图片背景移除工具</title>
        <meta name="description" content="免费在线移除图片背景" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* 头部 */}
        <header className="py-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            🖼️ 图片背景移除工具
          </h1>
          <p className="text-slate-500">
            基于 AI 技术，快速移除图片背景
          </p>
        </header>

        {/* 主内容 */}
        <main className="max-w-3xl mx-auto px-4 pb-12">
          {!originalImage ? (
            /* 上传区域 */
            <div
              className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer ${
                dragOver
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-6xl mb-4">📤</div>
              <p className="text-lg font-medium text-slate-700 mb-2">
                拖拽图片到这里，或点击选择文件
              </p>
              <p className="text-sm text-slate-400">
                支持 PNG、JPG、WebP，最大 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            /* 预览 + 结果区域 */
            <div className="space-y-6">
              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* 原图 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 mb-3">原图</p>
                  <div className="relative rounded-xl overflow-hidden bg-checkerboard">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={originalImage}
                      alt="原图"
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                {/* 结果图 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-500 mb-3">
                    结果 {loading && "（处理中...）"}
                  </p>
                  <div className="relative rounded-xl overflow-hidden bg-checkerboard min-h-[200px] flex items-center justify-center">
                    {loading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-slate-400">{progress || "正在处理..."}</p>
                      </div>
                    ) : resultImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resultImage}
                        alt="结果"
                        className="w-full h-auto"
                      />
                    ) : (
                      <p className="text-slate-400">等待处理...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 justify-center flex-wrap">
                {resultImage && (
                  <button
                    onClick={downloadResult}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    ⬇️ 下载结果图片
                  </button>
                )}
                <button
                  onClick={reset}
                  className="px-6 py-3 bg-white text-slate-700 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  🔄 处理下一张图片
                </button>
              </div>
            </div>
          )}
        </main>

        {/* 页脚 */}
        <footer className="text-center text-sm text-slate-400 py-6">
          <p>使用 remove.bg API 提供支持</p>
        </footer>
      </div>
    </>
  );
}
