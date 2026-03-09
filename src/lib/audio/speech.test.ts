import { describe, it, expect, vi, beforeEach } from "vitest";
import { speakEvent, setSpeechEnabled, isSpeechEnabled, getRandomDoneMessage } from "./speech";

const mockSpeak = vi.fn();
const mockCancel = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  setSpeechEnabled(true);
  vi.stubGlobal("speechSynthesis", { speak: mockSpeak, cancel: mockCancel });
  vi.stubGlobal("SpeechSynthesisUtterance", class {
    text = "";
    lang = "";
    rate = 1;
    pitch = 1;
    volume = 1;
    constructor(text: string) { this.text = text; }
  });
});

describe("speakEvent", () => {
  it("calls speechSynthesis.speak for FR work_start", () => {
    speakEvent("work_start", "fr");
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.lang).toBe("fr-FR");
  });

  it("calls speechSynthesis.speak for EN prepare", () => {
    speakEvent("prepare", "en");
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.lang).toBe("en-US");
  });

  it("calls speechSynthesis.speak for ES rest_start", () => {
    speakEvent("rest_start", "es");
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.lang).toBe("es-ES");
  });

  it("falls back to FR for unknown locale", () => {
    speakEvent("rest_start", "de");
    expect(mockSpeak).toHaveBeenCalledTimes(1);
  });

  it("sets rate to 1.1", () => {
    speakEvent("prepare", "fr");
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.rate).toBe(1.1);
  });

  it("does not speak when disabled", () => {
    setSpeechEnabled(false);
    speakEvent("work_start", "fr");
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it("anti-repetition: never same phrase twice in a row", () => {
    const texts = new Set<string>();
    let prev = "";
    for (let i = 0; i < 20; i++) {
      speakEvent("work_start", "fr");
      const text = mockSpeak.mock.calls[i][0].text;
      if (prev) expect(text).not.toBe(prev);
      prev = text;
      texts.add(text);
    }
    // Should have used multiple phrases
    expect(texts.size).toBeGreaterThan(1);
  });
});

describe("speakEvent countdown", () => {
  it("speaks countdown_3 in FR", () => {
    speakEvent("countdown_3", "fr");
    expect(mockSpeak.mock.calls[0][0].text).toBe("Trois");
  });

  it("speaks countdown_2 in EN", () => {
    speakEvent("countdown_2", "en");
    expect(mockSpeak.mock.calls[0][0].text).toBe("Two");
  });

  it("speaks countdown_1 in ES", () => {
    speakEvent("countdown_1", "es");
    expect(mockSpeak.mock.calls[0][0].text).toBe("Uno");
  });
});

describe("setSpeechEnabled / isSpeechEnabled", () => {
  it("toggles speech on/off", () => {
    expect(isSpeechEnabled()).toBe(true);
    setSpeechEnabled(false);
    expect(isSpeechEnabled()).toBe(false);
    setSpeechEnabled(true);
    expect(isSpeechEnabled()).toBe(true);
  });
});

describe("getRandomDoneMessage", () => {
  it("returns a string for FR", () => {
    const msg = getRandomDoneMessage("fr");
    expect(typeof msg).toBe("string");
    expect(msg.length).toBeGreaterThan(0);
  });

  it("returns a string for EN", () => {
    const msg = getRandomDoneMessage("en");
    expect(typeof msg).toBe("string");
  });
});
