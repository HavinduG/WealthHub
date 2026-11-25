"use client";

import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  type PanInfo,
} from "motion/react";
import { useCallback, useRef, useState } from "react";

import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { DURATION, EASE, SPRING, STAGGER } from "@/lib/animation/tokens";
import type { Testimonial } from "@/lib/content/home";
import { testimonialsExtras } from "@/lib/content/testimonials-extras";
import { cn } from "@/lib/utils";

/** "Priya & Rohan S." → "PR", "Ahmed K." → "AK". */
function initials(name: string) {
  return name
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

const pad = (value: number) => String(value).padStart(2, "0");

/** Swipe further than this (px), or flick faster than this (px/s), to change slide. */
const SWIPE_DISTANCE = 80;
const SWIPE_VELOCITY = 500;

function Stars({ count, animate }: { count: number; animate: boolean }) {
  return (
    <div role="img" aria-label={testimonialsExtras.ratingLabel(count)} className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <motion.span
          key={i}
          initial={animate ? { opacity: 0, scale: 0.3, rotate: -45 } : false}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ ...SPRING.snappy, delay: animate ? 0.15 + i * STAGGER.base : 0 }}
        >
          <Star
            aria-hidden
            className={cn("size-4", i < count ? "fill-gold text-gold" : "fill-transparent text-primary-foreground/25")}
          />
        </motion.span>
      ))}
    </div>
  );
}

/** The quote, words rising in one after another. */
function Quote({ text, animate }: { text: string; animate: boolean }) {
  const words = text.split(" ");
  return (
    <p className="text-[1.35rem] leading-[1.45] font-medium tracking-[-0.015em] text-balance sm:text-[1.65rem] lg:text-[1.9rem]">
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block whitespace-pre"
          initial={animate ? { opacity: 0, y: 14, filter: "blur(6px)" } : false}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: DURATION.slow, ease: EASE.out, delay: animate ? 0.1 + i * STAGGER.tight * 0.9 : 0 }}
        >
          {i < words.length - 1 ? `${word} ` : word}
        </motion.span>
      ))}
    </p>
  );
}

/**
 * Dark emerald testimonial panel: one featured quote at a time, auto-advancing
 * with a progress bar (paused on hover, focus, or when off screen), swipeable,
 * with a member list on wide screens. Reduced motion: no autoplay, simple fades.
 *
 * Motion owns everything inside; GSAP only reveals the wrapper (see the section).
 */
