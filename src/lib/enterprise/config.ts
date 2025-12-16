// Enterprise Configuration Management
import { z } from 'zod'

// Configuration Schema Validation
const EnterpriseConfigSchema = z.object({
  // Application Configuration
  app: z.object({
    name: z.string().default('TeamFlow Enterprise'),
    version: z.string().default('1.0.0'),
    environment: z.enum(['development', 'staging', 'production']).default('development'),
    debug: z.boolean().default(false)
  }),

  // Server Configuration
  server: z.object({
    port: z.number().min(1000).max(65535).default(3001),
    host: z.string().default('0.0.0.0'),
    cors: z.object({
      origin: z.array(z.string()).default(['http://localhost:3000']),
      credentials: z.boolean().default(true),
      methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
      allowedHeaders: z.array(z.string()).default(['Content-Type', 'Authorization'])
    }),
    rateLimit: z.object({
      windowMs: z.number().default(15 * 60 * 1000), // 15 minutes
      max: z.number().default(1000),
      skipSuccessfulRequests: z.boolean().default(false),
      skipFailedRequests: z.boolean().default(false)
    }),
    compression: z.object({
      enabled: z.boolean().default(true),
      level: z.number().min(1).max(9).default(6),
      threshold: z.number().default(1024)
    })
  }),

  // Database Configuration
  database: z.object({
    url: z.string(),
    maxConnections: z.number().default(100),
    minConnections: z.number().default(10),
    connectionTimeout: z.number().default(30000),
    idleTimeout: z.number().default(600000),
    ssl: z.boolean().default(false),
    logging: z.boolean().default(false)
  }),

  // Redis Configuration
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    password: z.string().optional(),
    db: z.number().default(0),
    cluster: z.boolean().default(false),
    maxRetries: z.number().default(3),
    retryDelayOnFailover: z.number().default(100),
    enableOfflineQueue: z.boolean().default(false),
    ttl: z.number().default(3600) // 1 hour default TTL
  }),

  // Authentication Configuration
  auth: z.object({
    jwtSecret: z.string(),
    jwtExpiresIn: z.string().default('24h'),
    refreshTokenExpiresIn: z.string().default('7d'),
    bcryptRounds: z.number().min(10).max(15).default(12),
    sessionTimeout: z.number().default(24 * 60 * 60 * 1000), // 24 hours
    maxLoginAttempts: z.number().default(5),
    lockoutDuration: z.number().default(15 * 60 * 1000), // 15 minutes
    sso: z.object({
      enabled: z.boolean().default(false),
      saml: z.object({
        entryPoint: z.string().optional(),
        issuer: z.string().optional(),
        cert: z.string().optional()
      }).optional(),
      oauth: z.object({
        google: z.object({
          clientId: z.string().optional(),
          clientSecret: z.string().optional()
        }).optional(),
        github: z.object({
          clientId: z.string().optional(),
          clientSecret: z.string().optional()
        }).optional(),
        microsoft: z.object({
          clientId: z.string().optional(),
          clientSecret: z.string().optional(),
          tenantId: z.string().optional()
        }).optional()
      }).optional()
    })
  }),

  // Real-time Configuration
  realtime: z.object({
    enabled: z.boolean().default(true),
    maxConnections: z.number().default(10000),
    pingTimeout: z.number().default(60000),
    pingInterval: z.number().default(25000),
    upgradeTimeout: z.number().default(10000),
    maxHttpBufferSize: z.number().default(1e6),
    transports: z.array(z.enum(['websocket', 'polling'])).default(['websocket', 'polling']),
    compression: z.boolean().default(true),
    adapter: z.object({
      type: z.enum(['memory', 'redis']).default('redis'),
      redis: z.object({
        pubClient: z.string().optional(),
        subClient: z.string().optional()
      }).optional()
    })
  }),

  // AI Configuration
  ai: z.object({
    enabled: z.boolean().default(true),
    openai: z.object({
      apiKey: z.string().optional(),
      model: z.string().default('gpt-3.5-turbo'),
      maxTokens: z.number().default(1000),
      temperature: z.number().min(0).max(2).default(0.7),
      timeout: z.number().default(30000)
    }),
    features: z.object({
      taskSuggestions: z.boolean().default(true),
      meetingTranscription: z.boolean().default(true),
      riskAssessment: z.boolean().default(true),
      workloadOptimization: z.boolean().default(true),
      burnoutPrevention: z.boolean().default(true)
    })
  }),

  // File Storage Configuration
  storage: z.object({
    provider: z.enum(['local', 's3', 'azure', 'gcp']).default('local'),
    maxFileSize: z.number().default(10 * 1024 * 1024), // 10MB
    allowedTypes: z.array(z.string()).default([
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]),
    local: z.object({
      uploadPath: z.string().default('./uploads'),
      publicPath: z.string().default('/uploads')
    }).optional(),
    s3: z.object({
      bucket: z.string().optional(),
      region: z.string().optional(),
      accessKeyId: z.string().optional(),
      secretAccessKey: z.string().optional(),
      endpoint: z.string().optional()
    }).optional(),
    azure: z.object({
      connectionString: z.string().optional(),
      containerName: z.string().optional()
    }).optional(),
    gcp: z.object({
      projectId: z.string().optional(),
      keyFilename: z.string().optional(),
      bucketName: z.string().optional()
    }).optional()
  }),

  // Email Configuration
  email: z.object({
    enabled: z.boolean().default(true),
    provider: z.enum(['smtp', 'sendgrid', 'ses', 'mailgun']).default('smtp'),
    from: z.string().default('noreply@teamflow.com'),
    smtp: z.object({
      host: z.string().optional(),
      port: z.number().optional(),
      secure: z.boolean().default(true),
      auth: z.object({
        user: z.string().optional(),
        pass: z.string().optional()
      }).optional()
    }).optional(),
    sendgrid: z.object({
      apiKey: z.string().optional()
    }).optional(),
    ses: z.object({
      region: z.string().optional(),
      accessKeyId: z.string().optional(),
      secretAccessKey: z.string().optional()
    }).optional(),
    mailgun: z.object({
      domain: z.string().optional(),
      apiKey: z.string().optional()
    }).optional()
  }),

  // Monitoring Configuration
  monitoring: z.object({
    enabled: z.boolean().default(true),
    logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    enableMetrics: z.boolean().default(true),
    enableTracing: z.boolean().default(false),
    healthCheck: z.object({
      enabled: z.boolean().default(true),
      interval: z.number().default(30000),
      timeout: z.number().default(5000)
    }),
    alerts: z.object({
      enabled: z.boolean().default(true),
      channels: z.array(z.enum(['email', 'slack', 'webhook'])).default(['email']),
      thresholds: z.object({
        responseTime: z.number().default(1000),
        errorRate: z.number().default(0.05),
        cpuUsage: z.number().default(80),
        memoryUsage: z.number().default(80)
      })
    }),
    apm: z.object({
      enabled: z.boolean().default(false),
      serviceName: z.string().default('teamflow-enterprise'),
      environment: z.string().optional(),
      serverUrl: z.string().optional(),
      secretToken: z.string().optional()
    })
  }),

  // Security Configuration
  security: z.object({
    encryption: z.object({
      algorithm: z.string().default('aes-256-gcm'),
      keyLength: z.number().default(32),
      ivLength: z.number().default(16)
    }),
    headers: z.object({
      contentSecurityPolicy: z.boolean().default(true),
      hsts: z.boolean().default(true),
      noSniff: z.boolean().default(true),
      xssProtection: z.boolean().default(true),
      referrerPolicy: z.string().default('strict-origin-when-cross-origin')
    }),
    audit: z.object({
      enabled: z.boolean().default(true),
      logLevel: z.enum(['all', 'write', 'admin']).default('write'),
      retention: z.number().default(90), // days
      anonymize: z.boolean().default(false)
    }),
    compliance: z.object({
      gdpr: z.boolean().default(true),
      hipaa: z.boolean().default(false),
      soc2: z.boolean().default(false)
    })
  }),

  // Integration Configuration
  integrations: z.object({
    slack: z.object({
      enabled: z.boolean().default(false),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      signingSecret: z.string().optional(),
      botToken: z.string().optional()
    }),
    github: z.object({
      enabled: z.boolean().default(false),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      webhookSecret: z.string().optional()
    }),
    jira: z.object({
      enabled: z.boolean().default(false),
      baseUrl: z.string().optional(),
      username: z.string().optional(),
      apiToken: z.string().optional()
    }),
    calendar: z.object({
      enabled: z.boolean().default(false),
      google: z.object({
        clientId: z.string().optional(),
        clientSecret: z.string().optional()
      }).optional(),
      outlook: z.object({
        clientId: z.string().optional(),
        clientSecret: z.string().optional(),
        tenantId: z.string().optional()
      }).optional()
    })
  }),

  // Performance Configuration
  performance: z.object({
    caching: z.object({
      enabled: z.boolean().default(true),
      defaultTtl: z.number().default(3600),
      maxMemory: z.string().default('100mb'),
      strategy: z.enum(['lru', 'lfu', 'fifo']).default('lru')
    }),
    compression: z.object({
      enabled: z.boolean().default(true),
      level: z.number().min(1).max(9).default(6),
      threshold: z.number().default(1024)
    }),
    clustering: z.object({
      enabled: z.boolean().default(false),
      workers: z.number().default(0) // 0 = auto (number of CPUs)
    })
  })
})

