export interface SlidePayload {
  type: "slide";
  text: string;
  subtext?: string;
  fontFamily?: string;
  fontSize?: number;
}

export type ProjectionMessage =
  | SlidePayload
  | { type: "blank" }
  | { type: "logo" }
  | { type: "freeze" }
  | { type: "output-ready" };

const CHANNEL_NAME = "luminary-projection";
let outputWindow: Window | null = null;
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export function sendToProjection(message: ProjectionMessage): void {
  getChannel().postMessage(message);
  if (outputWindow && !outputWindow.closed) {
    outputWindow.postMessage(message, "*");
  }
}

export async function openProjectionWindow(): Promise<Window | null> {
  const features = "fullscreen=yes,menubar=no,toolbar=no,location=no,status=no";

  if ("getScreenDetails" in window.screen) {
    try {
      const screenDetails = await (
        window.screen as Screen & {
          getScreenDetails: () => Promise<{
            screens: Array<
              Screen & {
                isPrimary?: boolean;
                availLeft: number;
                availTop: number;
                availWidth: number;
                availHeight: number;
              }
            >;
          }>;
        }
      ).getScreenDetails();
      const displays = screenDetails.screens;
      const projector = displays.find((s) => !s.isPrimary) ?? displays[0];
      if (projector) {
        outputWindow = window.open(
          "/output.html",
          "luminary-output",
          `${features},left=${projector.availLeft},top=${projector.availTop},width=${projector.availWidth},height=${projector.availHeight}`,
        );
        return outputWindow;
      }
    } catch {
      // fall through to popup
    }
  }

  outputWindow = window.open("/output.html", "luminary-output", features);
  return outputWindow;
}

export function closeProjectionWindow(): void {
  if (outputWindow && !outputWindow.closed) outputWindow.close();
  outputWindow = null;
}

export function projectSlide(
  text: string,
  subtext?: string,
  fontFamily?: string,
  fontSize?: number,
): void {
  sendToProjection({ type: "slide", text, subtext, fontFamily, fontSize });
}

export function projectBlank(): void {
  sendToProjection({ type: "blank" });
}

export function projectLogo(): void {
  sendToProjection({ type: "logo" });
}

export function projectFreeze(): void {
  sendToProjection({ type: "freeze" });
}