export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const { reducedMotion, isLite } = useMotionPreferences();
  const total = testimonials.length;
  const [[index, direction], setSlide] = useState<[number, number]>([0, 1]);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.4 });
  const progress = useMotionValue(0);

  const goTo = useCallback(
    (next: number, dir?: number) => {
      const target = (next + total) % total;
      progress.set(0);
      setSlide(([current]) => [target, dir ?? (target > current ? 1 : -1)]);
    },
    [progress, total],
  );

  const autoplay = total > 1 && !reducedMotion;
  const paused = !autoplay || hovered || focused || !inView;

  useAnimationFrame((_, delta) => {
    if (paused) return;
    const next = progress.get() + delta / (testimonialsExtras.autoplaySeconds * 1000);
    if (next >= 1) goTo(index + 1, 1);
    else progress.set(next);
  });

  // Soft light that follows the pointer across the panel (precise pointers only).
  const glowX = useSpring(useMotionValue(70), SPRING.soft);
  const glowY = useSpring(useMotionValue(20), SPRING.soft);
  const glow = useMotionTemplate`radial-gradient(520px circle at ${glowX}% ${glowY}%, oklch(0.76 0.085 75 / 0.16), transparent 65%)`;

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (isLite) return;
    const rect = event.currentTarget.getBoundingClientRect();
    glowX.set(((event.clientX - rect.left) / rect.width) * 100);
    glowY.set(((event.clientY - rect.top) / rect.height) * 100);
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) goTo(index + 1, 1);
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) goTo(index - 1, -1);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowRight") goTo(index + 1, 1);
    else if (event.key === "ArrowLeft") goTo(index - 1, -1);
  }

  const current = testimonials[index]!;
  const animateText = !reducedMotion;
  const slideOffset = reducedMotion ? 0 : 60;

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={testimonialsExtras.eyebrow}
      onKeyDown={onKeyDown}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerMove={onPointerMove}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      className="relative isolate overflow-hidden rounded-[2rem] bg-primary text-primary-foreground shadow-float"
    >
      {/* Decor: pointer glow, fine grid, and a slow-drifting gold orb. */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: glow }} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 -bottom-32 -z-10 size-80 rounded-full bg-gold/20 blur-3xl"
        animate={reducedMotion ? undefined : { x: [0, -40, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="grid lg:grid-cols-12">
        {/* Featured quote */}
        <div className="relative flex flex-col p-6 sm:p-10 lg:col-span-8 lg:p-14">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={index}
              aria-hidden
              className="pointer-events-none absolute top-2 left-4 font-serif text-[9rem] leading-none text-gold/30 select-none sm:left-8 sm:text-[12rem]"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING.soft}
            >
              &ldquo;
            </motion.span>
          </AnimatePresence>

          <motion.div
            drag={total > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={onDragEnd}
            className="relative mt-16 grid cursor-grab touch-pan-y active:cursor-grabbing sm:mt-20"
          >
            {/* Every quote, invisible, in the same cell: the panel keeps the tallest height and never jumps. */}
            {testimonials.map((item, i) => (
              <div key={i} aria-hidden className="invisible [grid-area:1/1]">
                <div className="h-4" />
                <div className="mt-6">
                  <Quote text={item.quote} animate={false} />
                </div>
                <div className="mt-8 flex min-h-12 items-center gap-4">
                  <span className="size-12 shrink-0" />
                  <span>
                    <span className="block font-semibold">{item.name}</span>
                    <span className="block text-sm">{item.role}</span>
                  </span>
                </div>
              </div>
            ))}

            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.figure
                key={index}
                custom={direction}
                aria-live={paused ? "polite" : "off"}
                variants={{
                  enter: (dir: number) => ({ opacity: 0, x: dir * slideOffset }),
                  center: { opacity: 1, x: 0 },
                  exit: (dir: number) => ({ opacity: 0, x: dir * -slideOffset }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: DURATION.base, ease: EASE.out }}
                className="[grid-area:1/1]"
              >
                <Stars count={current.stars} animate={animateText} />
                <blockquote className="mt-6">
                  <Quote text={current.quote} animate={animateText} />
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-4">
                  <motion.span
                    initial={animateText ? { scale: 0, rotate: -90 } : false}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ ...SPRING.snappy, delay: animateText ? 0.35 : 0 }}
                    className="grid size-12 shrink-0 place-items-center rounded-full bg-gold text-sm font-semibold text-primary"
                  >
                    {initials(current.name)}
                  </motion.span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{current.name}</span>
                    {current.role && (
                      <span className="block text-sm text-primary-foreground/70">{current.role}</span>
                    )}
                  </span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </motion.div>

          {/* Controls */}
          {total > 1 && (
            <div className="mt-10 flex items-center gap-5">
              <div className="flex gap-2">
                {[
                  { label: testimonialsExtras.previous, Icon: ArrowLeft, step: -1 },
                  { label: testimonialsExtras.next, Icon: ArrowRight, step: 1 },
                ].map(({ label, Icon, step }) => (
                  <motion.button
                    key={step}
                    type="button"
                    aria-label={label}
                    onClick={() => goTo(index + step, step)}
                    whileHover={isLite ? undefined : { scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    transition={SPRING.snappy}
                    className="grid size-11 place-items-center rounded-full border border-primary-foreground/25 outline-none transition-colors hover:border-gold hover:bg-gold hover:text-primary focus-visible:ring-4 focus-visible:ring-gold/40"
                  >
                    <Icon aria-hidden className="size-4" />
                  </motion.button>
                ))}
              </div>

              <div className="flex flex-1 items-center gap-4">
                <span className="flex font-mono text-sm tabular-nums" aria-live="off">
                  <span className="relative inline-block h-5 w-[2ch] overflow-hidden">
                    <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                      <motion.span
                        key={index}
                        custom={direction}
                        className="absolute inset-0"
                        variants={{
                          enter: (dir: number) => ({ y: dir * 20, opacity: 0 }),
                          center: { y: 0, opacity: 1 },
                          exit: (dir: number) => ({ y: dir * -20, opacity: 0 }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={SPRING.snappy}
                      >
                        {pad(index + 1)}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span className="text-primary-foreground/50">&nbsp;/ {pad(total)}</span>
                </span>
                <span className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-primary-foreground/15">
                  <motion.span
                    className="absolute inset-0 origin-left rounded-full bg-gold"
                    style={{ scaleX: autoplay ? progress : (index + 1) / total }}
                  />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Member list (wide screens) */}
        {total > 1 && (
          <ul className="hidden border-l border-primary-foreground/10 p-6 lg:col-span-4 lg:flex lg:flex-col lg:justify-center lg:gap-1">
            {testimonials.map((item, i) => {
              const active = i === index;
              return (
                <li key={i}>
                  <button
                    type="button"
                    aria-label={`${testimonialsExtras.show} ${item.name}`}
                    aria-current={active ? "true" : undefined}
                    onClick={() => goTo(i)}
                    className="group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left outline-none focus-visible:ring-4 focus-visible:ring-gold/40"
                  >
                    {active && (
                      <motion.span
                        layoutId="testimonial-active"
                        transition={SPRING.layout}
                        className="absolute inset-0 -z-10 rounded-2xl bg-primary-foreground/10"
                      />
                    )}
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors duration-300",
                        active ? "bg-gold text-primary" : "bg-emerald-2 text-primary-foreground/80",
                      )}
                    >
                      {initials(item.name)}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block truncate text-sm font-semibold transition-colors duration-300",
                          active ? "text-primary-foreground" : "text-primary-foreground/60 group-hover:text-primary-foreground",
                        )}
                      >
                        {item.name}
                      </span>
                      <span className="block truncate text-xs text-primary-foreground/50">{item.role}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
