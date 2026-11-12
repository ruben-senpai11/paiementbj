import { Injectable, NotFoundException } from '@nestjs/common';
import { ServiceItem, ServiceOrganization, ServiceCategoryType, IntegrationStatus } from '@paiementbj/types';
import { ServiceQueryDto } from '@paiementbj/schemas';
import { PrismaService } from '../../prisma/prisma.service';
import { isMvpSimulationEnabled } from '../../common/mvp-mode.util';

@Injectable()
export class CatalogService {
  // Référentiel institutionnel de secours si PostgreSQL n'est pas encore migré
  private readonly defaultOrganizations: ServiceOrganization[] = [
    {
      id: 'org_sbee',
      code: 'sbee',
      name: 'SBEE (Société Béninoise d’Énergie Électrique)',
      description: 'Distribution nationale d’énergie électrique, factures et compteurs prépayés.',
      category: ServiceCategoryType.UTILITIES_BILLS,
      logoAssetKey: 'sbee',
      websiteUrl: 'https://sbee.bj',
      supportPhone: '7302',
      isPublicEntity: true,
    },
    {
      id: 'org_soneb',
      code: 'soneb',
      name: 'SONEB (Société Nationale des Eaux du Bénin)',
      description: 'Production et distribution d’eau potable en République du Bénin.',
      category: ServiceCategoryType.UTILITIES_BILLS,
      logoAssetKey: 'soneb',
      websiteUrl: 'https://soneb.bj',
      supportPhone: '111',
      isPublicEntity: true,
    },
    {
      id: 'org_tresor',
      code: 'tresor',
      name: 'Direction Générale du Trésor Public du Bénin',
      description: 'Télépaiement des impôts, timbres fiscaux dématérialisés, contraventions et redevances de l’État.',
      category: ServiceCategoryType.PUBLIC_ADMINISTRATION,
      logoAssetKey: 'tresor',
      websiteUrl: 'https://paiement.tresorbenin.bj',
      isPublicEntity: true,
    },
    {
      id: 'org_anip',
      code: 'anip',
      name: 'ANIP (Identification des Personnes)',
      description: 'Délivrance de NPI, actes d’état civil sécurisés et certificats d’identification.',
      category: ServiceCategoryType.PUBLIC_ADMINISTRATION,
      logoAssetKey: 'anip',
      websiteUrl: 'https://anip.bj',
      isPublicEntity: true,
    },
    {
      id: 'org_canal',
      code: 'canal',
      name: 'CANAL+ Bénin',
      description: 'Formules et réabonnements TV par satellite.',
      category: ServiceCategoryType.UTILITIES_BILLS,
      logoAssetKey: 'canal',
      websiteUrl: 'https://canalplus-benin.com',
      isPublicEntity: false,
    },
    {
      id: 'org_celtiis',
      code: 'celtiis',
      name: 'Celtiis Fibre Internet',
      description: 'Accès Internet Très Haut Débit par fibre optique de la SBIN.',
      category: ServiceCategoryType.UTILITIES_BILLS,
      logoAssetKey: 'celtiis',
      websiteUrl: 'https://celtiis.bj',
      isPublicEntity: true,
    },
  ];

