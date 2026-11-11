import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreatePaymentIntentSchema,
  CreatePaymentAttemptSchema,
  PaymentQuoteSchema,
  ValidatePaymentSchema,
} from '@paiementbj/schemas';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('Orchestration des paiements')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('providers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste les prestataires de paiement et leur disponibilité réelle' })
  @ApiResponse({ status: 200, description: 'Liste des prestataires.' })
  async listProviders() {
    return await this.paymentsService.listProviders();
  }

  @Post('quote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calcul officiel des frais et du total à payer avant validation' })
  @ApiResponse({ status: 200, description: 'Devis calculé.' })
  async getQuote(@Body() body: unknown) {
    const validated = PaymentQuoteSchema.parse(body);
    return await this.paymentsService.getQuote(validated);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérification préalable des références client auprès du prestataire' })
  @ApiResponse({ status: 200, description: 'Résultat de vérification.' })
  async validatePayment(@Body() body: unknown) {
    const validated = ValidatePaymentSchema.parse(body);
    return await this.paymentsService.validatePayment(validated);
  }

  @Post('intents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Création d’une intention de paiement sécurisée par clé d’idempotence' })
  @ApiResponse({ status: 201, description: 'Intention créée.' })
  async createIntent(@Req() req: any, @Body() body: unknown) {
    const validated = CreatePaymentIntentSchema.parse(body);
    return await this.paymentsService.createIntent(req.user.id, validated);
  }

  @Post('attempts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Déclenchement d’une tentative de débit auprès d’un prestataire sélectionné' })
  @ApiResponse({ status: 200, description: 'Tentative initialisée.' })
  async createAttempt(@Req() req: any, @Body() body: unknown) {
    const validated = CreatePaymentAttemptSchema.parse(body);
    return await this.paymentsService.createAttempt(req.user.id, validated);
  }

  @Get('intents/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vérification du statut d’une transaction auprès du prestataire' })
  @ApiResponse({ status: 200, description: 'Statut actuel vérifié.' })
  async getStatus(@Req() req: any, @Param('id') id: string) {
    return await this.paymentsService.getStatus(req.user.id, id);
  }

  @Post('webhooks/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Point de réception HMAC-SHA256 des confirmations prestataires (protégé par signature + fenêtre anti-rejeu)',
  })
  @ApiResponse({ status: 200, description: 'Webhook traité de manière idempotente.' })
  @ApiResponse({ status: 401, description: 'Signature HMAC invalide ou expirée.' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() req: any,
    @Body() body: Record<string, unknown>
  ) {
    const rawBody =
      typeof req.rawBody === 'string'
        ? req.rawBody
        : Buffer.isBuffer(req.rawBody)
        ? req.rawBody.toString('utf8')
        : JSON.stringify(body || {});
    return await this.paymentsService.handleProviderWebhook({
      providerParam: provider,
      headers,
      rawBody,
      parsedPayload: body || {},
    });
  }
}
