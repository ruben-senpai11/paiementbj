import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateSupportTicketSchema, AddSupportMessageSchema } from '@paiementbj/schemas';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SupportService } from './support.service';

@ApiTags('Assistance et réclamations')
@Controller('support')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Enregistrement d’une réclamation liée ou non à une transaction' })
  @ApiResponse({ status: 201, description: 'Réclamation enregistrée.' })
  async createTicket(@Req() req: any, @Body() body: unknown) {
    const validated = CreateSupportTicketSchema.parse(body);
    return await this.supportService.createTicket(req.user.id, validated);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Liste des réclamations de l’utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Liste des dossiers.' })
  async listTickets(@Req() req: any) {
    return await this.supportService.listUserTickets(req.user.id);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Détail et historique d’une réclamation' })
  @ApiResponse({ status: 200, description: 'Dossier trouvé.' })
  async getTicket(@Req() req: any, @Param('id') id: string) {
    return await this.supportService.getTicketById(req.user.id, id);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Ajouter un message de suivi à une réclamation' })
  @ApiResponse({ status: 201, description: 'Message ajouté au dossier.' })
  async addMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    const validated = AddSupportMessageSchema.parse(body);
    return await this.supportService.addMessage(req.user.id, id, validated);
  }
}
