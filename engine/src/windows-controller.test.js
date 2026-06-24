import { describe, expect, it, vi } from "vitest";
import {
  buildStartupCommand,
  isStandaloneExecutable,
  readAutoStart,
  setAutoStart,
} from "./windows-controller.js";

describe("windows controller", () => {
  it("reconhece o executavel empacotado sem confundir com node", () => {
    expect(isStandaloneExecutable("C:\\THEBOX\\thebox-downloader.exe", "win32")).toBe(true);
    expect(isStandaloneExecutable("C:\\nodejs\\node.exe", "win32", false)).toBe(false);
    expect(isStandaloneExecutable("C:\\THEBOX\\thebox-downloader.exe", "win32", true)).toBe(true);
    expect(isStandaloneExecutable("/usr/bin/thebox-downloader", "linux")).toBe(false);
  });

  it("monta comando de startup com caminho entre aspas", () => {
    expect(buildStartupCommand("C:\\Minha Pasta\\thebox-downloader.exe"))
      .toBe('"C:\\Minha Pasta\\thebox-downloader.exe" --startup --no-open');
  });

  it("consulta a entrada de inicializacao do usuario", () => {
    const execFileSyncImpl = vi.fn(() => "THEBOX Engine    REG_SZ    valor");
    expect(readAutoStart({ platform: "win32", execFileSyncImpl })).toBe(true);
    expect(execFileSyncImpl).toHaveBeenCalledWith(
      "reg.exe",
      expect.arrayContaining(["query"]),
      expect.any(Object)
    );
  });

  it("adiciona e remove a entrada de inicializacao", () => {
    const execFileSyncImpl = vi.fn(() => "");
    setAutoStart(true, {
      executable: "C:\\THEBOX\\thebox-downloader.exe",
      platform: "win32",
      execFileSyncImpl,
    });
    expect(execFileSyncImpl.mock.calls[0][1]).toEqual(expect.arrayContaining(["add", "REG_SZ"]));

    setAutoStart(false, {
      executable: "C:\\THEBOX\\thebox-downloader.exe",
      platform: "win32",
      execFileSyncImpl,
    });
    expect(execFileSyncImpl.mock.calls[1][1]).toEqual(expect.arrayContaining(["delete"]));
  });

  it("recusa registrar o node de desenvolvimento", () => {
    expect(() => setAutoStart(true, {
      executable: "C:\\nodejs\\node.exe",
      platform: "win32",
      execFileSyncImpl: vi.fn(),
    })).toThrow(/empacotado/);
  });
});
