# THEbox Downloader (motor local)

Motor local **opcional** do THEBOX. Roda só em `127.0.0.1`, sem telemetria,
sem upload — executa yt-dlp + ffmpeg e grava na pasta que você escolher.
A interface continua sendo o THEBOX (web); este motor só faz o trabalho que o
navegador não consegue.

## Rodar

Requer Node.js 20+. O yt-dlp e o ffmpeg são baixados automaticamente no primeiro
uso (o ffmpeg só se ainda não estiver no PATH).

```bash
cd engine
node src/index.js                 # pasta padrao: ~/Downloads/THEBOX
node src/index.js --out D:/videos --port 7421
```

Ao subir, ele abre o THEBOX no navegador **já autorizado**: o token vai no
fragmento da URL (`#thebox-token=...`), que nunca é enviado a nenhum servidor.
Não há token para copiar à mão.

## API (127.0.0.1:7421)

| Rota | Método | Auth | Descrição |
|------|--------|------|-----------|
| `/health` | GET | não | presença de yt-dlp/ffmpeg + pasta |
| `/analyze` | POST | token | metadados e formatos (yt-dlp, multi-plataforma) |
| `/download` | POST | token | inicia download, retorna `jobId` |
| `/direct` | POST | token | baixa um arquivo direto (burla CORS) |
| `/convert` | POST | token | converte mídia com ffmpeg (corpo = arquivo) |
| `/ocr` | POST | token | extrai texto de imagem com Tesseract (PT/EN/ES) |
| `/file/:id` | GET | token | stream do arquivo concluído para o navegador salvar |
| `/progress/:id` | GET (SSE) | token (query) | progresso em tempo real |
| `/cancel/:id` | POST | token | cancela um job |

Autorização: requisições com `Origin` na allowlist são aceitas sem token (o
navegador não forja `Origin`); fora disso, exige o token.

## Binário único (Node SEA)

```bash
cd engine && npm install && npm run build:sea
# -> engine/dist/thebox-downloader(.exe)
```

Gera um executável standalone (não precisa de Node instalado para rodar). O
worker e os cores WASM do OCR ficam incorporados ao SEA e são extraídos para a
pasta temporária durante a execução. O yt-dlp e o ffmpeg são baixados para `bin/`
no primeiro uso (Windows/Linux; no macOS o ffmpeg deve estar no PATH, ex.: brew).
Sem ffmpeg o downloader ainda funciona, mas cai para o melhor formato único
(~720p) e não converte para mp3. No Windows o binário sai sem assinatura (aviso
do SmartScreen); no macOS é preciso reassinar com `codesign`.

Tags `engine-v*` acionam `.github/workflows/release-engine.yml`, que testa,
compila e publica `thebox-downloader.exe` no GitHub Releases.

## Segurança

- Bind apenas em `127.0.0.1`.
- Token aleatório por execução (`crypto`).
- Allowlist de `Origin` (GitHub Pages, tche.studio, localhost dev).
- Validação de `Host` loopback → bloqueia DNS-rebinding.
- Headers de Private Network Access (PNA) para o preflight do Chrome.

## Testes

```bash
cd engine && npm install && npm test   # ou: npx vitest run engine
```
