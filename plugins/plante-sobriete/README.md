# plante-sobriete

Une petite plante, dans sa propre barre au-dessus du champ de saisie de Claude Code (calée à droite), qui montre la sobriété de ton usage de l'IA. Tant que tu restes à un rythme raisonnable, elle reste en fleur. Si tu enchaînes les tours à un rythme trop élevé, elle jaunit, fane, puis se dessèche. Quand tu ralentis, elle reverdit.

Le repère n'est pas réglable : c'est le **budget numérique quotidien compatible avec l'Accord de Paris**, le même pour tout le monde. La méthode et ses sources sont dans [METHODE.md](METHODE.md).

Le pourcentage affiché est la part du **plafond du jour**, fixé à dix fois ce budget (≈ 4 kg CO₂e), sur les 24 dernières heures.

| Plante | Plafond du jour | Soit, en budget numérique du jour |
|---|---|---|
| En fleur | ≤ 25 % | ≤ 2,5 fois |
| Feuillue | ≤ 50 % | ≤ 5 fois |
| Jaunit | ≤ 75 % | ≤ 7,5 fois |
| Fanée | ≤ 100 % | ≤ 10 fois |
| Desséchée | > 100 % | plus de 10 fois |

- **Dans l'app desktop**, la plante est dessinée sur 24 px, avec le pourcentage du plafond à côté. Le survol affiche les grammes de CO₂e estimés, la part du plafond et celle du budget numérique du jour.
- **Dans le terminal**, une jauge texte remplace le dessin : `Sobriété IA ▰▰▰▰▱▱▱▱▱▱ 38 % feuillue · ☁️ 1,5 kg CO₂e · 💧 60 L · mois 12 % · année 3 %`.
- **CO₂ et eau** : ☁️ les émissions estimées et 💧 l'eau consommée sur les 24 dernières heures ; le survol donne aussi celles du mois et de l'année.
- **Mois et année** : à côté de la plante, la part du budget numérique du mois civil (1/12 du budget annuel) et de l'année civile déjà consommée par l'IA. Le survol donne les mêmes chiffres en grammes.
- Le compte est **global** : toutes les sessions et tous les sous-agents de la machine alimentent la même plante, sur 24 heures glissantes. Ouvrir une nouvelle session ne la fait donc pas repartir à neuf.

Le mod fonctionne seul. Avec [`barre-tokens`](../barre-tokens), sa barre s'affiche juste sous celle des tokens.

## Installation

```
/plugin install plante-sobriete --marketplace lair2r1n/claude-toolbox
```

## Ce que la plante n'est pas

Ce n'est pas une mesure : c'est un **indice** fondé sur des facteurs publiés par d'autres fournisseurs, puisque Anthropic ne publie pas l'impact de ses modèles. L'incertitude est d'un facteur de l'ordre de 10. Ne pas en tirer de chiffres de bilan carbone.
