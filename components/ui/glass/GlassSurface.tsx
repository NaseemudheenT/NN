"use client";

/**
 * The one glass component. Everything else is this with different numbers.
 *
 * `material` picks the thickness — a pane for navigation, a panel for a sheet,
 * a lens over imagery, a block where content must win. `dispersive` adds the
 * chromatic edge, which earns its extra paint on large surfaces and is wasted
 * on small ones.
 *
 * Polymorphic on purpose: a glass surface is sometimes a div, sometimes a
 * button, sometimes a nav. Forcing it to be a div and nesting the real element
 * inside doubles the DOM and throws away the semantics.
 */

import {
  forwardRef,
  type ComponentPropsWithRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type FC,
  type ReactNode,
} from "react";

export type GlassMaterial = "pane" | "panel" | "block" | "lens";

interface GlassOwnProps {
  /** The element to render. Defaults to a div. */
  as?: ElementType;
  material?: GlassMaterial;
  /** The chromatic edge. Worth it on large surfaces. */
  dispersive?: boolean;
  /** Corner radius in pixels. NN is square by default. */
  radius?: number;
  className?: string;
  children?: ReactNode;
}

export type GlassSurfaceProps = GlassOwnProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof GlassOwnProps>;

export const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(
  function GlassSurface(
    { as, material = "panel", dispersive = false, radius, className = "", children, style, ...rest },
    ref,
  ) {
    /* ElementType is a union of every intrinsic tag, and TypeScript
       intersects their props down to `never`. Narrowing to one concrete
       signature is the standard way out; the public props are still typed
       by GlassSurfaceProps at the call site. */
    const Tag = (as ?? "div") as unknown as FC<ComponentPropsWithRef<"div">>;

    return (
      <Tag
        ref={ref}
        className={["glass", `glass--${material}`, dispersive ? "glass--dispersive" : "", className]
          .filter(Boolean)
          .join(" ")}
        style={
          radius != null
            ? ({ "--glass-radius": `${radius}px`, ...style } as CSSProperties)
            : style
        }
        {...rest}
      >
        {children}
      </Tag>
    );
  },
);
