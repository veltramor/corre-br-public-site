# Protótipo Jogável

Este protótipo web valida o loop central de `Corre BR` antes da produção nativa em Unity.

## Como Rodar

Na pasta `prototype`, sirva os arquivos com um servidor local simples e abra o navegador.

```text
python -m http.server 5173
```

Depois acesse:

```text
http://localhost:5173
```

Landing de pré-cadastro:

```text
http://localhost:5173/landing.html
```

Painel de métricas locais:

```text
http://localhost:5173/analytics.html
```

## O Que Já Funciona

- Tela inicial.
- Tutorial curto.
- Grade de merge.
- Geração de itens.
- Combinação de itens iguais.
- Pedidos ativos.
- Venda e entrega de pedidos.
- Moedas.
- Energia.
- Upgrade do negócio.
- Recompensa diária.
- Anúncio recompensado simulado.
- Eventos de analytics salvos em `localStorage`.
- Página de pré-cadastro com leads salvos em `localStorage`.
- Captura de UTMs no pré-cadastro.
- Painel local de métricas e exportação JSON.
- Mapa com negócios desbloqueáveis.
- Loja simulada com passe e pacote sem anúncios.
- Manifesto PWA e service worker para teste mobile rápido.

## Por Que Web Primeiro

Unity é a recomendação para o jogo mobile final, mas o editor Unity não está instalado nesta máquina. O protótipo web permite testar loop, interface e desejo rapidamente enquanto a configuração Android/Unity é preparada.
