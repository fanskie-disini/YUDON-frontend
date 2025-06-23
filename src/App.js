import React, { useState, useEffect } from "react";
import {
  Download,
  Video,
  List,
  PlayCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Music,
} from "lucide-react";

const YouTubeDownloader = () => {
  const [activeTab, setActiveTab] = useState("single");
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState("720p");
  const [format, setFormat] = useState("mp4");
  const [isLoading, setIsLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [videoInfo, setVideoInfo] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [filename, setFilename] = useState("");

  // API Base URL - production ready
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  // Reset quality when format changes
  useEffect(() => {
    if (format === "mp3" || format === "m4a") {
      setQuality("128kbps");
    } else {
      setQuality("720p");
    }
  }, [format]);

  const getVideoInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const info = await response.json();
        setVideoInfo(info);
      }
    } catch (error) {
      console.error("Error getting video info:", error);
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) {
      setDownloadStatus("error");
      return;
    }

    setIsLoading(true);
    setDownloadStatus("processing");
    setProgress(0);
    setDownloadUrl(null);

    try {
      const endpoint =
        activeTab === "single"
          ? `${API_BASE_URL}/api/download`
          : `${API_BASE_URL}/api/download-playlist`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          quality,
          format,
          type: activeTab,
        }),
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));

              if (data.progress) {
                setProgress(data.progress);
              }

              if (data.status === "complete") {
                setDownloadStatus("complete");
                setDownloadUrl(data.downloadUrl);
                setFilename(data.filename);
                setIsLoading(false);
              } else if (data.status === "error") {
                setDownloadStatus("error");
                setIsLoading(false);
                console.error("Download error:", data.message);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Download error:", error);
      setDownloadStatus("error");
      setIsLoading(false);
    }
  };

  const resetStatus = () => {
    setDownloadStatus("");
    setProgress(0);
    setUrl("");
    setVideoInfo(null);
    setDownloadUrl(null);
    setFilename("");
  };

  const getStatusIcon = () => {
    switch (downloadStatus) {
      case "processing":
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case "complete":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (downloadStatus) {
      case "processing":
        return activeTab === "single"
          ? "Mengunduh video..."
          : "Mengunduh playlist...";
      case "complete":
        return activeTab === "single"
          ? "Video berhasil diunduh!"
          : "Playlist berhasil diunduh!";
      case "error":
        return "URL tidak valid atau terjadi kesalahan";
      default:
        return "";
    }
  };

  const getQualityOptions = () => {
    if (format === "mp3" || format === "m4a") {
      return (
        <>
          <option value="320kbps">320 kbps (Tertinggi)</option>
          <option value="192kbps">192 kbps (Tinggi)</option>
          <option value="128kbps">128 kbps (Standard)</option>
          <option value="96kbps">96 kbps (Rendah)</option>
        </>
      );
    } else {
      return (
        <>
          <option value="1080p">1080p (Full HD)</option>
          <option value="720p">720p (HD)</option>
          <option value="480p">480p (SD)</option>
          <option value="360p">360p</option>
        </>
      );
    }
  };

  const getFormatIcon = () => {
    if (format === "mp3" || format === "m4a") {
      return <Music className="w-5 h-5 text-purple-600" />;
    }
    return <Video className="w-5 h-5 text-red-600" />;
  };

  const isAudioFormat = format === "mp3" || format === "m4a";

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-600 p-3 rounded-full mr-3">
              <Download className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">
              YouTube Downloader
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Download video atau playlist YouTube dengan mudah dan cepat
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("single")}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-300 ${
                activeTab === "single"
                  ? "bg-red-600 text-white border-b-4 border-red-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Video className="w-5 h-5 inline mr-2" />
              Single Video
            </button>
            <button
              onClick={() => setActiveTab("playlist")}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-300 ${
                activeTab === "playlist"
                  ? "bg-red-600 text-white border-b-4 border-red-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List className="w-5 h-5 inline mr-2" />
              Playlist
            </button>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {/* URL Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {activeTab === "single"
                  ? "URL Video YouTube"
                  : "URL Playlist YouTube"}
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={getVideoInfo}
                  placeholder={
                    activeTab === "single"
                      ? "https://www.youtube.com/watch?v=..."
                      : "https://www.youtube.com/playlist?list=..."
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all duration-300"
                />
                <PlayCircle className="absolute right-3 top-3 w-6 h-6 text-gray-400" />
              </div>
            </div>

            {/* Video Info Display */}
            {videoInfo && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-4">
                  {videoInfo.thumbnail && (
                    <img
                      src={videoInfo.thumbnail}
                      alt="Video thumbnail"
                      className="w-24 h-18 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {videoInfo.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      By {videoInfo.author}
                    </p>
                    <p className="text-sm text-gray-500">
                      Duration: {Math.floor(videoInfo.duration / 60)}:
                      {(videoInfo.duration % 60).toString().padStart(2, "0")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    {getFormatIcon()}
                    <span className="ml-2">Format</span>
                  </div>
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all duration-300"
                >
                  <option value="mp4">MP4 (Video)</option>
                  <option value="webm">WebM (Video)</option>
                  <option value="mp3">MP3 (Audio)</option>
                  <option value="m4a">M4A (Audio)</option>
                </select>
              </div>

              {/* Quality Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isAudioFormat ? "Kualitas Audio" : "Kualitas Video"}
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all duration-300"
                >
                  {getQualityOptions()}
                </select>
              </div>
            </div>

            {/* Format Info */}
            <div
              className={`mb-6 p-3 rounded-lg ${isAudioFormat ? "bg-purple-50 border border-purple-200" : "bg-red-50 border border-red-200"}`}
            >
              <div className="flex items-center text-sm">
                {getFormatIcon()}
                <span
                  className={`ml-2 font-medium ${isAudioFormat ? "text-purple-700" : "text-red-700"}`}
                >
                  {isAudioFormat
                    ? `Format audio ${format.toUpperCase()} dengan kualitas ${quality}`
                    : `Format video ${format.toUpperCase()} dengan resolusi ${quality}`}
                </span>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isLoading || !url.trim()}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 ${
                isLoading || !url.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Download className="w-5 h-5 mr-2" />
                  {activeTab === "single"
                    ? `Download ${isAudioFormat ? "Audio" : "Video"}`
                    : "Download Playlist"}
                </div>
              )}
            </button>

            {/* Progress Bar */}
            {downloadStatus === "processing" && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Status Message */}
            {downloadStatus && (
              <div
                className={`mt-6 p-4 rounded-lg flex items-center ${
                  downloadStatus === "complete"
                    ? "bg-green-50 border border-green-200"
                    : downloadStatus === "error"
                      ? "bg-red-50 border border-red-200"
                      : "bg-blue-50 border border-blue-200"
                }`}
              >
                {getStatusIcon()}
                <span
                  className={`ml-2 font-medium ${
                    downloadStatus === "complete"
                      ? "text-green-700"
                      : downloadStatus === "error"
                        ? "text-red-700"
                        : "text-blue-700"
                  }`}
                >
                  {getStatusMessage()}
                </span>
                {downloadStatus === "complete" && downloadUrl && (
                  <div className="ml-auto flex space-x-2">
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={downloadUrl}
                      download={filename}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Download File
                    </a>
                    <button
                      onClick={resetStatus}
                      className="text-green-600 hover:text-green-800 font-medium px-4 py-2"
                    >
                      Download Lagi
                    </button>
                  </div>
                )}
                {downloadStatus === "complete" && !downloadUrl && (
                  <button
                    onClick={resetStatus}
                    className="ml-auto text-green-600 hover:text-green-800 font-medium"
                  >
                    Download Lagi
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <Video className="w-10 h-10 text-red-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Video Download</h3>
            <p className="text-gray-600">
              Download video YouTube dengan berbagai pilihan kualitas dari 360p
              hingga 1080p.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <Music className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Audio Download</h3>
            <p className="text-gray-600">
              Ekstrak audio dari video YouTube dalam format MP3 atau M4A dengan
              kualitas tinggi.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <List className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Playlist Support</h3>
            <p className="text-gray-600">
              Download seluruh playlist YouTube sekaligus dengan pengaturan yang
              sama.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p>
            © 2025 YUDON. Gunakan dengan bijak dan hormati hak
            cipta.
          </p>
        </div>
      </div>
    </div>
  );
};

export default YouTubeDownloader;
