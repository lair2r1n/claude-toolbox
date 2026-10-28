# plante-sobriete

Une petite plante, dans sa propre barre au-dessus du champ de saisie de Claude Code (calée à droite), qui montre la sobriété de ton usage de l'IA. Tant que tu restes à un rythme raisonnable, elle reste en fleur. Si tu enchaînes les tours à un rythme trop élevé, elle jaunit, fane, puis se dessèche. Quand tu ralentis, elle reverdit.

Le repère n'est pas réglable : c'est le **budget numérique quotidien compatible avec l'Accord de Paris**, le même pour tout le monde. La méthode et ses sources sont dans [METHODE.md](METHODE.md).

Le pourcentage affiché est la part de ce **budget du jour** consommée par l'IA sur les 24 dernières heures. La plante, elle, est graduée jusqu'à dix fois ce budget (≈ 4 kg CO₂e).

| Plante | Budget numérique du jour |
|---|---|
| En fleur | ≤ 250 % |
| Feuillue | ≤ 500 % |
| Jaunit | ≤ 750 % |
| Fanée | ≤ 1 000 % |
| Desséchée | > 1 000 % |

- **Dans l'app desktop**, la plante est dessinée sur 24 px, avec le pourcentage du budget du jour à côté. Le survol affiche les grammes de CO₂e et l'eau estimés, et le seuil où la plante se dessèche.
- **Dans le terminal**, une jauge texte remplace le dessin : `Sobriété IA ▰▰▰▰▱▱▱▱▱▱ 380 % feuillue · ☁️ 1,5 kg CO₂e · 💧 60 L · mois 12 % · année 3 %`.
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
