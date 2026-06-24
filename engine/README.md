# THEbox Downloader (motor local)

Motor local **opcional** do THEBOX. Roda só em `127.0.0.1`, sem telemetria,
sem upload — executa yt-dlp + ffmpeg e grava na pasta que você escolher.
A interface continua sendo o THEBOX (web); este motor só faz o trabalho que o
navegador não consegue.

## Rodar

Requer Node.js 20+. `ffmpeg` no PATH (ou em `engine/bin/`). O yt-dlp é baixado
automaticamente no primeiro uso.

```bash
cd engine
node src/index.js                 # pasta padrao: ~/Downloads/THEBOX
node src/index.js --out D:/videos --port 7421
```

Ao subir, ele imprime um **token**. Cole esse token no THEBOX (ferramenta
Downloaders) para autorizar a comunicação.

## API (127.0.0.1:7421)

| Rota | Método | Auth | Descrição |
|------|--------|------|-----------|
| `/health` | GET | não | presença de yt-dlp/ffmpeg + pasta |
| `/analyze` | POST | token | metadados e formatos (yt-dlp, multi-plataforma) |
| `/download` | POST | token | inicia download, retorna `jobId` |
| `/direct` | POST | token | baixa um arquivo direto (burla CORS) |
| `/convert` | POST | token | converte mídia com ffmpeg (corpo = arquivo) |
| `/ocr` | POST | token | extrai texto de imagem com Tesseract (PT/EN/ES) |
| `/linkcheck` | POST | token | crawl de links quebrados |
| `/whois` | POST | token | WHOIS TCP porta 43 (referral IANA) |
| `/images` | POST | token | lista imagens de uma página |
| `/geoip` | POST | token | país por IPv4 (base CC0 local) |
| `/progress/:id` | GET (SSE) | token (query) | progresso em tempo real |
| `/cancel/:id` | POST | token | cancela um job |

## Binário único (Node SEA)

```bash
cd engine && npm install && npm run build:sea
# -> engine/dist/thebox-downloader(.exe)
```

Gera um executável standalone (não precisa de Node instalado para rodar). O
worker e os cores WASM do OCR ficam incorporados ao SEA e são extraídos para a
pasta temporária durante a execução. O yt-dlp é baixado para `bin/` no primeiro
uso; o FFmpeg precisa estar no PATH ou em `bin/`. No Windows o binário sai sem
assinatura (aviso do SmartScreen); no macOS é preciso reassinar com `codesign`.

Tags `engine-v*` acionam `.github/workflows/release-engine.yml`, que testa,
compila e publica `thebox-downloader.exe` no GitHub Releases.

## GeoIP

País por IPv4 usando a base **CC0** `@ip-location-db/geo-whois-asn-country`
(domínio público, sem conta/licença MaxMind). Cidade e ASN ficam fora do escopo.

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
