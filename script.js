// API Configuration
const API_KEY = '78a8b2343e0e5efcba0d181d99124873'; // Replace with your actual key
const CITIES = {
  Kolkata: { lat: 22.5726, lon: 88.3639 },
  Delhi: { lat: 28.6139, lon: 77.2090 },
  Mumbai: { lat: 19.0760, lon: 72.8777 },
  Bihar: { lat: 25.0961, lon: 85.3131 } // Using Patna as representative location
};

// DOM Elements
const tableBody = document.getElementById('aqi-table-body');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');

// Fetch AQI Data for a city
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

// Convert AQI number to Bootstrap badge color
function getAQIClass(aqi) {
  const classes = [
    'bg-success',    // 1 = Good
    'bg-info',       // 2 = Fair
    'bg-warning',    // 3 = Moderate
    'bg-danger',     // 4 = Poor
    'bg-dark'        // 5 = Very Poor
  ];
  return classes[aqi - 1] || 'bg-secondary';
}

// Render table row
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

// Load all data and update table
async function updateAQITable() {
  refreshBtn.disabled = true;
  refreshIcon.classList.remove('d-none');
  
  try {
    // Fetch data for all cities in parallel
    const promises = Object.entries(CITIES).map(async ([city, coord]) => {
      const data = await fetchAQIData(city, coord.lat, coord.lon);
      return { city, data };
    });
    
    const results = await Promise.all(promises);
    
    // Render table
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

// Event Listeners
refreshBtn.addEventListener('click', updateAQITable);

// Initial load
document.addEventListener('DOMContentLoaded', updateAQITable);



//for tiles

      // Configuration
     
      const CITY = {
        name: "Kolkata",
        lat: 22.5726,
        lon: 88.3639
      };
      const CAROUSEL_INTERVAL = 5000; // 5 seconds
    
      // Initialize Carousel with auto-cycling
      const weatherCarousel = document.getElementById('weatherCarousel');
      const carousel = new bootstrap.Carousel(weatherCarousel, {
        interval: CAROUSEL_INTERVAL,
        wrap: true,
        pause: 'hover' // Pause on hover
      });
    
      // Touch support for mobile
      weatherCarousel.addEventListener('touchstart', handleTouchStart);
      weatherCarousel.addEventListener('touchmove', handleTouchMove);
      
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
    
      // Refresh buttons functionality
      document.querySelectorAll('.refresh-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const cardType = this.getAttribute('data-type');
          refreshCardData(cardType, this);
        });
      });
    
      // Real API Integration with Error Handling
      async function refreshCardData(type, buttonElement = null) {
        try {
          // Show loading state
          if (buttonElement) {
            buttonElement.disabled = true;
            buttonElement.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Loading...`;
          }
    
          // Fetch weather data
          const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${CITY.lat}&lon=${CITY.lon}&units=metric&appid=${API_KEY}`
          );
          
          if (!weatherResponse.ok) throw new Error('Weather API failed');
          const weatherData = await weatherResponse.json();
    
          // Process data based on card type
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
          showError(type, error.message);
        } finally {
          if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.innerHTML = 'Refresh';
          }
        }
      }
    
      // Update specific card functions
      function updateTemperatureCard(data) {
        document.getElementById('min-temp').textContent = data.main.temp_min.toFixed(1);
        document.getElementById('max-temp').textContent = data.main.temp_max.toFixed(1);
        document.getElementById('feels-like').textContent = data.main.feels_like.toFixed(1);
      }
    
      function updateWindCard(data) {
        document.getElementById('wind-speed').textContent = data.wind.speed.toFixed(1);
        document.getElementById('wind-direction').textContent = data.wind.deg || 'N/A';
        document.getElementById('wind-gust').textContent = data.wind.gust ? data.wind.gust.toFixed(1) : 'N/A';
      }
    
      function updateDayCard(data) {
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        document.getElementById('sunrise').textContent = 
          new Date(data.sys.sunrise * 1000).toLocaleTimeString([], timeOptions);
        document.getElementById('sunset').textContent = 
          new Date(data.sys.sunset * 1000).toLocaleTimeString([], timeOptions);
        document.getElementById('humidity').textContent = data.main.humidity;
        document.getElementById('pressure').textContent = data.main.pressure;
      }
    
      function showError(type, message) {
        // Could implement more sophisticated error display
        console.log(`Error on ${type} card: ${message}`);
        // Example: display toast notification or card-specific error
      }
    
      // Initial load of all data
      document.addEventListener('DOMContentLoaded', () => {
        refreshCardData('temp');
        refreshCardData('wind');
        refreshCardData('day');
        
        // Set up auto-refresh every 5 minutes
        setInterval(() => {
          const activeIndex = document.querySelector('.carousel-indicators .active').getAttribute('data-bs-slide-to');
          const types = ['temp', 'wind', 'day'];
          refreshCardData(types[activeIndex]);
        }, 300000);
      });
    