import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  Ip,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  RequestOtpSchema,
  VerifyOtpSchema,
  ConsentSchema,
  UpdateProfileSchema,
  RevokeSessionSchema,
  RequestAccountDeletionSchema,
} from '@paiementbj/schemas';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demande d’un code de vérification SMS (OTP)' })
  @ApiResponse({ status: 200, description: 'Code envoyé avec succès.' })
  async requestOtp(@Body() body: unknown) {
    const validated = RequestOtpSchema.parse(body);
    return await this.authService.requestOtp(validated);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérification du code OTP et création de session' })
  @ApiResponse({ status: 200, description: 'Session créée et jetons émis.' })
  async verifyOtp(@Body() body: unknown, @Ip() ip: string) {
    const validated = VerifyOtpSchema.parse(body);
    return await this.authService.verifyOtp(validated, ip);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupère le profil de l’utilisateur connecté' })
  async getMe(@Req() req: any) {
    return await this.authService.getMe(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Met à jour les préférences et coordonnées de l’utilisateur' })
  async updateProfile(@Req() req: any, @Body() body: unknown) {
    const validated = UpdateProfileSchema.parse(body);
    return await this.authService.updateProfile(req.user.id, validated);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des appareils et sessions actives de l’usager' })
  async getSessions(@Req() req: any) {
    return await this.authService.listSessions(req.user.id);
  }

  @Post('sessions/revoke')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Révoquer l’accès d’un appareil spécifique' })
  async revokeSession(@Req() req: any, @Body() body: unknown) {
    const validated = RevokeSessionSchema.parse(body);
    return await this.authService.revokeSession(req.user.id, validated);
  }

  @Get('consents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historique horodaté des consentements (APDP)' })
  async getConsents(@Req() req: any) {
    return await this.authService.listConsents(req.user.id);
  }

  @Post('consents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enregistrer un consentement éclairé horodaté' })
  async recordConsent(@Req() req: any, @Body() body: unknown) {
    const validated = ConsentSchema.parse(body);
    return await this.authService.recordConsent(req.user.id, validated);
  }

  @Post('account/delete-request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Demande de suppression de compte (Loi APDP)' })
  async requestAccountDeletion(@Req() req: any, @Body() body: unknown) {
    const validated = RequestAccountDeletionSchema.parse(body);
    return await this.authService.requestAccountDeletion(req.user.id, validated);
  }
}
