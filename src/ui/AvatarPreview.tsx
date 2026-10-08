import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PixelPipeline } from '../engine/pipeline';
import { buildAvatar, animateAvatar, disposeAvatar, type AvatarRig } from '../engine/avatar';
import { buildPet, animatePet, type PetRig } from '../engine/pets';
import type { AvatarConfig, PetKind } from '../engine/avatarTypes';
import { VoxBuilder, meshFrom } from '../engine/vox';

/** Turntable preview of a voxel avatar, rendered through the same pixel pipeline as the world. */
export function AvatarPreview({ avatar, pet = 'none', size = 220, pixel = 4, bg = '#efe2c4', wave = false }: { avatar: AvatarConfig; pet?: PetKind; size?: number; pixel?: number; bg?: string; wave?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef<{ pipe: PixelPipeline; scene: THREE.Scene; cam: THREE.OrthographicCamera; rig: AvatarRig | null; pet: PetRig | null; raf: number; rot: number; drag: number | null } | null>(null);

  // set up once
  useEffect(() => {
    const host = ref.current!;
    const canvas = document.createElement('canvas');
    canvas.className = 'pixelated block';
    host.appendChild(canvas);
    const pipe = new PixelPipeline(canvas);
    pipe.composite.uniforms.vignette.value = 0;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bg);
    scene.add(new THREE.HemisphereLight('#fff6e6', '#8a6a4a', 2.0));
    const sun = new THREE.DirectionalLight('#fff1d6', 1.6);
    sun.position.set(3, 6, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512);
    scene.add(sun);
    const fb = new VoxBuilder();
    fb.cbox(0, -0.1, 0, 2.2, 0.1, 2.2, '#c9b28c');
    fb.cbox(0, -0.1, 0, 1.6, 0.101, 1.6, '#d9c09a');
    const floor = meshFrom(fb);
    scene.add(floor);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
    const st = { pipe, scene, cam, rig: null as AvatarRig | null, pet: null as PetRig | null, raf: 0, rot: 0.5, drag: null as number | null };
    state.current = st;
    const w = size, h = Math.round(size * 1.15);
    const rt = pipe.setSize(w, h, pixel);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ppu = rt.h / 2.0;
    cam.left = -rt.w / 2 / ppu; cam.right = rt.w / 2 / ppu; cam.top = rt.h / 2 / ppu; cam.bottom = -rt.h / 2 / ppu;
    cam.updateProjectionMatrix();
    cam.position.set(0, 3.2, 10);
    cam.lookAt(0, 0.62, 0);
    let t = 0, last = performance.now();
    const loop = (now: number) => {
      st.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      if (st.drag === null) st.rot += dt * 0.6;
      if (st.rig) {
        st.rig.root.rotation.y = st.rot;
        animateAvatar(st.rig, dt, 0, t);
        st.rig.root.position.set(st.pet ? -0.25 : 0, 0, 0);
      }
      if (st.pet) {
        st.pet.root.position.set(0.55, 0, 0.35);
        st.pet.root.rotation.y = st.rot * 0.7 - 0.4;
        animatePet(st.pet, dt, false, t);
      }
      pipe.render(scene, cam, new THREE.Vector2());
    };
    st.raf = requestAnimationFrame(loop);

    const down = (e: PointerEvent) => { st.drag = e.clientX; canvas.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (st.drag !== null) { st.rot += (e.clientX - st.drag) * 0.02; st.drag = e.clientX; } };
    const up = () => { st.drag = null; };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.style.cursor = 'grab';
    return () => {
      cancelAnimationFrame(st.raf);
      if (st.rig) disposeAvatar(st.rig);
      pipe.dispose();
      host.innerHTML = '';
      state.current = null;
    };
  }, [size, pixel, bg]);

  // rebuild avatar when config changes
  useEffect(() => {
    const st = state.current;
    if (!st) return;
    if (st.rig) { st.scene.remove(st.rig.root); disposeAvatar(st.rig); }
    st.rig = buildAvatar(avatar);
    if (wave) st.rig.state = 'wave';
    st.scene.add(st.rig.root);
  }, [avatar, wave]);

  useEffect(() => {
    const st = state.current;
    if (!st) return;
    if (st.pet) { st.scene.remove(st.pet.root); st.pet = null; }
    if (pet !== 'none') { st.pet = buildPet(pet); st.scene.add(st.pet.root); }
  }, [pet]);

  return <div ref={ref} className="inline-block border-2 border-[var(--color-ink)]" style={{ width: size + 4, lineHeight: 0 }} aria-label="Avatar preview (drag to rotate)" />;
}
