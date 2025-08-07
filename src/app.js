const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('./config/config');
const logger = require('./utils/logger');
const { auth } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Routes
const analysisRoutes = require('./routes/analysis');
const healthRoutes = require('./routes/health');

const app = express();

// Security middleware
app.use(helmet());

// Enhanced CORS configuration for PHP frontend
const corsOptions = {
  origin: [
    'http://localhost',
    'http://localhost:80',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8000',
    'http://localhost:8080',
    'http://127.0.0.1',
    'http://127.0.0.1:80',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:8080',
    'https://www.marketanalyticx.com',
    'https://marketanalyticx.com',
    'http://www.marketanalyticx.com',
    'http://marketanalyticx.com',    // Replace with your actual domain
    'null' // For file:// protocol during development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'User-Agent', 'Accept'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Additional CORS headers for PHP compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (corsOptions.origin.includes(origin) || corsOptions.origin.includes('null')) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, User-Agent, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    logger.info('CORS preflight request handled', {
      origin: req.headers.origin,
      method: req.headers['access-control-request-method'],
      headers: req.headers['access-control-request-headers']
    });
    res.sendStatus(200);
  } else {
    next();
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/api/health'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    origin: req.get('Origin'),
    referer: req.get('Referer'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    authorization: req.get('Authorization') ? 'Bearer ***' : 'None',
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
    queryParams: Object.keys(req.query).length > 0 ? req.query : 'None'
  });

  // Log response when request completes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`Response ${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  });

  next();
});

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.requestId = require('uuid').v4().split('-')[0];
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/analysis', auth, analysisRoutes);

// Root endpoint with enhanced information
app.get('/', (req, res) => {
  res.json({
    service: 'Geo Analysis Service',
    version: '2.0.0',
    description: 'AI/LLM Brand Visibility Analysis with Claude AI',
    aiProvider: 'Anthropic Claude',
    status: 'operational',
    timestamp: new Date().toISOString(),
    server: {
      nodeVersion: process.version,
      environment: config.nodeEnv,
      port: config.port,
      uptime: `${Math.floor(process.uptime())}s`
    },
    features: {
      brandFolders: 'Each brand gets its own folder for organized storage',
      comprehensiveAnalysis: '6,000-8,000 word detailed reports',
      formDataIntegration: 'Client-specified competitors, topics, prompts, personas',
      aiGeneration: 'Auto-generation of missing analysis components',
      fullTextResponse: 'Complete analysis text returned for UI display',
      cors: 'Configured for PHP frontend integration'
    },
    fileLocation: config.reportsDir,
    endpoints: {
      health: 'GET /api/health - Service health check',
      analyze: 'POST /api/analysis/comprehensive - Comprehensive brand analysis',
      legacy: 'POST /api/analysis - Legacy brand analysis',
      files: 'GET /api/analysis/files - List saved files',
      download: 'GET /api/analysis/files/:fileName/download - Download file',
      statistics: 'GET /api/analysis/statistics - Service stats',
      help: 'GET /api/analysis/help - API documentation'
    },
    authentication: {
      method: 'Bearer Token',
      header: 'Authorization: Bearer YOUR_API_KEY',
      alternative: 'x-api-key: YOUR_API_KEY'
    },
    usage: {
      phpExample: `
// PHP Example
$data = [
    'brandName' => 'Your Brand',
    'websiteUrl' => 'https://yourbrand.com',
    'email' => 'contact@yourbrand.com',
    'competitors' => ['Competitor1', 'Competitor2'],
    'topics' => ['Topic1', 'Topic2'],
    'prompts' => ['Prompt1', 'Prompt2'],
    'personas' => 'Your target personas description'
];

$options = [
    'http' => [
        'header' => [
            'Content-Type: application/json',
            'Authorization: Bearer YOUR_API_KEY'
        ],
        'method' => 'POST',
        'content' => json_encode($data)
    ]
];

$response = file_get_contents('${req.protocol}://${req.get('host')}/api/analysis/comprehensive', false, stream_context_create($options));
      `,
      curlExample: `curl -X POST ${req.protocol}://${req.get('host')}/api/analysis/comprehensive \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "brandName": "Your Brand",
    "websiteUrl": "https://yourbrand.com",
    "email": "contact@yourbrand.com",
    "competitors": ["Competitor1"],
    "topics": ["Topic1"],
    "prompts": ["Prompt1"],
    "personas": "Your target personas"
  }'`
    },
    cors: {
      enabled: true,
      allowedOrigins: corsOptions.origin.length,
      credentials: corsOptions.credentials,
      methods: corsOptions.methods
    },
    rateLimit: {
      windowMs: config.rateLimitWindowMs,
      maxRequests: config.rateLimitMaxRequests,
      perWindow: `${config.rateLimitWindowMs / 1000 / 60} minutes`
    },
    note: 'All analysis results are saved as text files in brand-specific folders'
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;