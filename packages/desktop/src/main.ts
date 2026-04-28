import { LitElement, css, html } from 'lit';
import { KERNEL_VERSION } from '@episfolio/kernel';

class HelloEpisfolio extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
      color: #1a1a1a;
    }
    h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
    }
    p {
      margin: 0;
      color: #555;
      font-size: 0.95rem;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.85rem;
      background: #f5f5f5;
      padding: 0.1rem 0.35rem;
      border-radius: 0.2rem;
    }
  `;

  override render() {
    return html`
      <h1>Episfolio</h1>
      <p>Phase 1 scaffold OK. kernel <code>${KERNEL_VERSION}</code></p>
    `;
  }
}

customElements.define('hello-episfolio', HelloEpisfolio);
