# Hotelbnb

Hotelbnb is a full-stack web application inspired by Airbnb, designed to facilitate the listing, discovery, and booking of accommodations. The platform allows users to create, manage, and explore various accommodations worldwide.

## Live Demo
Here is the demo of the project
https://hotelbnb-nj6a.onrender.com/listings


## Features
- User authentication (sign up, login, logout)
- CRUD operations for listings (create, update, delete, and view accommodations)
- Image uploads for listings
- Search and filter functionality
- Review and rating system
- Interactive maps using Leaflet
- Flash messages for user notifications
- Secure authentication with sessions

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript, EJS (Embedded JavaScript)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (MongoDB Atlas)
- **Authentication:** Passport.js
- **File Uploads:** Multer with Cloudinary storage
- **Geocoding & Maps:** OpenStreetMap with `node-geocoder` and Leaflet.js

## Installation

### Prerequisites
Ensure you have the following installed:
- Node.js
- MongoDB (or MongoDB Atlas account)

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/DEEP13-2-5/Hotelbnb.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Hotelbnb
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add the following environment variables:
     ```env
     DATABASE_URL=<your_mongodb_atlas_url>
     CLOUDINARY_CLOUD_NAME=<your_cloudinary_name>
     CLOUDINARY_API_KEY=<your_cloudinary_api_key>
     CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
     MAPBOX_TOKEN=<your_mapbox_token>
     ```
5. Start the application:
   ```bash
   npm start
   ```
6. Open your browser and navigate to `http://localhost:3000`.

## Usage
- Sign up or log in to create a new listing.
- Add images, location, and descriptions for accommodations.
- Search for listings by category or location.
- Leave reviews and ratings for accommodations.

## Folder Structure
```
Hotelbnb/
├── models/         # Mongoose models
├── routes/         # Express routes
├── views/          # EJS templates
├── public/         # Static assets (CSS, JS, images)
├── middleware/     # Custom middleware functions
├── cloudConfig.js  # Multer storage configuration
├── app.js          # Main Express application
└── package.json    # Project metadata and dependencies
```

## Deployment
To deploy the project:
1. Set up a MongoDB Atlas database.
2. Configure environment variables.
3. Deploy to a hosting service like **Render**
   
## Author
- **[DEEP13-2-5]**
- GitHub: [DEEP13-2-5](https://github.com/DEEP13-2-5)
