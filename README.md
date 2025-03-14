# Social Media Surge Detection Microservice

A robust Node.js microservice for advanced social media surge detection, delivering real-time analytics and intelligent notification management across multiple social media handles.

## Features

- Real-time surge detection for hidden replies
- Configurable alert thresholds and cooldown periods
- Email notifications via SendGrid
- Throughput metrics and analytics
- RESTful API endpoints
- PostgreSQL database integration

## Prerequisites

- Node.js v20 or higher
- PostgreSQL database
- SendGrid API key for email notifications

## Environment Variables

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
SENDGRID_API_KEY=your_sendgrid_api_key
```

## API Documentation

### Base URL
```
https://your-domain.com
```

For detailed API documentation, see [API_DOCS.md](API_DOCS.md)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/surge-alert-system.git
cd surge-alert-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the server:
```bash
npm start
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
