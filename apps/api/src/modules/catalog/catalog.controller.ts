import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServiceQuerySchema } from '@paiementbj/schemas';
import { CatalogService } from './catalog.service';

@ApiTags('Catalogue des services')
@Controller('services')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Liste les services payables avec recherche et filtres de catégorie' })
  @ApiResponse({ status: 200, description: 'Services récupérés avec succès.' })
  async listServices(@Query() query: any) {
    const validated = ServiceQuerySchema.parse(query);
    return await this.catalogService.listServices(validated);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un service avec sa configuration de formulaire et champs' })
  @ApiResponse({ status: 200, description: 'Service trouvé.' })
  @ApiResponse({ status: 404, description: 'Service introuvable.' })
  async getServiceById(@Param('id') id: string) {
    return await this.catalogService.getServiceById(id);
  }
}
