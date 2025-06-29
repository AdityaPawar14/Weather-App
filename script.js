// Getting HTML elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");

const weatherContent = document.getElementById("weatherContent");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");

const cityNameEl = document.getElementById("currentCity");
const tempEl = document.getElementById("currentTemp");
const humidityEl = document.getElementById("currentHumidity");
const windEl = document.getElementById("currentWind");
const iconEl = document.getElementById("currentIcon");
const descEl = document.getElementById("currentDesc");

const forecastContainer = document.getElementById("forecastContainer");

const recentSearchesDiv = document.getElementById("recentSearches");
const recentList = document.getElementById("recentList");

// API key
const API_KEY = "9e6de9cf18b47aea65291bd2c1ec259b";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// Function to change background depending on time
function setTheme() {
  const hour = new Date().getHours();
  const body = document.getElementById("body");

  if (hour >= 6 && hour < 18) {
    body.className = "h-full flex flex-col bg-day-gradient";
  } else {
    body.className = "h-full flex flex-col bg-night-gradient";
  }
}

// Function to show error message
function showError(message) {
  errorText.textContent = message;
  errorMessage.classList.toggle("hidden", !message);
}

// Show current weather
function displayCurrentWeather(data) {
  const name = data.name;
  const temp = data.main.temp;
  const humidity = data.main.humidity;
  const wind = data.wind.speed;
  const icon = data.weather[0].icon;
  const description = data.weather[0].main;

  cityNameEl.textContent = name;
  tempEl.textContent = Math.round(temp) + "°C";
  humidityEl.textContent = humidity + "%";
  windEl.textContent = wind + " M/S";
  iconEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  descEl.textContent = description;

  weatherContent.classList.remove("hidden");
}

// Show 5-day forecast
function displayForecast(list) {
  forecastContainer.innerHTML = "";
  const datesShown = [];

  list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateString = date.toDateString();

    if (!datesShown.includes(dateString)) {
      datesShown.push(dateString);

      const card = document.createElement("div");
      card.className = "bg-gray-600 text-white p-3 m-2 rounded";
      card.innerHTML = `
        <h4>${dateString}</h4>
        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="icon">
        <p>Temp: ${Math.round(item.main.temp)}°C</p>
        <p>Humidity: ${item.main.humidity}%</p>
        <p>Wind: ${item.wind.speed} M/S</p>
      `;
      forecastContainer.appendChild(card);
    }

    if (datesShown.length >= 5) return;
  });
}

// Get weather using city name
async function fetchWeatherByCity(city) {
  try {
    showError("");

    const currentURL = `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`;
    const forecastURL = `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`;

    const currentRes = await fetch(currentURL);
    const forecastRes = await fetch(forecastURL);

    if (!currentRes.ok) {
      throw new Error("City not found");
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    displayCurrentWeather(currentData);
    displayForecast(forecastData.list);

    saveToLocalStorage(city);
    renderRecentSearches();
    recentSearchesDiv.classList.add("hidden"); // Hide dropdown
  } catch (error) {
    showError(error.message);
  }
}

// Get weather using location
function fetchWeatherByLocation() {
  if (!navigator.geolocation) {
    showError("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    try {
      showError("");

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const currentURL = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      const forecastURL = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

      const currentRes = await fetch(currentURL);
      const forecastRes = await fetch(forecastURL);

      const currentData = await currentRes.json();
      const forecastData = await forecastRes.json();

      displayCurrentWeather(currentData);
      displayForecast(forecastData.list);
    } catch (error) {
      showError("Could not fetch location weather");
    }
  });
}

// Save to localStorage
function saveToLocalStorage(city) {
  let cities = JSON.parse(localStorage.getItem("recentCities")) || [];
  city = city.toLowerCase();

  // Remove if already in list
  cities = cities.filter((c) => c !== city);
  cities.unshift(city); // Add to top

  // Only keep 5
  if (cities.length > 5) {
    cities.pop();
  }

  localStorage.setItem("recentCities", JSON.stringify(cities));
}

// Show recent cities
function renderRecentSearches() {
  let cities = JSON.parse(localStorage.getItem("recentCities")) || [];

  if (cities.length === 0) {
    recentSearchesDiv.classList.add("hidden");
    return;
  }

  recentList.innerHTML = "";

  cities.forEach((city) => {
    const li = document.createElement("li");
    li.className = "cursor-pointer text-blue-600 hover:underline";
    li.textContent = city;

    li.addEventListener("click", (e) => {
      e.stopPropagation();
      cityInput.value = city;
      fetchWeatherByCity(city);
    });

    recentList.appendChild(li);
  });

  recentSearchesDiv.classList.remove("hidden");
}

// Start the web
function initWeatherApp() {
  setTheme();
  renderRecentSearches();

  // When Search button clicked
  searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (!city) {
      showError("Please enter a city name");
      return;
    }
    fetchWeatherByCity(city);
  });

  // When Enter key pressed
  cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const city = cityInput.value.trim();
      if (!city) {
        showError("Please enter a city name");
        return;
      }
      fetchWeatherByCity(city);
    }
  });

  // When location button clicked
  locationBtn.addEventListener("click", fetchWeatherByLocation);

  // Show dropdown when user clicks input
  cityInput.addEventListener("focus", () => {
    if (recentList.childElementCount > 0) {
      recentSearchesDiv.classList.remove("hidden");
    }
  });

  // Hide dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!recentSearchesDiv.contains(e.target) && e.target !== cityInput) {
      recentSearchesDiv.classList.add("hidden");
    }
  });
}

// Run web when page loads
document.addEventListener("DOMContentLoaded", initWeatherApp);
