# Social Media Surge Detection Service

A Node.js microservice for monitoring social media activity and detecting engagement surges in real-time. This service helps track social media handles, analyze engagement patterns, and alert stakeholders when unusual activity spikes occur.

## Features

- 📊 Real-time social media activity monitoring
- 🔍 Intelligent surge detection algorithms
- 📈 Comprehensive analytics dashboard
- ⚡ Configurable alert thresholds
- 📧 Email notifications via SendGrid
- 🔒 Secure PostgreSQL data storage
- 📝 Detailed activity logging
- ✅ Extensive test coverage

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Testing**: Jest with Supertest
- **Logging**: Winston
- **Email**: SendGrid
- **Security**: Helmet middleware

## Project Structure

```
├── src/
│   ├── app.js           # Express application setup
│   ├── server.js        # Application entry point
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/      # Custom middleware
│   └── config/          # Configuration files
├── tests/               # Test suites
└── logs/               # Application logs
```

## API Endpoints

### Health Check
```
GET /
Response: 200 OK
{
  "status": "healthy",
  "timestamp": "2025-03-14T12:00:00Z"
}
```

### Store New Replies
```
POST /api/replies
Body: {
  "handle": "string",
  "content": "string",
  "timestamp": "string"
}
Response: 201 Created
```

### Get Handle Replies
```
GET /api/handles/:handle/replies
Response: 200 OK
[
  {
    "id": "string",
    "content": "string",
    "timestamp": "string"
  }
]
```

### Configure Surge Alerts
```
POST /api/surge-alert/:handle/config
Body: {
  "threshold": number,
  "timeWindow": number,
  "notificationEmail": "string"
}
Response: 201 Created
```

### Get Throughput Metrics
```
GET /api/surge-alert/throughput/:handle
Response: 200 OK
{
  "current": number,
  "average": number,
  "peak": number
}
```

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd social-media-surge-detection
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file with the following variables:
   ```
   # Database
   DATABASE_URL=postgresql://user:password@host:5432/dbname

   # SendGrid
   SENDGRID_API_KEY=your_sendgrid_api_key

   # Application
   NODE_ENV=development
   PORT=5000
   LOG_LEVEL=debug
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start the Application**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Testing

Run the test suite:
```bash
# Unit tests
npm test

# Coverage report
npm run test:coverage
```

## Development Guidelines

1. **Code Style**
   - Follow the ESLint configuration
   - Use async/await for asynchronous operations
   - Write JSDoc comments for functions

2. **Git Workflow**
   - Create feature branches from `main`
   - Use conventional commits
   - Submit PRs for review

3. **Testing Requirements**
   - Write unit tests for new features
   - Maintain >80% code coverage
   - Include integration tests for API endpoints

## Monitoring and Logs

- Application logs are stored in `./logs/`
- Use Winston logger for consistency
- Log levels: error, warn, info, debug

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your fork
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details