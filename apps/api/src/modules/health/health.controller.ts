import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Santé & Supervision')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Vérification honnête de disponibilité API et base PostgreSQL' })
  @ApiResponse({ status: 200, description: 'État opérationnel courant de la plateforme.' })
  async getHealth() {
    const dbConnected = await this.prisma.checkAvailable();
    const apiPrefix = process.env.API_PREFIX || 'v1';

    return {
      name: 'Paiement BJ API',
      status: dbConnected ? 'ok' : 'degraded',
      runtime: process.env.VERCEL ? 'vercel-serverless' : 'node-server',
      environment: process.env.NODE_ENV || 'development',
      apiPrefix: `/${apiPrefix}`,
      database: {
        configured: Boolean(process.env.DATABASE_URL),
        connected: dbConnected,
      },
      smsProvider: process.env.SMS_PROVIDER || 'sandbox',
      docsUrl: '/api/docs',
      openApiJsonUrl: '/api/docs-json',
      timestamp: new Date().toISOString(),
    };
  }
}
