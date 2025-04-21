// API Configuration
const API_KEY = '78a8b2343e0e5efcba0d181d99124873';
const CITIES = {
  Kolkata: { lat: 22.5726, lon: 88.3639 },
  Delhi: { lat: 28.6139, lon: 77.2090 },
  Mumbai: { lat: 19.0760, lon: 72.8777 },
  Bihar: { lat: 25.0961, lon: 85.3131 }
};

// DOM Elements
const tableBody = document.getElementById('aqi-table-body');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const cityInput = document.getElementById('city-input');
const aqiCard = document.getElementById('aqi-card');
const loadingElement = document.getElementById('loading');
const cityElement = document.getElementById('city');
const aqiElement = document.getElementById('aqi');
const pollutantElement = document.getElementById('pollutant');
const pollutantBars = document.getElementById('pollutant-bars');

// AQI Chart
let aqiChart;
const chartCtx = document.getElementById('aqi-chart')?.getContext('2d');

// Weather Carousel
const weatherCarousel = document.getElementById('weatherCarousel');
let carousel;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
  initWeatherCarousel();
  updateAQITable();
  refreshWeatherCards();
  
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lon } = pos.coords;
        fetchAndDisplayAQI(lat, lon);
        fetchForecastAQI(lat, lon);
      },
      err => {
        loadingElement.innerText = "Unable to access location.";
       // fetchAndDisplayAQI(CITIES.Kolkata.lat, CITIES.Kolkata.lon);
        fetchForecastAQI(CITIES.Kolkata.lat, CITIES.Kolkata.lon);
      },
      { enableHighAccuracy: true }
    );
  } else {
    loadingElement.innerText = "Geolocation not supported.";
   // fetchAndDisplayAQI(CITIES.Kolkata.lat, CITIES.Kolkata.lon);
    fetchForecastAQI(CITIES.Kolkata.lat, CITIES.Kolkata.lon);
  }
});

// Weather Carousel Functions
function initWeatherCarousel() {
  if (weatherCarousel) {
    carousel = new bootstrap.Carousel(weatherCarousel, {
      interval: 5000,
      wrap: true,
      pause: 'hover'
    });

    weatherCarousel.addEventListener('touchstart', handleTouchStart);
    weatherCarousel.addEventListener('touchmove', handleTouchMove);
  }
}

let touchStartX = 0;
function handleTouchStart(e) {
  touchStartX = e.touches[0].clientX;
}

function handleTouchMove(e) {
  if (!touchStartX) return;
  const touchEndX = e.touches[0].clientX;
  const diff = touchStartX - touchEndX;
  if (diff > 5) carousel.next();
  if (diff < -5) carousel.prev();
  touchStartX = 0;
}

// AQI Table Functions
async function updateAQITable() {
  if (!refreshBtn || !tableBody) return;

  refreshBtn.disabled = true;
  refreshIcon.classList.remove('d-none');
  
  try {
    const promises = Object.entries(CITIES).map(async ([city, coord]) => {
      const data = await fetchAQIData(city, coord.lat, coord.lon);
      return { city, data };
    });
    
    const results = await Promise.all(promises);
    
    tableBody.innerHTML = results.map(({ city, data }) => 
      renderCityRow(city, data)
    ).join('');
    
  } catch (error) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-danger py-4">
          Failed to load data. Please try again later.
        </td>
      </tr>
    `;
    console.error('Error updating AQI table:', error);
  } finally {
    refreshBtn.disabled = false;
    refreshIcon.classList.add('d-none');
  }
}

async function fetchAQIData(cityName, lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    return {
      ...data.list[0].components,
      aqi: data.list[0].main.aqi
    };
  } catch (error) {
    console.error(`Error fetching data for ${cityName}:`, error);
    return null;
  }
}

function renderCityRow(cityName, data) {
  if (!data) {
    return `
      <tr>
        <th scope="row" class="text-start">${cityName}</th>
        <td colspan="7" class="text-danger">Data unavailable</td>
      </tr>
    `;
  }

  return `
    <tr>
      <th scope="row" class="text-start">${cityName}</th>
      <td>${data.pm2_5.toFixed(1)}</td>
      <td>${data.pm10.toFixed(1)}</td>
      <td>${data.no2.toFixed(1)}</td>
      <td>${data.so2.toFixed(1)}</td>
      <td>${data.co.toFixed(1)}</td>
      <td>${data.o3.toFixed(1)}</td>
      <td><span class="badge ${getAQIClass(data.aqi)}">${data.aqi}</span></td>
    </tr>
  `;
}

// AQI Display Functions
function fetchAndDisplayAQI(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data.list?.length) {
        const { aqi } = data.list[0].main;
        const components = data.list[0].components;
        cityElement.innerText = `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
        aqiElement.innerText = getAQIDescription(aqi);
        pollutantElement.innerText = getDominantPollutant(components);
        aqiCard.className = `card ${getAQIClass(aqi)}`;
        aqiCard.style.display = 'block';
        loadingElement.style.display = 'none';
        displayPollutantBars(components);
      }
    }).catch(() => {
      loadingElement.innerText = "Error fetching AQI.";
    });
}

function fetchForecastAQI(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data.list?.length) {
        const labels = [], values = [];
        data.list.slice(0, 12).forEach(entry => {
          labels.push(new Date(entry.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          values.push(entry.main.aqi);
        });
        showAQIGraph(labels, values);
      }
    });
}

