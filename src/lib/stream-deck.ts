type PropertyInspectorEvent = { event: "getVehicles" };

export const isPropertyInspectorEvent = (
  x: unknown,
): x is PropertyInspectorEvent => {
  return !!x && typeof x === "object" && "event" in x;
};

export const createRingSVG = (value: number) => {
  const size = 100;
  const stroke = 10;
  const track = "#171717";
  const color = "#22c55e";
  const p = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - p / 100);

  const linecap = p === 0 ? "butt" : "round";

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Track -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${r}"
          fill="none" stroke="${track}" stroke-width="${stroke}" />
  <!-- Progress -->
  <g transform="rotate(-90 ${size / 2} ${size / 2})">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}"
            fill="none" stroke="${color}" stroke-width="${stroke}"
            stroke-linecap="${linecap}"
            stroke-dasharray="${c}" stroke-dashoffset="${offset}" />
  </g>
</svg>`.trim();
};
