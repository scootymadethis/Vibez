const express = require("express");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");

const config = require("./src/config/env.js");

const app = express();
const PORT = config.port;

const publicDirectory = path.join(__dirname, "public");
const audioDirectory = path.join(__dirname, "audio-cache");

fs.mkdirSync(audioDirectory, {
  recursive: true,
});

app.use(express.json());
app.use(express.static(publicDirectory));

app.post("/api/prepare-audio", async (request, response) => {
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

  const audioId = crypto.randomUUID();

  const outputTemplate = path.join(audioDirectory, `${audioId}.%(ext)s`);

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
  let finished = false;

  child.stdout.on("data", (data) => {
    console.log(data.toString());
  });

  child.stderr.on("data", (data) => {
    const text = data.toString();

    errorOutput += text;
    console.error(text);
  });

  child.on("error", (error) => {
    if (finished) {
      return;
    }

    finished = true;
    console.error(error);
    response.status(500).json({
      error: "Cannot start yt-dlp.",
    });
  });

  child.on("close", (exitCode) => {
    if (finished) {
      return;
    }

    finished = true;
    if (exitCode !== 0) {
      console.error(errorOutput);
      return response.status(500).json({
        error: "Preparing audio failed.",
      });
    }

    const audioPath = path.join(audioDirectory, `${audioId}.mp3`);

    if (!fs.existsSync(audioPath)) {
      return response.status(500).json({
        error: "Audio file not found.",
      });
    }

    response.json({
      audioId,
    });
  });
});

app.get("/api/audio/:audioId", (request, response) => {
  const { audioId } = request.params;

  if (!isValidAudioId(audioId)) {
    return response.status(400).end();
  }

  const audioPath = path.join(audioDirectory, `${audioId}.mp3`);

  if (!fs.existsSync(audioPath)) {
    return response.status(404).end();
  }

  const fileStats = fs.statSync(audioPath);
  const fileSize = fileStats.size;

  const rangeHeader = request.headers.range;

  if (!rangeHeader) {
    response.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Content-Length": fileSize,
      "Accept-Ranges": "bytes",
      "Content-Disposition": "inline",
    });

    fs.createReadStream(audioPath).pipe(response);
    return;
  }

  const range = parseRange(rangeHeader, fileSize);

  if (!range) {
    response.writeHead(416, {
      "Content-Range": `bytes */${fileSize}`,
    });

    response.end();
    return;
  }

  const { start, end } = range;
  const chunkSize = end - start + 1;

  response.writeHead(206, {
    "Content-Type": "audio/mpeg",
    "Content-Length": chunkSize,
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Disposition": "inline",
    "Cache-Control": "private, no-store",
  });

  const audioStream = fs.createReadStream(audioPath, {
    start,
    end,
  });

  audioStream.pipe(response);
});

function isValidAudioId(value) {
  return /^[0-9a-f-]{36}$/i.test(value);
}

function parseRange(rangeHeader, fileSize) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);

  if (!match) {
    return null;
  }

  let start = match[1] ? Number.parseInt(match[1], 10) : 0;
  let end = match[2] ? Number.parseInt(match[2], 10) : fileSize - 1;

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    start < 0 ||
    end < start ||
    start >= fileSize
  ) {
    return null;
  }

  end = Math.min(end, fileSize - 1);
  return { start, end };
}

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
