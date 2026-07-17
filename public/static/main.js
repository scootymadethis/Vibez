const downloadForm = document.getElementById("downloadForm");
const videoUrlInput = document.getElementById("videoUrl");
const downloadButton = document.getElementById("downloadButton");
const statusElement = document.getElementById("status");

downloadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const url = videoUrlInput.value.trim();

  if (!url) {
    showStatus("Insert an URL.", "error");
    return;
  }

  setLoading(true);
  showStatus("Downloading and processing...", "");

  try {
    const response = await fetch("/api/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error during download.");
    }

    const audioBlob = await response.blob();
    const temporaryUrl = URL.createObjectURL(audioBlob);
    const link = document.createElement("a");

    link.href = temporaryUrl;
    link.download = "audio.mp3";

    document.body.appendChild(link);

    link.click();
    link.remove();
    URL.revokeObjectURL(temporaryUrl);

    showStatus("Download completed.", "success");
  } catch (error) {
    console.error(error);
    showStatus(error.message, "error");
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  downloadButton.disabled = isLoading;
  videoUrlInput.disabled = isLoading;

  downloadButton.textContent = isLoading ? "Elaborating..." : "Download MP3";
}

function showStatus(message, type) {
  statusElement.textContent = message;
  statusElement.className = type;
}