function showAQIGraph(labels, values) {
  if (!chartCtx) return;
  
  document.getElementById('aqi-chart').style.display = 'block';
  if (aqiChart) aqiChart.destroy();
  
  aqiChart = new Chart(chartCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Forecast AQI (Next 24 Hours)',
        data: values,
        borderColor: '#fff',
        backgroundColor: 'rgba(255,255,255,0.2)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      scales: {
        y: { 
          beginAtZero: true, 
          ticks: { color: '#fff' }, 
          title: { display: true, text: 'AQI Level', color: '#fff' } 
        },
        x: { ticks: { color: '#fff' } }
      },
      plugins: { legend: { labels: { color: '#fff' } } }
    }
  });
}

// Helper Functions
function getAQIDescription(aqi) {
  const levels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
  return `${aqi} (${levels[aqi - 1]})`;
}

function getAQIClass(aqi) {
  return ['aqi-good','aqi-fair','aqi-moderate','aqi-poor','aqi-very-poor'][aqi - 1] || '';
}

function getDominantPollutant(components) {
  let maxVal = 0, dominant = '';
  for (const key in components) {
    if (components[key] > maxVal) {
      maxVal = components[key];
      dominant = key;
    }
  }
  return `${dominant.toUpperCase()} (${maxVal.toFixed(2)})`;
}

function getPollutantColor(value) {
  if (value < 20) return "#009966";
  if (value < 50) return "#ffde33";
  if (value < 100) return "#ff9933";
  if (value < 150) return "#cc0033";
  return "#660099";
}

function displayPollutantBars(components) {
  if (!pollutantBars) return;
  
  pollutantBars.innerHTML = "";
  for (const key in components) {
    const value = components[key];
    const width = Math.min((value / 200) * 100, 100);
    const color = getPollutantColor(value);
    pollutantBars.innerHTML += `
      <div class="pollutant">
        <div class="label">${key.toUpperCase()}: ${value.toFixed(2)}</div>
        <div class="bar">
          <div class="bar-fill" style="width: ${width}%; background: ${color};"></div>
        </div>
      </div>
    `;
  }
}

// Weather Card Functions
function refreshWeatherCards() {
  refreshCardData('temp');
  refreshCardData('wind');
  refreshCardData('day');
  
  setInterval(() => {
    const activeIndex = document.querySelector('.carousel-indicators .active')?.getAttribute('data-bs-slide-to');
    if (activeIndex) {
      const types = ['temp', 'wind', 'day'];
      refreshCardData(types[activeIndex]);
    }
  }, 300000);
}

async function refreshCardData(type, buttonElement = null) {
  try {
    if (buttonElement) {
      buttonElement.disabled = true;
      buttonElement.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Loading...`;
    }

    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${CITIES.Kolkata.lat}&lon=${CITIES.Kolkata.lon}&units=metric&appid=${API_KEY}`
    );
    
    if (!weatherResponse.ok) throw new Error('Weather API failed');
    const weatherData = await weatherResponse.json();

    switch(type) {
      case 'temp':
        updateTemperatureCard(weatherData);
        break;
      case 'wind':
        updateWindCard(weatherData);
        break;
      case 'day':
        updateDayCard(weatherData);
        break;
    }

  } catch (error) {
    console.error(`Error updating ${type} card:`, error);
  } finally {
    if (buttonElement) {
      buttonElement.disabled = false;
      buttonElement.innerHTML = 'Refresh';
    }
  }
}

function updateTemperatureCard(data) {
  const minTemp = document.getElementById('min-temp');
  const maxTemp = document.getElementById('max-temp');
  const feelsLike = document.getElementById('feels-like');
  
  if (minTemp) minTemp.textContent = data.main.temp_min.toFixed(1);
  if (maxTemp) maxTemp.textContent = data.main.temp_max.toFixed(1);
  if (feelsLike) feelsLike.textContent = data.main.feels_like.toFixed(1);
}

function updateWindCard(data) {
  const windSpeed = document.getElementById('wind-speed');
  const windDirection = document.getElementById('wind-direction');
  const windGust = document.getElementById('wind-gust');
  
  if (windSpeed) windSpeed.textContent = data.wind.speed.toFixed(1);
  if (windDirection) windDirection.textContent = data.wind.deg || 'N/A';
  if (windGust) windGust.textContent = data.wind.gust ? data.wind.gust.toFixed(1) : 'N/A';
}

function updateDayCard(data) {
  const sunrise = document.getElementById('sunrise');
  const sunset = document.getElementById('sunset');
  const humidity = document.getElementById('humidity');
  const pressure = document.getElementById('pressure');
  
  if (sunrise || sunset) {
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    if (sunrise) sunrise.textContent = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], timeOptions);
    if (sunset) sunset.textContent = new Date(data.sys.sunset * 1000).toLocaleTimeString([], timeOptions);
  }
  if (humidity) humidity.textContent = data.main.humidity;
  if (pressure) pressure.textContent = data.main.pressure;
}

// City Search Function
function searchCity() {
  const city = cityInput.value.trim();
  if (city) {
    getCoordsByCity(city, (lat, lon, name) => {
      document.getElementById('location-name').innerText = name;
      fetchAndDisplayAQI(lat, lon);
      fetchForecastAQI(lat, lon);
    });
  }
}

function getCoordsByCity(city, callback) {
  fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data?.length) {
        const { lat, lon, name, country } = data[0];
        callback(lat, lon, `${name}, ${country}`);
      } else alert("City not found.");
    });
}

// Event Listeners
if (refreshBtn) {
  refreshBtn.addEventListener('click', updateAQITable);
}

document.querySelectorAll('.refresh-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const cardType = this.getAttribute('data-type');
    refreshCardData(cardType, this);
  });
});
// When you have the forecast data ready
const forecastData = {
  labels: labelsArray, // Your time labels
  values: valuesArray  // Your AQI values
};

localStorage.setItem('aqiForecastData', JSON.stringify(forecastData));
localStorage.setItem('locationName', 'Searched City Name'); // Or "My Location"