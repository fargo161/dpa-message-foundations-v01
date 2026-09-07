// Public snapshot projection only: never chooses expressions or changes game state.
const NS = "http://www.w3.org/2000/svg";
const layerOrder = ["mouth", "right_eye", "left_eye", "right_brow", "left_brow"];
export function createFaceRenderer(container) {
  return {
    render(catalog, face, character = { id: "marcus", name: "Marcus" }) {
      container.replaceChildren();
      container.setAttribute("aria-label", `${character.name}: ${face?.visibleCaption || "A resting expression."}`);
      if (!catalog?.canvas || !catalog?.base || character.id !== "marcus") {
        const placeholder = document.createElement("p"); placeholder.className = "fixture-portrait";
        placeholder.textContent = `${character.name} · Neutral fixture portrait · Character art not supplied`;
        container.append(placeholder); return;
      }
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", `0 0 ${catalog.canvas.width} ${catalog.canvas.height}`);
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet"); svg.setAttribute("aria-hidden", "true");
      function image(asset) {
        if (!asset || !/^\/assets\/marcus\/[a-zA-Z0-9_-]+\.webp$/.test(asset.src)) return;
        const element = document.createElementNS(NS, "image");
        ["x", "y", "width", "height"].forEach(key => element.setAttribute(key, String(asset[key])));
        element.setAttribute("href", asset.src); svg.append(element);
      }
      image(catalog.base);
      if (face?.catalogVersion === catalog.version) layerOrder.forEach(slot => {
        const selection = face.slots?.find(entry => entry.slot === slot);
        if (selection?.assetId) image(catalog.assets.find(asset => asset.assetId === selection.assetId && asset.slot === slot));
      });
      container.append(svg);
    },
  };
}
