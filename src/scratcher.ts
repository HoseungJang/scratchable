import { Events } from "./events";
import { Renderer, RendererOptions } from "./renderer";

export type ScratcherEventName = "scratch";

export interface ScratcherEvent {
  percentage: number;
}

export type ScratcherEventHandler = (e: ScratcherEvent) => void;

export interface ScratcherOptions extends RendererOptions {
  container: HTMLElement;
  radius?: number;
  onScratch?: ScratcherEventHandler;
}

export class Scratcher {
  protected readonly container: HTMLElement;
  private readonly renderer: Renderer;
  private readonly radius: number;
  public readonly events: Events<ScratcherEventName, ScratcherEvent>;

  private prevScratchPosition: { x: number; y: number } | null = null;

  constructor(options: ScratcherOptions) {
    this.container = options.container;
    this.renderer = new Renderer(options);
    this.radius = options.radius ?? 50;
    this.events = new Events(() => ({ percentage: this.renderer.percentage }));

    if (options.onScratch != null) {
      this.events.on("scratch", options.onScratch);
    }
  }

  protected move(x: number, y: number) {
    this.renderer.circle(x, y, this.radius);

    if (this.prevScratchPosition != null) {
      this.renderer.line(this.prevScratchPosition, { x, y }, this.radius * 2);
    }

    this.prevScratchPosition = { x, y };
    this.events.emit("scratch");
  }

  protected end() {
    this.prevScratchPosition = null;
  }

  public async render() {
    await this.renderer.render();
  }

  public destroy() {
    this.renderer.destroy();
    this.events.purge();
  }
}

export class TouchScratcher extends Scratcher {
  constructor(options: ScratcherOptions) {
    super(options);
    this.container.style.touchAction = "none";
  }

  private touchmove = (e: TouchEvent) => {
    const { left, top } = this.container.getBoundingClientRect();
    const { clientX, clientY } = e.changedTouches[0];

    const x = clientX - left;
    const y = clientY - top;
    this.move(x, y);
  };

  private touchend = () => {
    this.end();
  };

  public async render() {
    this.container.addEventListener("touchmove", this.touchmove);
    this.container.addEventListener("touchend", this.touchend);
    await super.render();
  }

  public destory() {
    this.container.removeEventListener("touchmove", this.touchmove);
    this.container.removeEventListener("touchend", this.touchend);
    super.destroy();
  }
}

export class MouseScratcher extends Scratcher {
  constructor(options: ScratcherOptions) {
    super(options);
  }

  private mousemove = (e: MouseEvent) => {
    if (e.buttons === 0) {
      this.end();
      return;
    }

    const { left, top } = this.container.getBoundingClientRect();
    const { clientX, clientY } = e;

    const x = clientX - left;
    const y = clientY - top;
    this.move(x, y);
  };

  public async render() {
    this.container.addEventListener("mousemove", this.mousemove);
    await super.render();
  }

  public destroy() {
    this.container.removeEventListener("mousemove", this.mousemove);
    super.destroy();
  }
}
