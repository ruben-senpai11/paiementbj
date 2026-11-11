import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';

@ApiTags('Transactions et reçus')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Historique des transactions réelles de l’utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Historique récupéré.' })
  async listTransactions(@Req() req: any) {
    return await this.transactionsService.listUserTransactions(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une transaction' })
  @ApiResponse({ status: 200, description: 'Détail trouvé.' })
  @ApiResponse({ status: 404, description: 'Transaction introuvable.' })
  async getTransaction(@Req() req: any, @Param('id') id: string) {
    return await this.transactionsService.getTransactionById(req.user.id, id);
  }

  @Get(':id/receipt')
  @ApiOperation({ summary: 'Reçu officiel et empreinte numérique d’une transaction confirmée' })
  @ApiResponse({ status: 200, description: 'Reçu officiel généré.' })
  @ApiResponse({ status: 404, description: 'Reçu non disponible.' })
  async getReceipt(@Req() req: any, @Param('id') id: string) {
    return await this.transactionsService.getReceipt(req.user.id, id);
  }
}