  private readonly defaultServices: ServiceItem[] = [
    {
      id: 'srv_sbee_prepaye',
      organizationId: 'org_sbee',
      code: 'sbee_prepaye',
      title: 'SBEE • Recharge compteur prépayé (ISAGO)',
      description: 'Achat de crédit d’électricité et délivrance instantanée du code de recharge.',
      category: ServiceCategoryType.UTILITIES_BILLS,
      integrationStatus: 'SANDBOX_CONNECTED',
      statusMessage: 'Opérationnel via l’API partenaire en environnement test.',
      currency: 'XOF',
      minAmount: 1000,
      maxAmount: 500000,
      requiredIdentityLevel: 'LEVEL_1_PHONE_VERIFIED',
      supportedPaymentMethods: ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH'],
      fixedFee: 0,
      fields: [
        {
          id: 'fld_sbee_meter',
          name: 'meterNumber',
          label: 'Numéro de compteur ISAGO',
          placeholder: 'Ex: 14123456789',
          type: 'number',
          required: true,
          helpText: 'Le numéro à 11 ou 12 chiffres inscrit sur votre badge compteur.',
        },
        {
          id: 'fld_sbee_amt',
          name: 'amount',
          label: 'Montant de la recharge (FCFA)',
          placeholder: 'Min. 1 000 FCFA',
          type: 'number',
          required: true,
          helpText: 'Montant net converti en unités d’électricité kWh.',
        },
      ],
    },
    {
      id: 'srv_soneb_facture',
      organizationId: 'org_soneb',
      code: 'soneb_facture',
      title: 'SONEB • Règlement de facture d’eau',
      description: 'Paiement sécurisé des factures d’eau potable avec justification comptable immédiate.',
      category: ServiceCategoryType.UTILITIES_BILLS,
      integrationStatus: 'PENDING_AGREEMENT',
      statusMessage: 'En attente de convention formelle de télérecouvrement SONEB.',
      currency: 'XOF',
      minAmount: 500,
      maxAmount: 1000000,
      requiredIdentityLevel: 'LEVEL_1_PHONE_VERIFIED',
      supportedPaymentMethods: ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH'],
      fixedFee: 0,
      fields: [
        {
          id: 'fld_soneb_police',
          name: 'policeNumber',
          label: 'Numéro de police SONEB',
          placeholder: 'Ex: 01234567',
          type: 'reference',
          required: true,
          helpText: 'Votre référence d’abonné présente en haut à gauche de la facture.',
        },
        {
          id: 'fld_soneb_bill',
          name: 'billReference',
          label: 'Référence de la facture',
          placeholder: 'Ex: FAC-2026-XXXX',
          type: 'text',
          required: true,
          helpText: 'Numéro d’ordre de la facture à régler.',
        },
      ],
    },
    {
      id: 'srv_tresor_timbre',
      organizationId: 'org_tresor',
      code: 'tresor_timbre',
      title: 'Trésor Public • Timbres fiscaux dématérialisés',
      description: 'Achat de timbres fiscaux officiels avec QR code de validation pour démarches d’État.',
      category: ServiceCategoryType.PUBLIC_ADMINISTRATION,
      integrationStatus: 'SANDBOX_CONNECTED',
      statusMessage: 'Connecteur Trésor Pay prêt pour la validation en bac à sable.',
      currency: 'XOF',
      minAmount: 500,
      maxAmount: 50000,
      requiredIdentityLevel: 'LEVEL_1_PHONE_VERIFIED',
      supportedPaymentMethods: ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH', 'BANK_CARD'],
      fixedFee: 0,
      fields: [
        {
          id: 'fld_stamp_val',
          name: 'stampValue',
          label: 'Valeur unitaire du timbre (FCFA)',
          placeholder: 'Ex: 1200 ou 2000',
          type: 'number',
          required: true,
          helpText: 'Ex: 1 200 FCFA pour acte notarié, 2 000 FCFA pour légalisation standard.',
        },
        {
          id: 'fld_stamp_qty',
          name: 'quantity',
          label: 'Nombre de timbres souhaités',
          placeholder: '1',
          type: 'number',
          required: true,
          helpText: 'Chaque timbre possédera un QR code de vérification unique.',
        },
      ],
    },
    {
      id: 'srv_anip_certificat',
      organizationId: 'org_anip',
      code: 'anip_certificat',
      title: 'ANIP • Certificat d’identification personnelle (CIP)',
      description: 'Paiement des droits de délivrance du Certificat d’Identification Personnelle numérique.',
      category: ServiceCategoryType.PUBLIC_ADMINISTRATION,
      integrationStatus: 'PENDING_AGREEMENT',
      statusMessage: 'En attente d’autorisation de traitement APDP et convention ANIP.',
      currency: 'XOF',
      minAmount: 2800,
      maxAmount: 2800,
      requiredIdentityLevel: 'LEVEL_2_IDENTITY_VERIFIED',
      supportedPaymentMethods: ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH', 'BANK_CARD'],
      fixedFee: 0,
      fields: [
        {
          id: 'fld_anip_npi',
          name: 'npi',
          label: 'Numéro Personnel d’Identification (NPI)',
          placeholder: 'Numéro à 10 chiffres (ex: 1234567890)',
          type: 'npi',
          required: true,
          helpText: 'Le NPI délivré lors de l’enrôlement au RAVIP.',
        },
      ],
    },
    {
      id: 'srv_canal_reabonnement',
      organizationId: 'org_canal',
      code: 'canal_reabonnement',
      title: 'CANAL+ • Réabonnement bouquet TV',
      description: 'Reconduction immédiate de votre formule d’abonnement TV par satellite.',
      category: ServiceCategoryType.UTILITIES_BILLS,
      integrationStatus: 'PENDING_AGREEMENT',
      statusMessage: 'En attente de convention distributeur agréé CANAL+ Afrique.',
      currency: 'XOF',
      minAmount: 5000,
      maxAmount: 100000,
      requiredIdentityLevel: 'LEVEL_1_PHONE_VERIFIED',
      supportedPaymentMethods: ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH', 'BANK_CARD'],
      fixedFee: 0,
      fields: [
        {
          id: 'fld_canal_dec',
          name: 'decoderNumber',
          label: 'Numéro de décodeur ou carte d’abonné',
          placeholder: 'Ex: 14123456789123',
          type: 'reference',
          required: true,
          helpText: 'Numéro à 14 chiffres inscrit sous votre décodeur CANAL+.',
        },
      ],
    },
    {
      id: 'srv_celtiis_fibre',
      organizationId: 'org_celtiis',
      code: 'celtiis_fibre',
      title: 'Celtiis • Recharge abonnement Fibre Internet',
      description: 'Renouvellement de votre forfait Internet fibre Très Haut Débit.',
      category: ServiceCategoryType.UTILITIES_BILLS,
      integrationStatus: 'PENDING_AGREEMENT',
      statusMessage: 'En attente de finalisation d’interconnexion SBIN / Celtiis.',
      currency: 'XOF',
      minAmount: 15000,
      maxAmount: 60000,
      requiredIdentityLevel: 'LEVEL_1_PHONE_VERIFIED',
      supportedPaymentMethods: ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH'],
      fixedFee: 0,
      fields: [
        {
          id: 'fld_celtiis_ref',
          name: 'subscriberId',
          label: 'Identifiant d’abonné Fibre (Code client)',
          placeholder: 'Ex: CL-987654',
          type: 'text',
          required: true,
          helpText: 'Code d’abonné figurant sur votre contrat Celtiis Fibre.',
        },
      ],
    },
  ];

