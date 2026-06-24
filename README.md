<p align="center">
  <img src="./public/thebox-logo.svg" width="420" alt="THEBOX" />
</p>

THEBOX is a collection of small file and browser tools I made because I got tired of opening iLovePDF, Convertio, random QR generators and whatever other single-purpose website happened to rank first on Google.

There is no product thesis here. These are tools I personally use, or tools I used at least once and did not feel like searching for again.

The honest summary: **it is a toolbox. It runs locally. That is the whole idea.**

**Live version:** https://mmd-marcelo.github.io/theBOX/

---

## What is actually here

The interface groups a fairly ordinary set of utilities:

- image conversion, compression, background removal, EXIF cleanup, color picking and raster-to-vector tracing
- PDF conversion, merging, splitting, compression, editing and password handling
- audio cutting and media conversion
- QR codes, passwords, hashes, UUIDs, fake data and other generators
- CSV/JSON conversion, text transforms and OCR
- viewers for PDF, DOCX, PowerPoint, Excel, images, archives and source code
- downloaders for supported web sources

Some modules are more complete than others. The PDF and image tools cover the cases I actually encounter. The generators do exactly what their names suggest. A few things are probably overbuilt for how often I will use them. That is fine.

Nothing was added because of market research. Nothing here needs a pricing page.

## Local means local

Most tools run entirely in the browser. Files are read into memory, processed and returned without being uploaded to THEBOX or to some storage service.

That includes the image tools, PDF tools, viewers, VTracer vectorization and background removal. The background-removal model is self-hosted and runs on the device. It is not small, and the first load is not instant. That is the price of not sending the image somewhere else.

The exceptions are the tools that are impractical inside a browser:

- video and audio conversion through native FFmpeg
- web downloaders through yt-dlp
- heavier OCR through Tesseract

Those use the optional **THEBOX Engine**, a local executable that listens only on **127.0.0.1**. The browser talks to it on the same computer. It does not turn THEBOX into a cloud service.

## The engine

The engine is not anything particularly clever. It is mostly yt-dlp, FFmpeg, Tesseract and a few supporting files running behind a small localhost bridge. Those libraries do the actual work.

The executable is simply the most convenient way I found to use them in my day-to-day life without opening a terminal, remembering commands or wiring the same scripts together again. It gives THEBOX one button to turn the bridge on or off and one checkbox to start it with Windows.

Download the latest Windows build from the application or from [GitHub Releases](https://github.com/MMD-Marcelo/theBOX/releases/latest). Put it in whatever folder you intend to keep it, then run it. Closing the window sends it to the system tray instead of stopping it.

The website detects the engine through **127.0.0.1**. There is no folder to select, token to paste or administrator permission involved. If you move the executable later, uncheck and check **Start with Windows** again so the saved path is updated.

If the engine is not running, the browser-only tools continue to work.

## What this is not

- It is not a professional PDF editor.
- It is not Adobe, Affinity, FFmpeg or ImageMagick with a better UI.
- It does not promise perfect conversion for every malformed file ever produced.
- It is not a public upload service.
- It is not a serious attempt to compete with the websites it replaces for me.

If a dedicated application does a job better, use the dedicated application. THEBOX exists for the boring conversions and inspections that should not require an account, an upload queue or six search results full of ads.

## Stack

React, Vite, Canvas API, Web Audio API, pdf-lib, qpdf-wasm, PDF.js, VTracer WASM, ONNX Runtime Web, Tesseract, FFmpeg and yt-dlp.

There are more dependencies than the premise deserves. They save me from reopening the same websites, so they stay.