export type EnterpriseConfig = z.infer<typeof EnterpriseConfigSchema>

// Configuration Manager
export class ConfigManager {
  private static instance: ConfigManager
  private config: EnterpriseConfig
  private watchers: Array<(config: EnterpriseConfig) => void> = []

  private constructor() {
    this.config = this.loadConfig()
    this.validateConfig()
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  private loadConfig(): EnterpriseConfig {
    const envConfig = {
      app: {
        name: process.env.APP_NAME,
        version: process.env.APP_VERSION,
        environment: process.env.NODE_ENV as 'development' | 'staging' | 'production',
        debug: process.env.DEBUG === 'true'
      },
      server: {
        port: process.env.PORT ? parseInt(process.env.PORT) : undefined,
        host: process.env.HOST,
        cors: {
          origin: process.env.CORS_ORIGINS?.split(','),
          credentials: process.env.CORS_CREDENTIALS === 'true'
        }
      },
      database: {
        url: process.env.DATABASE_URL!,
        maxConnections: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS) : undefined,
        ssl: process.env.DB_SSL === 'true'
      },
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
        password: process.env.REDIS_PASSWORD,
        cluster: process.env.REDIS_CLUSTER === 'true'
      },
      auth: {
        jwtSecret: process.env.JWT_SECRET!,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN,
        sso: {
          enabled: process.env.SSO_ENABLED === 'true',
          oauth: {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET
            },
            github: {
              clientId: process.env.GITHUB_CLIENT_ID,
              clientSecret: process.env.GITHUB_CLIENT_SECRET
            }
          }
        }
      },
      ai: {
        enabled: process.env.AI_ENABLED !== 'false',
        openai: {
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL
        }
      },
      storage: {
        provider: process.env.STORAGE_PROVIDER as 'local' | 's3' | 'azure' | 'gcp',
        s3: {
          bucket: process.env.S3_BUCKET,
          region: process.env.S3_REGION,
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
        }
      },
      email: {
        enabled: process.env.EMAIL_ENABLED !== 'false',
        provider: process.env.EMAIL_PROVIDER as 'smtp' | 'sendgrid' | 'ses' | 'mailgun',
        from: process.env.EMAIL_FROM,
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }
      },
      integrations: {
        slack: {
          enabled: process.env.SLACK_ENABLED === 'true',
          clientId: process.env.SLACK_CLIENT_ID,
          clientSecret: process.env.SLACK_CLIENT_SECRET,
          botToken: process.env.SLACK_BOT_TOKEN
        },
        github: {
          enabled: process.env.GITHUB_INTEGRATION_ENABLED === 'true',
          clientId: process.env.GITHUB_INTEGRATION_CLIENT_ID,
          clientSecret: process.env.GITHUB_INTEGRATION_CLIENT_SECRET
        }
      }
    }

    // Remove undefined values
    const cleanConfig = JSON.parse(JSON.stringify(envConfig, (key, value) => 
      value === undefined ? null : value
    ))

    return cleanConfig
  }

  private validateConfig(): void {
    try {
      this.config = EnterpriseConfigSchema.parse(this.config)
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Configuration validation failed:')
        error.errors.forEach(err => {
          console.error(`  ${err.path.join('.')}: ${err.message}`)
        })
        process.exit(1)
      }
      throw error
    }
  }

  getConfig(): EnterpriseConfig {
    return this.config
  }

  get<T extends keyof EnterpriseConfig>(key: T): EnterpriseConfig[T] {
    return this.config[key]
  }

  set<T extends keyof EnterpriseConfig>(key: T, value: EnterpriseConfig[T]): void {
    this.config[key] = value
    this.notifyWatchers()
  }

  update(updates: Partial<EnterpriseConfig>): void {
    this.config = { ...this.config, ...updates }
    this.validateConfig()
    this.notifyWatchers()
  }

  watch(callback: (config: EnterpriseConfig) => void): () => void {
    this.watchers.push(callback)
    
    // Return unwatch function
    return () => {
      const index = this.watchers.indexOf(callback)
      if (index > -1) {
        this.watchers.splice(index, 1)
      }
    }
  }

  private notifyWatchers(): void {
    this.watchers.forEach(callback => {
      try {
        callback(this.config)
      } catch (error) {
        console.error('Config watcher error:', error)
      }
    })
  }

  // Environment-specific configurations
  isDevelopment(): boolean {
    return this.config.app.environment === 'development'
  }

  isProduction(): boolean {
    return this.config.app.environment === 'production'
  }

  isStaging(): boolean {
    return this.config.app.environment === 'staging'
  }

  // Feature flags
  isFeatureEnabled(feature: string): boolean {
    const featureMap: Record<string, boolean> = {
      'ai': this.config.ai.enabled,
      'realtime': this.config.realtime.enabled,
      'monitoring': this.config.monitoring.enabled,
      'email': this.config.email.enabled,
      'sso': this.config.auth.sso.enabled,
      'slack': this.config.integrations.slack.enabled,
      'github': this.config.integrations.github.enabled,
      'jira': this.config.integrations.jira.enabled,
      'calendar': this.config.integrations.calendar.enabled
    }

    return featureMap[feature] ?? false
  }

  // Export configuration for debugging
  exportConfig(includeSecrets = false): string {
    const config = { ...this.config }
    
    if (!includeSecrets) {
      // Remove sensitive information
      config.auth.jwtSecret = '[REDACTED]'
      if (config.database.url) {
        config.database.url = config.database.url.replace(/:\/\/[^@]+@/, '://[REDACTED]@')
      }
      if (config.redis.password) {
        config.redis.password = '[REDACTED]'
      }
      if (config.ai.openai.apiKey) {
        config.ai.openai.apiKey = '[REDACTED]'
      }
      // Add more secret redaction as needed
    }

    return JSON.stringify(config, null, 2)
  }
}

// Environment validation
export function validateEnvironment(): void {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:')
    missing.forEach(key => console.error(`  ${key}`))
    process.exit(1)
  }
}

// Initialize configuration
export function initializeConfig(): ConfigManager {
  validateEnvironment()
  return ConfigManager.getInstance()
}