const API_KEY = "AIzaSyA9NTkyJ1TP7t_TjX3YyrqmvNSl1WB7Qys";

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const resultsDiv = document.getElementById("results");
const messageDiv = document.getElementById("message");

searchBtn.addEventListener("click", searchVideos);

searchInput.addEventListener("keydown", function (event) {
    if(event.key === "Enter") {
        searchVideos();
    }
})

async function searchVideos() {
    const query = searchInput.value.trim();

    if(!query) {
        showMessage("You have to type something to search.", true);
        return;
    }

    showMessage("Search in progress...");
    resultsDiv.innerHTML = "";

    const params = new URLSearchParams({
        part: "snippet",
        q: query,
        type: "video",
        maxResults: "10",
        key: API_KEY
    });

    const url = `https://www.googleapis.com/youtube/v3/search?${params}`;

    try {
        const response = await fetch(url);
        
        if(!response.ok) {
            const errorData = await response.json();

            throw new Error(errorData.error?.message || "Error during search.");
        }

        const data = await response.json();

        if(!data.items || data.items.length === 0) {
            showMessage("No video found.");
            return;
        }

        showMessage("");
        displayVideos(data.items);
    } catch (error) {
        console.error(error);
        showMessage(error.message, true);
    }
}

function displayVideos(videos) {
    resultsDiv.innerHTML = "";

    videos.forEach(function (video) {
        const videoId = video.id.videoId;
        const title = video.snippet.title;
        const channelTitle = video.snippet.channelTitle;
        const description = video.snippet.description;
        const thumbnail = video.snippet.thumbnails.medium.url;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        const videoElement = document.createElement("div");
        videoElement.classList.add("video");

        videoElement.innerHTML = `
            <img src="${thumbnail}" alt="">
            <div>
                <h2></h2>
                <p class="channel"></p>
                <p class="description"></p>

                <a href="${videoUrl}" target="_blank" rel="noopener noreferrer">Watch on Youtube</a>
            </div>
        `;

        videoElement.querySelector("h2").textContent = title;
        videoElement.querySelector(".channel").textContent = `Channel: ${channelTitle}`;
        videoElement.querySelector(".description").textContent = description || "No description available.";

        resultsDiv.appendChild(videoElement);
    })
}

function showMessage(text, isError = false) {
    messageDiv.textContent = text;
    messageDiv.className = isError ? "error" : "";
}