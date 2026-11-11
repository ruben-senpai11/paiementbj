import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationStatus } from '@paiementbj/types';
import { AdminLoginSchema, UpdateSupportTicketAdminSchema } from '@paiementbj/schemas';
import { z } from 'zod';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';
import { AdminService } from './admin.service';

const UpdateServiceStatusSchema = z.object({
  status: z.enum([
    'LIVE',
    'SANDBOX_CONNECTED',
    'PENDING_AGREEMENT',
    'TECHNICAL_IN_PROGRESS',
    'UNAVAILABLE',
  ]),
});

@ApiTags('Back-Office Administrateur')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion opérateur / auditeur au back-office administrateur' })
  @ApiResponse({ status: 200, description: 'Jeton administrateur délivré.' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides.' })
  async login(@Body() body: unknown) {
    const validated = AdminLoginSchema.parse(body);
    return await this.adminService.login(validated);
  }

  @Get('stats')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Statistiques consolidées et réelles du back-office' })
  @ApiResponse({ status: 200, description: 'Statistiques obtenues.' })
  async getStats() {
    return await this.adminService.getDashboardStats();
  }

  @Get('audit-logs')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultation du journal d’audit de sécurité et gouvernance' })
  async getAuditLogs() {
    return await this.adminService.listAuditLogs();
  }

  @Get('transactions')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des transactions réelles pour supervision et rapprochement' })
  async listTransactions() {
    return await this.adminService.listTransactions();
  }

  @Patch('services/:id/status')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activation / suspension temporaire d’un service du catalogue' })
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    const validated = UpdateServiceStatusSchema.parse(body);
    return await this.adminService.updateServiceStatus(
      id,
      validated.status as IntegrationStatus,
      req.user.id
    );
  }

  @Get('support/tickets')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supervision des réclamations usagers' })
  async listTickets() {
    return await this.adminService.listSupportTickets();
  }

  @Patch('support/tickets/:id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour ou résoudre un dossier de réclamation' })
  async updateTicket(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    const validated = UpdateSupportTicketAdminSchema.parse(body);
    return await this.adminService.updateSupportTicket(id, validated, req.user.id);
  }
}
