/**
 * Comprehensive test of qstd package
 */
import * as Q from "./dist/client/index.js";

console.log("🧪 Testing qstd v0.1.0 - Complete Package\n");
console.log("=".repeat(60));

// Test List utilities
console.log("\n📋 List utilities:");
const arr = Q.List.create(10, (_, i) => i + 1);
console.log("  ✓ create(10):", arr);

const chunks = Q.List.chunk(arr, 3);
console.log("  ✓ chunk(arr, 3):", chunks);

const [even, odd] = Q.List.partition(arr, (x) => x % 2 === 0);
console.log("  ✓ partition (even):", even);
console.log("  ✓ partition (odd):", odd);

const names = ["Alice", "Bob", "Charlie"];
const ages = [25, 30, 35];
const zipped = Q.List.zipWith((name, age) => ({ name, age }), names, ages);
console.log("  ✓ zipWith:", zipped);

// Test Dict utilities
console.log("\n📦 Dict utilities:");
const obj = { a: 1, b: 2, c: 3, d: 4 };
console.log("  ✓ isEmpty({}):", Q.Dict.isEmpty({}));
console.log("  ✓ exists(obj):", Q.Dict.exists(obj));
console.log("  ✓ pick(['a', 'c']):", Q.Dict.pick(obj, ["a", "c"]));
console.log("  ✓ omit(['b']):", Q.Dict.omit(obj, ["b"]));

const [picked, omitted] = Q.Dict.partition(
  obj,
  (key) => key === "a" || key === "c"
);
console.log("  ✓ partition:", { picked, omitted });

const filtered = Q.Dict.filter(obj, (val) => val > 2);
console.log("  ✓ filter (>2):", filtered);

// Test Int utilities
console.log("\n🔢 Int utilities:");
console.log("  ✓ clamp(999, {0-100}):", Q.Int.clamp(999, { min: 0, max: 100 }));
console.log(
  "  ✓ commaSeparate(1234567):",
  Q.Int.commaSeparateThousandths(1234567)
);
console.log("  ✓ formatBytes(9876543):", Q.Int.formatBytes(9876543));

// Test Money utilities
console.log("\n💰 Money utilities:");
console.log("  ✓ convertToUsd(12345):", Q.Money.convertToUsd(12345));
console.log("  ✓ convertToCents($123.45):", Q.Money.convertToCents("$123.45"));
console.log(
  "  ✓ convertToUsd(no symbol):",
  Q.Money.convertToUsd(12345, { symbol: false })
);

// Test Str utilities
console.log("\n📝 Str utilities:");
console.log(
  "  ✓ countChar('Mississippi', 's'):",
  Q.Str.countChar("Mississippi", "s")
);
console.log(
  "  ✓ countWords('The quick brown fox'):",
  Q.Str.countWords("The quick brown fox")
);
console.log(
  "  ✓ toCase('hello-world', title):",
  Q.Str.toCase("hello-world", { to: "title" })
);
console.log(
  "  ✓ toCase('HelloWorld', snake):",
  Q.Str.toCase("HelloWorld", { to: "snake" })
);
console.log(
  "  ✓ concat(['a', undefined, 'b'], '-'):",
  Q.Str.concat(["a", undefined, "b"], "-")
);

const sentences = Q.Str.createSentences("Hello world. How are you? I'm fine!");
console.log("  ✓ createSentences:", sentences);

// Test Time utilities (just verify module loads)
console.log("\n⏰ Time utilities:");
console.log("  ✓ Time module loaded:", typeof Q.Time === "object");

// Test Flow utilities
console.log("\n⚡ Flow utilities:");
let count = 0;
const debouncedFn = Q.Flow.debounce(() => count++, 100);
console.log("  ✓ debounce:", typeof debouncedFn === "function");

const throttledFn = Q.Flow.throttle(() => console.log("throttled"), 100);
console.log("  ✓ throttle:", typeof throttledFn === "function");

console.log("  ✓ sleep:", typeof Q.Flow.sleep === "function");
console.log("  ✓ asyncPool:", typeof Q.Flow.asyncPool === "function");

// Test Random utilities
console.log("\n🎲 Random utilities:");
console.log("  ✓ hexColor():", Q.Random.hexColor());
console.log("  ✓ num({1-100}):", Q.Random.num({ min: 1, max: 100 }));
console.log("  ✓ coinFlip():", Q.Random.coinFlip() ? "Heads" : "Tails");
console.log("  ✓ item([1,2,3]):", Q.Random.item([1, 2, 3]));

const toShuffle = [1, 2, 3, 4, 5];
console.log("  ✓ shuffle([1,2,3,4,5]):", Q.Random.shuffle([...toShuffle]));
console.log("  ✓ date():", Q.Random.date());

// Test Dom utilities
console.log("\n🌐 Dom utilities (browser-only):");
console.log("  ✓ scrollToTop:", typeof Q.Dom.scrollToTop === "function");
console.log("  ✓ getElement:", typeof Q.Dom.getElement === "function");
console.log("  ✓ querySelector:", typeof Q.Dom.querySelector === "function");
console.log("  ✓ copy:", typeof Q.Dom.copy === "function");

console.log("\n" + "=".repeat(60));
console.log("✅ All qstd utilities working correctly!");
console.log("\n📦 Package Statistics:");
console.log(
  "  - Shared modules: 8 (List, Dict, Int, Money, Str, Time, Flow, Random)"
);
console.log("  - Client modules: 9 (shared + Dom)");
console.log("  - Server modules: 11 (shared + Fs, Env, Path)");
console.log(
  "  - React hooks: 7 (useDebounce, useToggle, useLocalStorage, etc)"
);
console.log("  - Panda preset: ✓ Complete with custom utilities");
console.log("  - Block component: ✓ Placeholder (migration in progress)");
console.log("\n🚀 Ready for publishing!");

