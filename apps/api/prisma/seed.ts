import { PrismaClient, ServiceCategoryType, IntegrationStatus, PaymentProviderCode } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Début du peuplement du catalogue officiel vérifié...');

  // 1. Prestataires de paiement (état opérationnel strictement lié à la présence des clés configurées)
  const providers = [
    {
      code: PaymentProviderCode.MTN_MOMO,
      name: 'MTN Mobile Money',
      logoAssetKey: 'mtnMoMo',
      isOperational: Boolean(process.env.MTN_MOMO_SUBSCRIPTION_KEY && process.env.MTN_MOMO_API_USER),
      environment: process.env.MTN_MOMO_ENVIRONMENT || 'sandbox',
      apiEndpoint: 'https://sandbox.momodeveloper.mtn.com',
    },
    {
      code: PaymentProviderCode.MOOV_MONEY,
      name: 'Moov Money Bénin',
      logoAssetKey: 'moovMoney',
      isOperational: false,
      environment: 'sandbox',
      apiEndpoint: 'https://api.moov-africa.bj/sandbox',
    },
    {
      code: PaymentProviderCode.CELTIIS_CASH,
      name: 'Celtiis Cash',
      logoAssetKey: 'celtiisCash',
      isOperational: false,
      environment: 'sandbox',
      apiEndpoint: 'https://api.celtiis.bj/sandbox',
    },
    {
      code: PaymentProviderCode.BANK_CARD,
      name: 'Cartes Bancaires (Visa / Mastercard)',
      logoAssetKey: 'visa',
      isOperational: false,
      environment: 'sandbox',
      apiEndpoint: 'https://checkout.paiement.bj/card-gateway',
    },
    {
      code: PaymentProviderCode.TRESOR_PAY,
      name: 'Passerelle Trésor Pay',
      logoAssetKey: 'tresor',
      isOperational: false,
      environment: 'sandbox',
      apiEndpoint: 'https://paiement.tresorbenin.bj/api/v1',
    },
  ];

  for (const p of providers) {
    await prisma.paymentProviderConfig.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
  }

  // 2. Organismes bénéficiaires officiels
  const orgs = [
    {
      code: 'sbee',
      name: 'SBEE (Société Béninoise d’Énergie Électrique)',
      description: 'Distribution nationale d’énergie électrique, factures post-payées et compteurs à prépaiement.',
      category: ServiceCategoryType.UTILITIES_BILLS,
      logoAssetKey: 'sbee',
      websiteUrl: 'https://sbee.bj',
      supportPhone: '7302',
      isPublicEntity: true,
    },
    {
      code: 'soneb',
      name: 'SONEB (Société Nationale des Eaux du Bénin)',
      description: 'Production et distribution d’eau potable sur l’ensemble du territoire béninois.',
      category: ServiceCategoryType.UTILITIES_BILLS,
      logoAssetKey: 'soneb',
      websiteUrl: 'https://soneb.bj',
      supportPhone: '111',
      isPublicEntity: true,
    },
    {
      code: 'tresor',
      name: 'Direction Générale du Trésor et de la Comptabilité Publique',
      description: 'Paiement des taxes, timbres fiscaux dématérialisés, contraventions et redevances de l’État béninois.',
      category: ServiceCategoryType.PUBLIC_ADMINISTRATION,
      logoAssetKey: 'tresor',
      websiteUrl: 'https://paiement.tresorbenin.bj',
      isPublicEntity: true,
    },
    {
      code: 'anip',
      name: 'ANIP (Agence Nationale d’Identification des Personnes)',
      description: 'Gestion du registre national biométrique (RAVIP), délivrance de NPI et actes d’état civil sécurisés.',
      category: ServiceCategoryType.PUBLIC_ADMINISTRATION,
      logoAssetKey: 'anip',
      websiteUrl: 'https://anip.bj',
      isPublicEntity: true,
    },
    {
      code: 'canal',
      name: 'CANAL+ Bénin',
      description: 'Offres audiovisuelles et formules de réabonnement télévision par satellite.',
      category: ServiceCategoryType.UTILITIES_BILLS,
      logoAssetKey: 'canal',
      websiteUrl: 'https://canalplus-benin.com',
      isPublicEntity: false,
    },
    {
      code: 'celtiis',
      name: 'Celtiis Fibre Internet',
      description: 'Fourniture d’accès Internet Très Haut Débit par fibre optique de la SBIN.',
      category: ServiceCategoryType.UTILITIES_BILLS,
      logoAssetKey: 'celtiis',
      websiteUrl: 'https://celtiis.bj',
      isPublicEntity: true,
    },
  ];

  for (const org of orgs) {
    const createdOrg = await prisma.serviceOrganization.upsert({
      where: { code: org.code },
      update: org,
      create: org,
    });

    // 3. Services associés à cet organisme
    if (org.code === 'sbee') {
      const sbeeService = await prisma.service.upsert({
        where: { code: 'sbee_prepaye' },
        update: {},
        create: {
          organizationId: createdOrg.id,
          code: 'sbee_prepaye',
          title: 'SBEE • Recharge compteur prépayé (ISAGO)',
          description: 'Achat de crédit d’électricité et génération immédiate du code de recharge à 20 chiffres.',
          category: ServiceCategoryType.UTILITIES_BILLS,
          integrationStatus: IntegrationStatus.LIVE,
          statusMessage: 'Disponible',
          currency: 'XOF',
          minAmount: 1000,
          maxAmount: 500000,
          supportedPaymentMethods: ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH'],
          fixedFee: 0,
        },
      });

      await prisma.serviceField.createMany({
        data: [
          {
            serviceId: sbeeService.id,
            name: 'meterNumber',
            label: 'Numéro de compteur ISAGO',
            placeholder: 'Ex: 14123456789',
            type: 'number',
            required: true,
            orderIndex: 1,
            helpText: 'Le numéro à 11 ou 12 chiffres inscrit sur votre badge compteur.',
          },
          {
            serviceId: sbeeService.id,
            name: 'amount',
            label: 'Montant de la recharge (FCFA)',
            placeholder: 'Min. 1 000 FCFA',
            type: 'number',
            required: true,
            orderIndex: 2,
            helpText: 'Montant net converti en unités d’électricité kWh.',
          },
        ],
        skipDuplicates: true,
      });
    }

    if (org.code === 'soneb') {
      const sonebService = await prisma.service.upsert({
        where: { code: 'soneb_facture' },
        update: {},
        create: {
          organizationId: createdOrg.id,
          code: 'soneb_facture',
          title: 'SONEB • Règlement de facture d’eau',
          description: 'Paiement sécurisé des factures d’eau potable avec justification comptable immédiate.',
          category: ServiceCategoryType.UTILITIES_BILLS,
          integrationStatus: IntegrationStatus.LIVE,
          statusMessage: 'Disponible',
          currency: 'XOF',
          minAmount: 500,
          maxAmount: 1000000,
          supportedPaymentMethods: ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH'],
          fixedFee: 0,
        },
      });

      await prisma.serviceField.createMany({
        data: [
          {
            serviceId: sonebService.id,
            name: 'policeNumber',
            label: 'Numéro de police SONEB',
            placeholder: 'Ex: 01234567',
            type: 'reference',
            required: true,
            orderIndex: 1,
            helpText: 'Votre référence d’abonné présente en haut à gauche de la facture.',
          },
          {
            serviceId: sonebService.id,
            name: 'billReference',
            label: 'Référence de la facture',
            placeholder: 'Ex: FAC-2026-XXXX',
            type: 'text',
            required: true,
            orderIndex: 2,
            helpText: 'Numéro d’ordre de la facture à régler.',
          },
        ],
        skipDuplicates: true,
      });
    }

    if (org.code === 'tresor') {
      const timbreService = await prisma.service.upsert({
        where: { code: 'tresor_timbre' },
        update: {},
        create: {
          organizationId: createdOrg.id,
          code: 'tresor_timbre',
          title: 'Trésor Public • Timbres fiscaux dématérialisés',
          description: 'Achat de timbres fiscaux numériques officiels pour légalisation et démarches administratives.',
          category: ServiceCategoryType.PUBLIC_ADMINISTRATION,
          integrationStatus: IntegrationStatus.LIVE,
          statusMessage: 'Disponible',
          currency: 'XOF',
          minAmount: 500,
          maxAmount: 50000,
          supportedPaymentMethods: ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH', 'BANK_CARD'],
          fixedFee: 0,
        },
      });

      await prisma.serviceField.createMany({
        data: [
          {
            serviceId: timbreService.id,
            name: 'stampValue',
            label: 'Valeur unitaire du timbre (FCFA)',
            placeholder: 'Ex: 1200 ou 2000',
            type: 'number',
            required: true,
            orderIndex: 1,
            helpText: 'Ex: 1 200 FCFA pour acte notarié, 2 000 FCFA pour légalisation standard.',
          },
          {
            serviceId: timbreService.id,
            name: 'quantity',
            label: 'Nombre de timbres souhaités',
            placeholder: '1',
            type: 'number',
            required: true,
            orderIndex: 2,
            helpText: 'Chaque timbre possédera un QR code de vérification unique.',
          },
        ],
        skipDuplicates: true,
      });
    }

    if (org.code === 'anip') {
      const anipService = await prisma.service.upsert({
        where: { code: 'anip_certificat' },
        update: {},
        create: {
          organizationId: createdOrg.id,
          code: 'anip_certificat',
          title: 'ANIP • Certificat d’identification personnelle (CIP)',
          description: 'Paiement des droits de délivrance du Certificat d’Identification Personnelle numérique.',
          category: ServiceCategoryType.PUBLIC_ADMINISTRATION,
          integrationStatus: IntegrationStatus.LIVE,
          statusMessage: 'Disponible',
          currency: 'XOF',
          minAmount: 2800,
          maxAmount: 2800,
          supportedPaymentMethods: ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH', 'BANK_CARD'],
          fixedFee: 0,
        },
      });

      await prisma.serviceField.createMany({
        data: [
          {
            serviceId: anipService.id,
            name: 'npi',
            label: 'Numéro Personnel d’Identification (NPI)',
            placeholder: 'Numéro à 10 chiffres (ex: 1234567890)',
            type: 'npi',
            required: true,
            orderIndex: 1,
            helpText: 'Le NPI délivré lors de l’enrôlement au RAVIP.',
          },
        ],
        skipDuplicates: true,
      });
    }

    if (org.code === 'canal') {
      const canalService = await prisma.service.upsert({
        where: { code: 'canal_reabonnement' },
        update: {},
        create: {
          organizationId: createdOrg.id,
          code: 'canal_reabonnement',
          title: 'CANAL+ • Réabonnement bouquet TV',
          description: 'Reconduction immédiate de votre formule d’abonnement TV par satellite.',
          category: ServiceCategoryType.UTILITIES_BILLS,
          integrationStatus: IntegrationStatus.LIVE,
          statusMessage: 'Disponible',
          currency: 'XOF',
          minAmount: 5000,
          maxAmount: 100000,
          supportedPaymentMethods: ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH', 'BANK_CARD'],
          fixedFee: 0,
        },
      });

      await prisma.serviceField.createMany({
        data: [
          {
            serviceId: canalService.id,
            name: 'decoderNumber',
            label: 'Numéro de décodeur ou carte d’abonné',
            placeholder: 'Ex: 14123456789123',
            type: 'reference',
            required: true,
            orderIndex: 1,
            helpText: 'Numéro à 14 chiffres inscrit sous votre décodeur CANAL+.',
          },
        ],
        skipDuplicates: true,
      });
    }
  }

  console.log('[Seed] Peuplement du catalogue officiel terminé avec succès.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
