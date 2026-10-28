# Méthode — plante-sobriete

Comment la plante passe des tokens consommés à un état. Toutes les constantes sont dans [`hooks/calcul.ts`](hooks/calcul.ts) ; aucune n'est réglable par l'utilisateur.

## 1. Le repère : le budget numérique du jour

| Terme | Valeur | Source |
|---|---|---|
| Budget carbone individuel compatible avec l'Accord de Paris | 2 t CO₂e par personne et par an | Repère utilisé par l'ADEME |
| Part du numérique dans l'empreinte carbone française | 4,4 % (29,5 Mt CO₂e, données 2022) | ADEME-Arcep, mise à jour de janvier 2025 |
| Jours travaillés dans l'année | 218 | Forfait jours, article L3121-64 du Code du travail |
| **Budget numérique du jour** | **2 000 000 g × 4,4 % ÷ 218 ≈ 404 g CO₂e** | |

C'est le budget de **tout** le numérique d'une personne : terminaux, réseaux, vidéo, cloud et IA. La plante mesure quelle part de ce budget l'IA consomme à elle seule. Au-delà de 100 %, l'IA dépasse à elle seule tout ce que le numérique devrait émettre : c'est le seul seuil qui n'est pas une convention.

## 2. Des tokens aux grammes

| Terme | Valeur | Source ou hypothèse |
|---|---|---|
| Émissions d'un token de sortie | 1,14 g CO₂e ÷ 400 tokens ≈ 2,85 mg | ACV de Mistral Large 2 (Mistral AI, Carbone 4, ADEME, 2025) : 1,14 g CO₂e et 45 mL d'eau pour une réponse de 400 tokens |
| Poids d'un token d'entrée | 0,2 × un token de sortie | Rapport des prix Claude (entrée = 1/5 de la sortie) |
| Poids d'une écriture dans le cache | 0,25 × un token de sortie | Rapport des prix Claude (1,25 × l'entrée) |
| Poids d'une lecture du cache | 0,02 × un token de sortie | Rapport des prix Claude (0,1 × l'entrée) |
| Taille relative des modèles | Haiku 1/3, Sonnet 1, Opus 5/3 | Rapport des prix entre gammes ; **hypothèse : Sonnet ≙ Mistral Large 2** |

Les prix servent ici d'indicateur du calcul consommé, faute de données publiées par Anthropic. Ce sont les deux hypothèses les plus fragiles de la méthode.

## 3. Le rythme : 24 heures glissantes

Chaque fin de tour, sous-agents compris et dans n'importe quelle session, ajoute ses grammes à un journal commun (stockage du mod, partagé entre les sessions). Seuls les tours des 24 dernières heures comptent. Il n'y a pas de remise à zéro à heure fixe : la plante reverdit au fur et à mesure que les anciens tours sortent de la fenêtre.

## 4. Le mois et l'année

Chaque tour s'ajoute aussi au cumul de son jour (heure locale). On affiche la part déjà consommée par l'IA :

| Période | Budget numérique de référence |
|---|---|
| Mois civil en cours | 2 t × 4,4 % ÷ 12 ≈ 7,3 kg CO₂e |
| Année civile en cours | 2 t × 4,4 % = 88 kg CO₂e |

Ce sont des cumuls depuis le début du mois et de l'année, pas des rythmes : ils ne font que monter, puis repartent de zéro le 1er du mois et le 1er janvier. Seuls l'année en cours et la précédente sont conservées.

## 5. Les paliers

| Palier | Part du budget numérique du jour |
|---|---|
| En fleur | ≤ 10 % |
| Feuillue | ≤ 25 % |
| Jaunit | ≤ 50 % |
| Fanée | ≤ 100 % |
| Desséchée | > 100 % |

Les paliers intermédiaires sont une **convention de design**, et non une donnée.

## Limites

- Anthropic ne publie pas l'empreinte de ses modèles. Les facteurs viennent de Mistral et sont transposés à Claude.
- L'ACV de Mistral inclut une part de l'entraînement et le mix électrique de ses data centers ; celui des data centers de Claude diffère.
- L'incertitude globale est d'un facteur de l'ordre de 10 : l'indice compare des usages entre eux, il ne remplace pas un bilan carbone.

## Sources

- [ADEME-Arcep, Observatoire des impacts environnementaux du numérique](https://www.arcep.fr/la-regulation/grands-dossiers-thematiques-transverses/observatoire-impacts-environnementaux-numerique-arcep-ademe.html)
- [Maire-info, « L'impact environnemental du numérique de plus en plus important en France » (janvier 2025)](https://www.maire-info.com/numerique/limpact-environnemental-du-numerique-de-plus-en-plus-important-en-france-art26-29270)
- [The Decoder, « Mistral AI publishes the first comprehensive life cycle assessment of a large language model »](https://the-decoder.com/mistral-ai-publishes-the-first-comprehensive-life-cycle-assessment-of-a-large-language-model/)
- [DeepLearning.AI, *The Batch* : ACV de Mistral Large 2](https://www.deeplearning.ai/the-batch/french-ai-startup-discloses-full-lifecycle-consumption-and-emissions-for-mistral-large-2)
