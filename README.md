# Share Reward Service

## Overview

This project is a backend service for a financial company. It rewards new customers with a free share when they sign up. The service is designed to handle stock selection based on predefined value distributions, ensuring cost-effective customer acquisition.

## Features

- User eligibility check for reward claiming.
- Random stock selection based on configurable value distributions.
- The endpoint return information about which stock the user has been given, even though the buy order may still be pending.
- Integration with a mock Broker API for stock functionalities.
- SQLite database for storing user data and CPA tracking.
- Redis for caching purposes.
- .env is used to store environment variables. For simplicity, this file is not encrypted and will be uploaded to github and it doesn't have any sensitive data. In real world, the .env file should be included in the .gitignore file.

## CPA Implementation

The service implements a Cost Per Acquisition (CPA) adjustment mechanism. This feature dynamically adjusts the distribution of stock rewards based on the current and target CPA values, ensuring the average cost per new customer remains under control.

## Assumptions

In the development of this project, several assumptions have been made to guide the design and implementation:

1. **Mock Broker API**: The Broker API used in the project is a mock version, assumed to be reliable and performant without simulating all possible real-world failures.
2. **Market Dynamics**: Simplified treatment of complex stock market dynamics such as real-time price fluctuations, stock delistings, and liquidity issues. Redis is utilized to retrieve stock information from Broker API periodically to keep the update to date data.
3. **User Behavior**: Only one free stock is allowed to claim for each user. It's assumed that user interactions are straightforward without other advanced technique to exploit potential system vulnerabilities, such as DoS and other malicious actions.
4. **Data Persistence**: The project uses SQLite for data storage and redis for caching. This choice assumes a lightweight and simple deployment. In the real world, we might need to consider using other databases and strageties to hanle different senarios.
5. **Performance Expectations**: The system is designed for a moderate load. High traffic and data-intensive operations aren't primary considerations in the current implementation.
6. Test covers most cases for core fuctionality, including share claim, user eligibility, CPA adjustment correctness and integration test. More tests are needed to cover more edge cases and more complicated senarios in real world application.
7. .env file is not encrypted since this is not a real world application. In real practice, we would like to 

## Future Optimizations

Looking ahead, there are several areas identified for potential improvements and optimizations:

1. **Database Migration**: Migrate from SQLite to a more robust database solution like PostgreSQL,to better handle scalability and complex queries.
2. **Real-Time Data Handling**: Integrate real-time data feeds for stock prices to handle market dynamics more accurately and support more complex trading scenarios.
3. **Robust Error Handling**: Implement comprehensive error handling and logging mechanisms, especially for the Broker API interactions and database operations.
4. **Security Enhancements**: Strengthen the system's security to prevent potential misuse or exploitation, such as adding rate limiting and more robust authentication mechanisms.
5. **Performance Optimization**: Optimize the application for high performance and scalability, potentially by caching frequently accessed data and optimizing database queries.
6. **User Experience Improvements**: Enhance the user interface and experience, providing more feedback and options during the stock claiming process.
7. **Automated Testing and CI/CD**: Set up a full suite of automated tests and a CI/CD pipeline to ensure code quality and streamline the deployment process.

These optimizations aim to enhance the application's scalability, reliability, and user experience, preparing it for a more extensive and demanding production environment.


## Local Setup

### Prerequisites

- Node.js (v20)
- Redis server installed locally (for caching)

### Steps to Run Locally

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   ```
2. **Clone the Repository**
   ```bash
   cd sharerewardservice
   ```
3. **Install Dependencies**
   ```bash
   npm install
   ```
4. **Start the Application**
   ```bash
   npm start
   ```
-  The application will start on localhost:3000
-  You can use below command to POST the request to endpoint
   ```bash
   curl -X POST http://localhost:3000/claim-free-share -H "Content-Type: application/json" -d '{"userId": 1}'
   ```
5. **Running test**
   ```bash
   npm test
   ```
6. **Check data in SQLite3 database**
   ```bash
   sqlite3 data/db.sqlite
   .table
   select * from user;
   ```

## Docker Solution

We also provide a Docker-based solution for easy setup and deployment. However, there's a known issue with installing SQLite in the Docker environment due to a known issue.

```bash
Dockerfile
docker-compose.yml
```

### Known Docker Issue with SQLite

The SQLite database faces challenges with native dependencies in Docker, which may cause difficulties in running the service in a container. You can find this issue all around the Internet.

### Proposed Redis Workaround

As a workaround, we suggest using Redis for full data storage. This adjustment requires refactoring the data access layer to use Redis for storing and retrieving user data and CPA tracking information. This workaround could be provided upon requirement.

### Running with Docker

To run the service along with Redis in Docker:

```bash
docker-compose up --build
```


   

