# claude-toolbox

Mods, skills et plugins maison pour [Claude Code](https://claude.com/claude-code).

## Plugins

| Plugin | Type | Rôle |
|---|---|---|
| [`barre-tokens`](plugins/barre-tokens) | mod | Barre au-dessus du champ de saisie : projet et branche git, remplissage du contexte, tokens du dernier tour (entrée ↑, sortie ↓, part du cache), total et coût de la session, limites de débit 5 h / 7 j |
| [`plante-sobriete`](plugins/plante-sobriete) | mod | Plante qui fane quand l'usage de l'IA dépasse, sur 24 h glissantes, la part du budget numérique compatible avec l'Accord de Paris (ADEME-Arcep, ACV Mistral) |

## Installation

Dans un terminal, à l'invite de Claude Code :

```
/plugin install barre-tokens --marketplace lair2r1n/claude-toolbox
/plugin install plante-sobriete --marketplace lair2r1n/claude-toolbox
```

Répondre `y` pour ajouter la marketplace, puis choisir la portée (utilisateur par défaut).

Depuis un shell :

```bash
claude plugin install barre-tokens --marketplace lair2r1n/claude-toolbox
```

Dans l'app desktop, où `/plugin` ne fonctionne pas : cliquer sur **+** à côté du champ de saisie, puis **Plugins**, **Add marketplace** avec `lair2r1n/claude-toolbox`, puis **Add plugin**.

## Ajouter un plugin

Chaque plugin vit dans `plugins/<nom>/` avec son `.claude-plugin/plugin.json`, et se déclare dans `.claude-plugin/marketplace.json`. Un plugin peut contenir des hooks (mods), des skills (`skills/<nom>/SKILL.md`), des commandes, des agents ou des serveurs MCP.

```bash
claude plugin validate plugins/<nom>
```

## Licence

MIT
