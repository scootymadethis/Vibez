const { spawn } = require("node:child_process");
const { createSpinner } = require("nanospinner");

const videoId = "rBU-Z59Ig_o";
const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

const spinner = createSpinner("Downloading video").start();

const args = [
  "--newline",
  "-f",
  "bestaudio/best",
  "--extract-audio",
  "--audio-format",
  "mp3",
  "--audio-quality",
  "0",
  "-o",
  "song-cache/%(title)s.%(ext)s",
  videoUrl,
];

const process = spawn("yt-dlp", args, {
  stdio: ["ignore", "pipe", "pipe"],
  shell: false,
});

process.stdout.on("data", (data) => {
  const message = data.toString().trim();

  if (message) {
    spinner.update({
      text: message,
    });
  }
});

process.stderr.on("data", (data) => {
  const message = data.toString().trim();

  if (message) {
    console.error(message);
  }
});

process.on("error", (error) => {
  spinner.error({
    text: "Unable to start yt-dlp",
  });

  console.error(error.message);
});

process.on("close", (exitCode) => {
  if (exitCode === 0) {
    spinner.success({
      text: "Download completed",
    });
  }
});
