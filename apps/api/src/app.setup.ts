import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ZodExceptionFilter } from './common/zod-exception.filter';

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Paiement BJ — API Interopérabilité des Paiements')
    .setDescription(
      'Spécification OpenAPI officielle des services de centralisation, orchestration et télépaiement au Bénin. Aucun portefeuille interne : conformité BCEAO Instruction n°001-01-2024 et APDP Loi n°2017-20.'
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentification', 'Inscription, vérification OTP, sessions, profil et consentements')
    .addTag('Catalogue des services', 'Consultation des services et organismes publics / privés')
    .addTag(
      'Orchestration des paiements',
      'Prestataires, devis, validation, intentions idempotentes, tentatives et webhooks HMAC'
    )
    .addTag('Transactions et reçus', 'Historique vérifié et justificatifs officiels SHA-256')
    .addTag('Notifications', 'Alertes de sécurité et suivi de statut des transactions')
    .addTag('Assistance et réclamations', 'Dépôt et suivi conversationnel des litiges usagers')
    .addTag('Back-Office Administrateur', 'Connexion opérateur RBAC, gouvernance, supervision et audit')
    .addTag('Santé & Supervision', 'Disponibilité réelle de l’API et connectivité PostgreSQL')
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function configureApp(app: INestApplication): OpenAPIObject {
  const apiPrefix = process.env.API_PREFIX || 'v1';
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalFilters(new ZodExceptionFilter());

  // En-têtes de sécurité HTTP obligatoires
  app.use((_req: any, res: any, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    next();
  });

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
        .map((o) => o.trim().replace(/\/+$/, ''))
        .filter(Boolean)
    : true;

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const httpAdapter = app.getHttpAdapter?.();
  const expressInstance = httpAdapter?.getInstance?.();
  if (expressInstance && typeof expressInstance.get === 'function') {
    const apiDiscoveryPayload = () => ({
      name: 'Paiement BJ API',
      runtime: process.env.VERCEL ? 'vercel-serverless' : 'node-server',
      apiPrefix: `/${apiPrefix}`,
      healthUrl: `/${apiPrefix}/health`,
      servicesUrl: `/${apiPrefix}/services`,
      docsUrl: '/api/docs',
      openApiJsonUrl: '/api/docs-json',
    });

    expressInstance.get(['/', '/api'], (_req: any, res: any) => {
      res.status(200).json(apiDiscoveryPayload());
    });

    expressInstance.get('/healthz', (_req: any, res: any) => {
      res.redirect(307, `/${apiPrefix}/health`);
    });
  }

  const document = buildOpenApiDocument(app);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Paiement BJ — API OpenAPI',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  return document;
}
