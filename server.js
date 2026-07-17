const express = require("express");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");

const app = express();
const PORT = 3000;

const publicDirectory = path.join(__dirname, "public");
const downloadsDirectory = path.join(__dirname, "downloads");

fs.mkdirSync(downloadsDirectory, {
  recursive: true,
});

app.use(express.json());
app.use(express.static(publicDirectory));

app.post("/api/download", async (request, response) => {
  const { url } = request.body;

  if (!url || typeof url !== "string") {
    return response.status(400).json({
      error: "You have to insert an URL.",
    });
  }

  if (!isAllowedYoutubeUrl(url)) {
    return response.status(400).json({
      error: "Insert a valid Youtube URL.",
    });
  }

  const jobId = crypto.randomUUID();

  const outputTemplate = path.join(downloadsDirectory, `${jobId}.%(ext)s`);

  const argumentsList = [
    "--no-playlist",
    "--extract-audio",
    "--audio-format",
    "mp3",
    "--audio-quality",
    "0",
    "--output",
    outputTemplate,
    url,
  ];

  console.log("Starting download:", url);

  const child = spawn("yt-dlp", argumentsList, {
    shell: false,
  });

  let errorOutput = "";

  child.stdout.on("data", (data) => {
    console.log(data.toString());
  });

  child.stderr.on("data", (data) => {
    const text = data.toString();

    errorOutput += text;
    console.error(text);
  });

  child.on("error", (error) => {
    console.error("Error starting yt-dlp:", error);

    if (!response.headersSent) {
      response.status(500).json({
        error: "I cannot start yt-dlp. Check that it is installed and on PATH.",
      });
    }
  });

  child.on("close", (exitCode) => {
    if (exitCode !== 0) {
      return response.status(500).json({
        error: "Download failed.",
        details: errorOutput,
      });
    }

    const mp3Path = path.join(downloadsDirectory, `${jobId}.mp3`);

    if (!fs.existsSync(mp3Path)) {
      return response.status(500).json({
        error: "yt-dlp has finished, but the MP3 file doesn't exist.",
      });
    }

    response.download(mp3Path, "audio.mp3", (error) => {
      if (error) {
        console.error("Error during the file download:", error);
      }

      fs.rm(mp3Path, { force: true }, (removeError) => {
        if (removeError) {
          console.error("Error deleting file:", removeError);
        }
      });
    });
  });
});

function isAllowedYoutubeUrl(value) {
  try {
    const parsedUrl = new URL(value);

    const allowedHosts = new Set([
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
      "music.youtube.com",
    ]);

    return (
      parsedUrl.protocol === "https:" && allowedHosts.has(parsedUrl.hostname)
    );
  } catch {
    return false;
  }
}

app.listen(PORT, () => {
  console.log(`Server launched on http://localhost:${PORT}`);
});
