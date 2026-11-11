import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des notifications de sécurité et de paiement de l’usager' })
  @ApiResponse({ status: 200, description: 'Liste des notifications.' })
  async listNotifications(@Req() req: any) {
    return await this.notificationsService.listUserNotifications(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiResponse({ status: 200, description: 'Notification marquée lue.' })
  async markRead(@Req() req: any, @Param('id') id: string) {
    return await this.notificationsService.markAsRead(req.user.id, id);
  }
}
