# Best Deal Finder Application

## Overview

This application helps users find the best deals for products across various online marketplaces. It provides a simple interface for users to enter their search queries and view a curated list of the top deals from Amazon SG, Shopee SG, and Lazada SG.

## Design and Features

### Visual Design

*   **Aesthetics:** The application will have a modern, clean, and visually balanced layout. It will use a vibrant color palette, expressive typography, and subtle textures to create a premium feel.
*   **Responsiveness:** The application will be fully responsive, adapting to different screen sizes for a seamless experience on both mobile and web.
*   **Interactivity:** Interactive elements like buttons and input fields will have a "glow" effect and drop shadows to provide a sense of depth and interactivity.

### Implemented Features

*   **Search Input:** A clear and encouraging search prompt for the user to enter product details.
*   **Live Web Scraping & Search:** A Node.js backend using Express, Axios, and Cheerio that scrapes real live data from Amazon SG, Shopee SG, Lazada SG, and Google Search based on user input. It pulls up to 10 results from e-commerce sites and the top 5 results from Google, falling back to mock data if bot protections are encountered.
*   **Top Results:** A display of the top deals found from the supported platforms.
*   **Modern Tech Stack:** The application is built using modern HTML, CSS (including container queries, cascade layers, and CSS variables), JavaScript (ES Modules, Web Components), and a Node.js backend.

## Current Plan

### Recent Implementation

1.  **Created a backend server (`server.js`):** Set up an Express server with `/search` endpoint to handle search queries.
2.  **Integrated scraping logic:** Implemented functions to scrape Amazon, Shopee, Lazada, and Google Search.
3.  **Updated Frontend (`main.js`):** Modified the `displaySearchResults` function to fetch data from the local backend API and render the combined top results from all sites.