  private readonly statusOverrides = new Map<string, IntegrationStatus>();

  constructor(private readonly prisma: PrismaService) {}

  setServiceStatusOverride(serviceId: string, status: IntegrationStatus) {
    this.statusOverrides.set(serviceId, status);
  }

  async listServices(query?: ServiceQueryDto): Promise<ServiceItem[]> {
    try {
      if (await this.prisma.checkAvailable()) {
        const dbServices = await this.prisma.service.findMany({
          where: {
            category: query?.category ? (query.category as any) : undefined,
            integrationStatus: query?.status ? (query.status as any) : undefined,
            ...(query?.q
              ? {
                  OR: [
                    { title: { contains: query.q, mode: 'insensitive' } },
                    { description: { contains: query.q, mode: 'insensitive' } },
                  ],
                }
              : {}),
          },
          include: { organization: true, fields: { orderBy: { orderIndex: 'asc' } } },
        });

        if (dbServices.length > 0) {
          const mvp = isMvpSimulationEnabled();
          return dbServices.map((s) => {
            const override = this.statusOverrides.get(s.id) ?? this.statusOverrides.get(s.code);
            return {
              id: s.id,
              organizationId: s.organizationId,
              organization: s.organization
                ? {
                    id: s.organization.id,
                    code: s.organization.code,
                    name: s.organization.name,
                    description: s.organization.description,
                    category: s.organization.category as ServiceCategoryType,
                    logoAssetKey: s.organization.logoAssetKey,
                    websiteUrl: s.organization.websiteUrl || undefined,
                    supportPhone: s.organization.supportPhone || undefined,
                    isPublicEntity: s.organization.isPublicEntity,
                  }
                : undefined,
              code: s.code,
              title: s.title,
              description: s.description,
              category: s.category as ServiceCategoryType,
              integrationStatus: override ?? (mvp ? 'LIVE' : (s.integrationStatus as IntegrationStatus)),
              statusMessage: mvp ? 'Disponible' : s.statusMessage || undefined,
              minAmount: s.minAmount || undefined,
              maxAmount: s.maxAmount || undefined,
              currency: s.currency as 'XOF' | 'EUR' | 'USD',
              requiredIdentityLevel: s.requiredIdentityLevel as any,
              supportedPaymentMethods: s.supportedPaymentMethods as any,
              fields: s.fields.map((f) => ({
                id: f.id,
                name: f.name,
                label: f.label,
                placeholder: f.placeholder,
                type: f.type as any,
                required: f.required,
                helpText: f.helpText || undefined,
              })),
            };
          });
        }
      }
    } catch {
      this.prisma.markUnavailable();
      // Fallback gracieux sur le catalogue in-memory
    }

    const mvp = isMvpSimulationEnabled();
    let items = this.defaultServices.map((s) => {
      const override = this.statusOverrides.get(s.id) ?? this.statusOverrides.get(s.code);
      return {
        ...s,
        integrationStatus: override ?? (mvp ? ('LIVE' as IntegrationStatus) : s.integrationStatus),
        statusMessage: mvp ? 'Disponible' : s.statusMessage,
        organization: this.defaultOrganizations.find((o) => o.id === s.organizationId),
      };
    });

    if (query?.category) {
      items = items.filter((s) => s.category === query.category);
    }
    if (query?.status) {
      items = items.filter((s) => s.integrationStatus === query.status);
    }
    if (query?.q) {
      const q = query.q.toLowerCase();
      items = items.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.organization?.name.toLowerCase().includes(q)
      );
    }

    return items;
  }

  async getServiceById(id: string): Promise<ServiceItem> {
    const all = await this.listServices();
    const service = all.find((s) => s.id === id || s.code === id);
    if (!service) {
      throw new NotFoundException('Service introuvable dans le catalogue.');
    }
    return service;
  }

  async listOrganizations(): Promise<ServiceOrganization[]> {
    try {
      if (await this.prisma.checkAvailable()) {
        const dbOrgs = await this.prisma.serviceOrganization.findMany();
        if (dbOrgs.length > 0) {
          return dbOrgs.map((o) => ({
            id: o.id,
            code: o.code,
            name: o.name,
            description: o.description,
            category: o.category as ServiceCategoryType,
            logoAssetKey: o.logoAssetKey,
            websiteUrl: o.websiteUrl || undefined,
            supportPhone: o.supportPhone || undefined,
            isPublicEntity: o.isPublicEntity,
          }));
        }
      }
    } catch {
      this.prisma.markUnavailable();
      // Fallback
    }
    return this.defaultOrganizations;
  }
}
