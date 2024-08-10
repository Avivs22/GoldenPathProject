GoldenPath Project
Getting Started
Open your terminal or command prompt.

Navigate to the directory containing the docker-compose.yml file.

Run the following command to start the project:

bash
docker-compose up -d 
Access the frontend at http://localhost:3000.
(Its will take a little time to run the frontend wait around 1-2 mins)

Features and Usage
Adding Drones:

On the left side of the website, you’ll find a box to input drone information.
Click "Add Drone" to place the drone on the map. The system will automatically identify the closest plane in the vicinity.
Hover over a plane on the map to view its details, including the time of collision in minutes.
Saving Data:

In the top-left corner of the website, use the "Save" option to save the current drones and planes in the area to the database.
In the top-left corner of the website, use the "Load" option to Load all of the data you saved in the database to the Map