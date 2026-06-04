import {
  defineComponent,
  h,
  inject,
  provide,
  ref,
  onMounted,
  type InjectionKey,
  type Ref,
} from "vue";
import { sprite_symbols } from "./sprite-symbols";

const SPRITE_ID = "__mf2_svg_sprite__";
const SPRITE_KEY: InjectionKey<Ref<boolean>> = Symbol("mf2-sprite-ready");

/**
 * Inject sprite SVG vào DOM (1 lần) và cung cấp cờ "ready" cho con cháu.
 * Tương đương SpriteProvider (React Context) bản gốc.
 * Dùng dưới dạng component bao ngoài: <SpriteProvider>...</SpriteProvider>
 */
export const SpriteProvider = defineComponent({
  name: "SpriteProvider",
  setup(_, { slots }) {
    const ready = ref(false);
    provide(SPRITE_KEY, ready);

    onMounted(() => {
      if (typeof document === "undefined") return;
      if (!document.getElementById(SPRITE_ID)) {
        const container = document.createElement("div");
        container.id = SPRITE_ID;
        container.innerHTML = sprite_symbols;
        container.setAttribute("aria-hidden", "true");
        container.style.cssText =
          "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
        document.body.insertBefore(container, document.body.firstChild);
      }
      ready.value = true;
    });

    return () => slots.default?.();
  },
});

export function useSpriteReady(): Ref<boolean> {
  return inject(SPRITE_KEY, ref(false));
}
