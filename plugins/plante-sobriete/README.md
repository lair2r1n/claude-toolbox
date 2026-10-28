# plante-sobriete

Une petite plante, dans sa propre barre au-dessus du champ de saisie de Claude Code (calée à droite), qui montre la sobriété de ton usage de l'IA. Tant que tu restes à un rythme raisonnable, elle reste en fleur. Si tu enchaînes les tours à un rythme trop élevé, elle jaunit, fane, puis se dessèche. Quand tu ralentis, elle reverdit.

Le repère n'est pas réglable : c'est le **budget numérique quotidien compatible avec l'Accord de Paris**, le même pour tout le monde. La méthode et ses sources sont dans [METHODE.md](METHODE.md).

| Plante | L'IA a consommé, sur les 24 dernières heures… |
|---|---|
| En fleur | ≤ 10 % du budget numérique du jour |
| Feuillue | ≤ 25 % |
| Jaunit | ≤ 50 % |
| Fanée | ≤ 100 % |
| Desséchée | plus que tout le budget numérique du jour |

- **Dans l'app desktop**, la plante est dessinée sur 24 px, avec le pourcentage à côté. Le survol affiche les grammes de CO₂e estimés et le repère.
- **Dans le terminal**, une jauge texte remplace le dessin : `Sobriété IA ▰▰▰▰▱▱▱▱▱▱ 38 % jaunit`.
- Le compte est **global** : toutes les sessions et tous les sous-agents de la machine alimentent la même plante, sur 24 heures glissantes. Ouvrir une nouvelle session ne la fait donc pas repartir à neuf.

Le mod fonctionne seul. Avec [`barre-tokens`](../barre-tokens), sa barre s'affiche juste sous celle des tokens.

## Installation

```
/plugin install plante-sobriete --marketplace lair2r1n/claude-toolbox
```

## Ce que la plante n'est pas

Ce n'est pas une mesure : c'est un **indice** fondé sur des facteurs publiés par d'autres fournisseurs, puisque Anthropic ne publie pas l'impact de ses modèles. L'incertitude est d'un facteur de l'ordre de 10. Ne pas en tirer de chiffres de bilan carbone.
