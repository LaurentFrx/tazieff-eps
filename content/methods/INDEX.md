# Index des méthodes d'entraînement — Tazieff EPS
Source : Diapo Muscu'EPS de Frédérique Proisy (Lycée Haroun Tazieff)
Généré le : 22 février 2026

## Structure des fichiers
Emplacement cible : /content/methods/
Convention : {slug}.mdx

## Schéma frontmatter
- slug: string
- titre: string
- soustitre?: string
- categorie: endurance-de-force | gain-de-volume | gain-de-puissance
- niveau_minimum: seconde | premiere | terminale
- description: string
- scores: endurance/hypertrophie/force/puissance (sur 5)
- parametres: series, repetitions, intensite, recuperation, duree (optionnel)
- exercices_compatibles: slugs
- methodes_complementaires: slugs
- timer?: boolean (AMRAP et EMOM uniquement)

## Couleurs catégories
- endurance-de-force : orange #F97316
- gain-de-volume     : bleu   #3B82F6
- gain-de-puissance  : vert   #22C55E

## Endurance de Force (7)
| Slug             | Titre                | Niveau min | Timer |
|------------------|----------------------|------------|-------|
| charge-constante | Charge Constante     | seconde    | non   |
| pyramide         | Méthode Pyramidale   | seconde    | non   |
| triple-tri-set   | Triple Tri-Set       | premiere   | non   |
| defi-centurion   | Défi Centurion       | premiere   | non   |
| amrap            | AMRAP                | premiere   | oui   |
| emom             | EMOM                 | premiere   | oui   |
| circuit-training | Circuit Training     | seconde    | non   |

## Gain de Volume / Hypertrophie (8)
| Slug               | Titre                         | Niveau min | Timer |
|--------------------|-------------------------------|------------|-------|
| drop-set           | Drop Set                      | premiere   | non   |
| super-set          | Super Set                     | premiere   | non   |
| serie-brulante     | Série Brûlante                | premiere   | non   |
| rest-pause         | Rest Pause                    | premiere   | non   |
| aps                | APS (Antagonist Paired Set)   | premiere   | non   |
| pre-activation     | Pré-Activation                | premiere   | non   |
| double-progression | Double Progression            | premiere   | non   |
| demi-pyramide      | 1/2 Pyramide (volume)         | premiere   | non   |

## Gain de Puissance (4)
| Slug                | Titre                 | Niveau min | Timer |
|---------------------|-----------------------|------------|-------|
| methode-bulgare     | Méthode Bulgare       | terminale  | non   |
| pliometrie          | Pliométrie            | terminale  | non   |
| stato-dynamique     | Stato-Dynamique       | terminale  | non   |
| demi-pyramide-force | 1/2 Pyramide Force    | terminale  | non   |
