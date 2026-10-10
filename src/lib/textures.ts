import * as THREE from "three";

function make(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

export const softDotTexture = () =>
  make(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  });

/** White assignment-card face; instance colour tints it. */
export const cardTexture = () =>
  make(256, 170, (c) => {
    c.clearRect(0, 0, 256, 170);
    roundRect(c, 4, 4, 248, 162, 18);
    c.fillStyle = "rgba(255,255,255,0.92)";
    c.fill();
    c.fillStyle = "rgba(0,0,0,0.22)";
    roundRect(c, 4, 4, 248, 40, 18);
    c.fill();
    c.fillRect(4, 26, 248, 18);
    c.fillStyle = "rgba(0,0,0,0.28)";
    [66, 94, 122].forEach((y, i) => {
      roundRect(c, 24, y, i === 2 ? 110 : 150, 12, 6);
      c.fill();
    });
    c.fillStyle = "rgba(255,255,255,0.8)";
    c.beginPath();
    c.arc(30, 24, 8, 0, Math.PI * 2);
    c.fill();
  });

export const warnTexture = () =>
  make(128, 128, (c) => {
    c.fillStyle = "#e8b96a";
    c.beginPath();
    c.moveTo(64, 10);
    c.lineTo(120, 112);
    c.lineTo(8, 112);
    c.closePath();
    c.lineJoin = "round";
    c.lineWidth = 10;
    c.strokeStyle = "#e8b96a";
    c.stroke();
    c.fill();
    c.fillStyle = "#3b0d0d";
    roundRect(c, 58, 42, 12, 36, 6);
    c.fill();
    c.beginPath();
    c.arc(64, 94, 7, 0, Math.PI * 2);
    c.fill();
  });

export const checkTexture = () =>
  make(128, 128, (c) => {
    c.fillStyle = "#e8d1a7";
    c.beginPath();
    c.arc(64, 64, 58, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#2a1708";
    c.lineWidth = 12;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(36, 66);
    c.lineTo(57, 88);
    c.lineTo(93, 44);
    c.stroke();
  });
