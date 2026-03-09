import { describe, it, expect, vi, beforeEach } from "vitest";
import { speak, speakCountdown } from "./speech";

const mockSpeak = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("speechSynthesis", { speak: mockSpeak });
  vi.stubGlobal("SpeechSynthesisUtterance", class {
    text = "";
    lang = "";
    rate = 1;
    volume = 1;
    constructor(text: string) { this.text = text; }
  });
});

describe("speak", () => {
  it("calls speechSynthesis.speak with FR text", () => {
    speak("work", "fr");
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.text).toBe("C'est parti !");
    expect(utterance.lang).toBe("fr-FR");
  });

  it("calls speechSynthesis.speak with EN text", () => {
    speak("work", "en");
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.text).toBe("Go!");
    expect(utterance.lang).toBe("en-US");
  });

  it("calls speechSynthesis.speak with ES text", () => {
    speak("done", "es");
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.text).toBe("¡Buen trabajo, terminaste!");
    expect(utterance.lang).toBe("es-ES");
  });

  it("falls back to FR for unknown locale", () => {
    speak("rest", "de");
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.text).toBe("Repos");
  });

  it("sets rate to 1.1", () => {
    speak("prepare", "fr");
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.rate).toBe(1.1);
  });
});

describe("speakCountdown", () => {
  it("speaks 'Trois' for 3", () => {
    speakCountdown(3, "fr");
    expect(mockSpeak.mock.calls[0][0].text).toBe("Trois");
  });

  it("speaks 'Two' for 2 in EN", () => {
    speakCountdown(2, "en");
    expect(mockSpeak.mock.calls[0][0].text).toBe("Two");
  });

  it("speaks 'Uno' for 1 in ES", () => {
    speakCountdown(1, "es");
    expect(mockSpeak.mock.calls[0][0].text).toBe("Uno");
  });

  it("does nothing for numbers > 3", () => {
    speakCountdown(5, "fr");
    expect(mockSpeak).not.toHaveBeenCalled();
  });
});
