"use client";
import React, { useEffect, useState, useCallback,  } from "react";
import { toast } from "nextjs-toast-notify";
import "nextjs-toast-notify/dist/nextjs-toast-notify.css";
import debounce from "lodash/debounce";

const backgroundImage = {
  clearSky: "/clearsky.jpg",
  cloudy: "/cloudybackground.jpg",
  rain: "/rainbackground.jpg",
  snow: "/snowbackground.jpg",
  storm: "/thunderstorm.jpg",
  fog: "/fogbackground.jpg",
  night: "/night.jpg",
  smoke: "/smoke.jpg",
  haze: "/haze.jpg",
  overCast: "/overcast.jpg",
};

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    sea_level?: number;
    temp_max: number;
    temp_min: number;
  };
  weather: {
    description: string;
  }[];
}

const LocalWeather = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [city, setCity] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [bgImage, setBgImage] = useState<string>(backgroundImage.night);
  const [loading, setLoading] = useState<boolean>(false);
  const [citySelected, setCitySelected] = useState<boolean>(false);
  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY ?? '';

  const fetchWeatherData = async (cityToFetch: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityToFetch}&appid=${apiKey}&units=metric`
      );
      const data = await response.json();
      if (data.cod === 200) {
        setWeatherData(data);
        const weatherDescription = data.weather?.[0]?.description || "";
        
        if (weatherDescription.includes("clear")) setBgImage(backgroundImage.clearSky);
        else if (weatherDescription.includes("clouds")) setBgImage(backgroundImage.cloudy);
        else if (weatherDescription.includes("rain")) setBgImage(backgroundImage.rain);
        else if (weatherDescription.includes("snow")) setBgImage(backgroundImage.snow);
        else if (weatherDescription.includes("storm")) setBgImage(backgroundImage.storm);
        else if (weatherDescription.includes("fog")) setBgImage(backgroundImage.fog);
        else if (weatherDescription.includes("smoke")) setBgImage(backgroundImage.smoke);
        else if (weatherDescription.includes("haze")) setBgImage(backgroundImage.haze);
        else if (weatherDescription.includes("overcast clouds")) setBgImage(backgroundImage.overCast);
        else setBgImage(backgroundImage.night);
      } else {
        toast.error("City not found", { duration: 3000, position: "top-center" });
      }
    } catch (error) {
      toast.error("Failed to fetch weather data", { duration: 3000, position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

 
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || citySelected) return setSuggestions([]);
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/find?q=${query}&appid=${apiKey}`
        );
        const data = await response.json();
        if (data && data.list?.length > 0) {
          const cities = data.list.map((item: any) => item.name);
          setSuggestions(cities);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching suggestions", error);
      }
    }, 300),
    [apiKey, citySelected]
  );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCitySelected(false);
  };

  useEffect(() => {
    if (search && !citySelected) {
      fetchSuggestions(search);
    }
  }, [search, citySelected, fetchSuggestions]);

  const handleSearch = () => {
    if (search.trim()) {
      setCity(search);
      fetchWeatherData(search);
      setSuggestions([]);
      setCitySelected(true);
    } else {
      toast.error("Please enter a city name", { duration: 3000, position: "top-center" });
    }
  };

  const handleCitySelect = (suggestion: string) => {
    setCity(suggestion);
    setSearch(suggestion);
    setSuggestions([]);
    setCitySelected(true);
    fetchWeatherData(suggestion);
  };

  return (
    <div
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        padding: "20px",
        color: "white",
      }}
    >
      <div className="flex flex-col items-center w-full px-4 sm:px-8">
        <h1 className="text-2xl text-yellow-600 hover:animate-pulse font-bold bg-white bg-opacity-60 rounded-md p-2 mb-4">
          Weather Widget
        </h1>
        <input
          type="search"
          placeholder="Search by city name..."
          value={search}
          onChange={handleSearchChange}
          className="text-black outline-none rounded-lg shadow-md w-full max-w-md p-2"
          aria-label="city name"
        />
        {suggestions.length > 0 && !citySelected && (
          <ul className="bg-white text-black rounded-lg shadow-lg w-full max-w-md mt-2">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="p-2 cursor-pointer hover:bg-green-500 rounded-lg"
                onClick={() => handleCitySelect(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={handleSearch}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-blue-500 mt-4 w-full max-w-xs"
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center mt-10">
          <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
        </div>
      ) : weatherData ? (
        <div className="mt-10 bg-white bg-opacity-60 rounded-lg p-5 w-full max-w-3xl mx-auto">
          <h1 className="text-yellow-600 font-extrabold text-2xl">🌡️ Temperature</h1>
          <p className="text-yellow-600">- Current Temperature: {weatherData.main.temp}°C</p>
          <p className="text-yellow-600">- Feels Like: {weatherData.main.feels_like}°C</p>
          <p className="text-yellow-600">- Max: {weatherData.main.temp_max}°C</p>
          <p className="text-yellow-600">- Min: {weatherData.main.temp_min}°C</p>
          <p className="text-yellow-600">- Humidity: {weatherData.main.humidity}%</p>
          <p className="text-yellow-600">
            - Weather: {weatherData.weather[0]?.description || "N/A"}
          </p>
          {weatherData.main.sea_level && (
            <p className="text-yellow-600">- Sea Level: {weatherData.main.sea_level} hPa</p>
          )}
        </div>
      ) : (
        <p className="text-center mt-10 text-lg">No data available</p>
      )}
    </div>
  );
};

export default LocalWeather;
