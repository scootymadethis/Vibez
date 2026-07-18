const form = document.getElementById("audioForm");
const videoUrlInput = document.getElementById("videoUrl");
const playButton = document.getElementById("playButton");
const statusElement = document.getElementById("status");
const audioPlayer = document.getElementById("audioPlayer");
const loadingIndicator = document.getElementById("loadingIndicator");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const url = videoUrlInput.value.trim();

  if (!url) {
    showStatus("Insert an URL.");
    return;
  }

  setLoading(true);
  showStatus("Preparing audio...");

  try {
    const response = await fetch("/api/prepare-audio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to prepare audio.");
    }

    audioPlayer.pause();
    audioPlayer.src = "";

    audioPlayer.src = `/api/audio/${data.audioId}`;
    audioPlayer.hidden = false;

    await audioPlayer.play();

    showStatus("Song started.", "success");
  } catch (error) {
    console.error(error);
    showStatus(error.message, "error");
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  loadingIndicator.hidden = !isLoading;
  playButton.disabled = isLoading;
  videoUrlInput.disabled = isLoading;

  playButton.textContent = isLoading ? "Preparing..." : "Listen";
}

function showStatus(message, type = "") {
  statusElement.textContent = message;
  statusElement.className = type;
}
