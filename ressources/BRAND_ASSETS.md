# Registre des logos et marques — Paiement BJ

Les URL des logos sont centralisées dans `src/data/logos.ts`. Les copies actuellement affichées sont chargées depuis des URL publiques et peuvent être remplacées par les masters institutionnels sans modifier les écrans.

| Clé | Marque | URL image de la maquette | Source institutionnelle à utiliser pour validation | Action avant production |
|---|---|---|---|---|
| `mtn` | MTN | https://toppng.com/uploads/preview/mtn-vector-logo-free-download-11574079006iyxmpcd4fu.png | https://www.mtn.bj/ | Obtenir master et autorisation MTN Bénin |
| `mtnMoMo` | MTN MoMo | https://cdn.thenigerianvoice.com/images/content/627202213429_images31.png | https://www.mtn.bj/momo/ | Logo autorisé seulement dans l'étape paiement selon règles de marque ; demander validation du co-branding |
| `moov` | Moov Africa | https://www.ewaji.com/images/businesses/moov-africabj-1764167747.webp | https://www.moov-africa.bj/ | Obtenir master officiel / autorisation |
| `moovMoney` | Moov Money Bénin | https://fastly.mwm-storage.mwmcdn.com/raw_files/017f1967-ce20-4de4-886a-17ce4b5dcc75 | https://www.moov-africa.bj/ | Demander fichier média et validation Moov |
| `celtiis` | Celtiis | https://cdn.prod.website-files.com/62824591015aa377ad308e08/659ffe788e0b2df7b68539ad_Group%20610.png | https://www.celtiis.bj/corporate/ | Obtenir master officiel / validation Celtiis Cash |
| `sbee` | SBEE | https://lanation.bj/storage/assets/2024/06/TSm5FULWWrshKPyy_sbee.jpg.webp | https://sbee.bj/a-propos/ | Utiliser la charte officielle SBEE : https://sbee.bj/wp-content/uploads/2024/08/CHARTE-GRAPHIQUE_SBEE_2023-V2.4.pdf |
| `soneb` | SONEB | https://www.sawatrust.krodrive.com/images/businesses/societe-nationale-des-eaux-du-benin-soneb-1767527195.png | Site SONEB | Remplacer par le fichier institutionnel HD |
| `canal` | CANAL+ | https://cdn.freebiesupply.com/logos/large/2x/canal-logo-png-transparent.png | https://www.canalplus.com/presse/kit-media | Confirmer la variante destinée au Bénin et l'autorisation |
| `tresor` | Trésor public | https://oxygene-benin.bj/mplou/2026/02/1770105477429.jpg | https://paiement.tresorbenin.bj/ | Demander master institutionnel |
| `anip` | ANIP | https://www.portailinfo.bj/gnghstorage/2023/05/ANIP.png | https://anip.bj/ | Demander master et règles de co-branding |

## Règles d'utilisation

1. Aucun logo ne doit être généré, retracé, recoloré ou déformé.
2. Conserver la source, la date de dernière vérification et le nom de la personne ayant validé chaque master.
3. Récupérer les assets autorisés et les versionner dans `assets/logos/` avant release ; éviter les dépendances d'affichage à des serveurs tiers.
4. Garder le nom de la marque en texte alternatif et en fallback si l'image ne se charge pas.
5. Ne pas laisser croire qu'un opérateur est partenaire si aucun accord commercial ou technique n'est signé. Le catalogue peut utiliser « moyen non encore activé » dans les maquettes.
6. Les logos opérateurs ne doivent apparaître que dans des contextes de paiement appropriés et selon les chartes de marque.
