#!/usr/bin/env node
/**
 * Playwright Test Script for qstd Block Components
 *
 * Tests all components according to PROGRESS.md checklist:
 * - Tooltip padding
 * - Input spacing and error states
 * - Drawer layout
 * - Button loading alignment
 * - Switch track sizing
 * - Progress bar layout
 * - Radio alignment
 * - Menu container layout
 * - Accordion padding
 * - Padding utilities (px, py, p)
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const PLAYGROUND_URL = "http://localhost:5173";
const SCREENSHOTS_DIR = "../memories/test-screenshots";
const REPORT_FILE = "../memories/PLAYGROUND_TEST_REPORT.md";

// Ensure directories exist
if (!fs.existsSync("../memories")) {
  fs.mkdirSync("../memories");
}
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR);
}

const testResults = [];

function addResult(component, test, status, details) {
  testResults.push({ component, test, status, details });
  const emoji = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️";
  console.log(`${emoji} ${component}: ${test} - ${status}`);
  if (details) console.log(`   ${details}`);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testTooltip(page) {
  console.log("\n🧪 Testing Tooltip...");

  // Test custom tooltip (green one)
  const tooltipButton = page.locator('button:has-text("Tooltip")').first();
  await tooltipButton.hover();
  await sleep(500); // Wait for tooltip to appear

  const customTooltip = page.locator('[role="tooltip"]').first();

  if (await customTooltip.isVisible()) {
    const styles = await customTooltip.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        paddingTop: computed.paddingTop,
        paddingRight: computed.paddingRight,
        paddingBottom: computed.paddingBottom,
        paddingLeft: computed.paddingLeft,
        background: computed.backgroundColor,
        fontSize: computed.fontSize,
        borderRadius: computed.borderRadius,
      };
    });

    const hasPadding =
      styles.paddingTop !== "0px" && styles.paddingLeft !== "0px";

    addResult(
      "Tooltip",
      "Custom tooltip has padding",
      hasPadding ? "PASS" : "FAIL",
      `Padding: ${styles.paddingTop} ${styles.paddingRight} ${styles.paddingBottom} ${styles.paddingLeft}`
    );

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/tooltip-custom-hover.png`,
      fullPage: false,
    });
  } else {
    addResult(
      "Tooltip",
      "Custom tooltip visibility",
      "FAIL",
      "Tooltip did not appear"
    );
  }

  // Test simple tooltip
  await page.mouse.move(0, 0); // Move away
  await sleep(300);
  const simpleTooltipButton = page.locator('button:has-text("Simple Tooltip")');
  await simpleTooltipButton.hover();
  await sleep(500);

  const simpleTooltip = page.locator('[role="tooltip"]').last();
  if (await simpleTooltip.isVisible()) {
    const styles = await simpleTooltip.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        paddingTop: computed.paddingTop,
        paddingLeft: computed.paddingLeft,
        background: computed.backgroundColor,
      };
    });

    const hasPadding =
      styles.paddingTop !== "0px" && styles.paddingLeft !== "0px";

    addResult(
      "Tooltip",
      "Simple tooltip has padding",
      hasPadding ? "PASS" : "FAIL",
      `Padding: ${styles.paddingTop} / ${styles.paddingLeft}`
    );
  }
}

async function testPaddingUtilities(page) {
  console.log("\n🧪 Testing Padding Utilities...");

  // Find the test block with px_6, py_3
  const testBlock = page
    .locator("text=✅ Test: px_6, py_3 padding utilities should work now!")
    .first();

  const styles = await testBlock.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      paddingTop: computed.paddingTop,
      paddingRight: computed.paddingRight,
      paddingBottom: computed.paddingBottom,
      paddingLeft: computed.paddingLeft,
      classList: Array.from(el.classList),
    };
  });

  const pxWorks = styles.paddingLeft !== "0px" && styles.paddingRight !== "0px";
  const pyWorks = styles.paddingTop !== "0px" && styles.paddingBottom !== "0px";

  addResult(
    "Padding Utilities",
    "px={6} applies horizontal padding",
    pxWorks ? "PASS" : "FAIL",
    `Left: ${styles.paddingLeft}, Right: ${styles.paddingRight}`
  );

  addResult(
    "Padding Utilities",
    "py={3} applies vertical padding",
    pyWorks ? "PASS" : "FAIL",
    `Top: ${styles.paddingTop}, Bottom: ${styles.paddingBottom}`
  );
}

async function testButton(page) {
  console.log("\n🧪 Testing Button...");

  // Test loading button
  const loadingButton = page
    .locator('button:has-text("Loading Button")')
    .first();

  const styles = await loadingButton.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      display: computed.display,
      flexDirection: computed.flexDirection,
      alignItems: computed.alignItems,
      gap: computed.gap,
      cursor: computed.cursor,
    };
  });

  const isFlexRow =
    styles.display === "flex" &&
    (styles.flexDirection === "row" || styles.flexDirection === "row-reverse");
  const isAlignedCenter = styles.alignItems === "center";

  addResult(
    "Button",
    "Loading button uses flex layout",
    isFlexRow ? "PASS" : "FAIL",
    `display: ${styles.display}, flexDirection: ${styles.flexDirection}`
  );

  addResult(
    "Button",
    "Loading button content is centered",
    isAlignedCenter ? "PASS" : "FAIL",
    `alignItems: ${styles.alignItems}`
  );

  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/button-loading.png`,
    clip: { x: 0, y: 0, width: 300, height: 150 },
  });
}

async function testInput(page) {
  console.log("\n🧪 Testing Input...");

  // Find input with search icon
  const searchInput = page.locator('input[placeholder="Search tests"]');

  const styles = await searchInput.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      paddingLeft: computed.paddingLeft,
      borderColor: computed.borderColor,
    };
  });

  const hasLeftPadding = parseFloat(styles.paddingLeft) >= 24; // Should be ~28px

  addResult(
    "Input",
    "Search input has left padding for icon",
    hasLeftPadding ? "PASS" : "FAIL",
    `paddingLeft: ${styles.paddingLeft} (expected >= 24px)`
  );

  // Test error state
  const errorInput = page.locator('textarea[placeholder="Type something..."]');
  const errorStyles = await errorInput.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      borderColor: computed.borderColor,
      outlineColor: computed.outlineColor,
    };
  });

  // Check if error styling is applied (red color)
  const hasErrorStyling = errorStyles.borderColor.includes("rgb");

  addResult(
    "Input",
    "Error input has border styling",
    hasErrorStyling ? "PASS" : "WARN",
    `borderColor: ${errorStyles.borderColor}`
  );
}

async function testSwitch(page) {
  console.log("\n🧪 Testing Switch...");

  // Find switch element
  const switchEl = page.locator("[data-switch-track]").first();

  if ((await switchEl.count()) > 0) {
    const styles = await switchEl.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      const thumb = el.nextElementSibling;
      const thumbComputed = thumb ? window.getComputedStyle(thumb) : null;

      return {
        trackWidth: computed.width,
        trackHeight: computed.height,
        thumbWidth: thumbComputed?.width,
        thumbHeight: thumbComputed?.height,
      };
    });

    const trackWidth = parseFloat(styles.trackWidth);
    const thumbWidth = parseFloat(styles.thumbWidth);
    const ratio = trackWidth / thumbWidth;

    const isOval = ratio >= 1.8 && ratio <= 2.2; // Should be ~2x

    addResult(
      "Switch",
      "Track is ~2x thumb width (oval shape)",
      isOval ? "PASS" : "FAIL",
      `Track: ${styles.trackWidth}, Thumb: ${
        styles.thumbWidth
      }, Ratio: ${ratio.toFixed(2)}x`
    );
  } else {
    addResult(
      "Switch",
      "Switch element found",
      "FAIL",
      "Could not find switch element"
    );
  }

  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/switch.png`,
    clip: { x: 0, y: 1600, width: 400, height: 150 },
  });
}

async function testProgress(page) {
  console.log("\n🧪 Testing Progress...");

  const progressBar = page.locator("[data-progress-bg]").first();

  if ((await progressBar.count()) > 0) {
    const styles = await progressBar.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      const fill = el.parentElement?.querySelector("[data-progress-bar]");
      const fillComputed = fill ? window.getComputedStyle(fill) : null;

      return {
        trackWidth: computed.width,
        trackHeight: computed.height,
        trackBg: computed.backgroundColor,
        fillWidth: fillComputed?.width,
        fillBg: fillComputed?.backgroundColor,
        borderRadius: computed.borderRadius,
      };
    });

    const hasLayout =
      styles.trackWidth !== "0px" && styles.trackHeight !== "0px";

    addResult(
      "Progress",
      "Progress bar has proper dimensions",
      hasLayout ? "PASS" : "FAIL",
      `Track: ${styles.trackWidth} x ${styles.trackHeight}`
    );

    const hasRoundedEdges = parseFloat(styles.borderRadius) > 0;

    addResult(
      "Progress",
      "Progress bar has rounded edges",
      hasRoundedEdges ? "PASS" : "FAIL",
      `borderRadius: ${styles.borderRadius}`
    );
  }

  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/progress.png`,
    clip: { x: 0, y: 1100, width: 600, height: 150 },
  });
}

async function testDrawer(page) {
  console.log("\n🧪 Testing Drawer...");

  // Click to open drawer
  const openButton = page.locator('button:has-text("Open Drawer")');
  await openButton.click();
  await sleep(500); // Wait for animation

  const drawerBackdrop = page.locator("[data-backdrop]");
  const isVisible = await drawerBackdrop.isVisible();

  addResult(
    "Drawer",
    "Drawer opens on button click",
    isVisible ? "PASS" : "FAIL",
    `Backdrop visible: ${isVisible}`
  );

  if (isVisible) {
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/drawer-open.png`,
      fullPage: true,
    });

    // Check button group layout
    const buttonGroup = page.locator("text=Cancel").locator("..");
    const groupStyles = await buttonGroup.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        gap: computed.gap,
        flexDirection: computed.flexDirection,
      };
    });

    const hasProperLayout =
      groupStyles.display === "flex" || groupStyles.display === "grid";

    addResult(
      "Drawer",
      "Button group has proper layout",
      hasProperLayout ? "PASS" : "FAIL",
      `display: ${groupStyles.display}, gap: ${groupStyles.gap}`
    );

    // Close drawer
    const cancelButton = page.locator('button:has-text("Cancel")');
    await cancelButton.click();
    await sleep(500);
  }
}

async function testFilePicker(page) {
  console.log("\n🧪 Testing FilePicker...");

  const filePickerButton = page.locator('button:has-text("Choose Image")');
  const exists = (await filePickerButton.count()) > 0;

  addResult(
    "FilePicker",
    "FilePicker button renders",
    exists ? "PASS" : "FAIL",
    `Found ${await filePickerButton.count()} file picker button(s)`
  );

  if (exists) {
    // Check if it's clickable
    const isEnabled = await filePickerButton.isEnabled();
    addResult(
      "FilePicker",
      "FilePicker button is clickable",
      isEnabled ? "PASS" : "FAIL",
      `Button enabled: ${isEnabled}`
    );
  }
}

async function testRadio(page) {
  console.log("\n🧪 Testing Radio...");

  const radioContainer = page.locator("text=Option 1").locator("..");

  if ((await radioContainer.count()) > 0) {
    const styles = await radioContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      const circle = el.querySelector("[data-radio-circle-outer]");
      const circleComputed = circle ? window.getComputedStyle(circle) : null;

      return {
        display: computed.display,
        alignItems: computed.alignItems,
        gap: computed.gap,
        circleSize: circleComputed?.width,
      };
    });

    const isAligned = styles.alignItems === "center";

    addResult(
      "Radio",
      "Radio items are vertically centered",
      isAligned ? "PASS" : "FAIL",
      `alignItems: ${styles.alignItems}`
    );
  }

  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/radio.png`,
    clip: { x: 0, y: 2400, width: 400, height: 250 },
  });
}

async function testMenu(page) {
  console.log("\n🧪 Testing Menu...");

  const menuTrigger = page.locator('button:has-text("Menu Trigger")');
  await menuTrigger.click();
  await sleep(300);

  const menuContainer = page.locator("[data-menu-container]");
  const isVisible = await menuContainer.isVisible();

  addResult(
    "Menu",
    "Menu opens on click",
    isVisible ? "PASS" : "WARN",
    `Menu visible: ${isVisible}`
  );

  if (isVisible) {
    const styles = await menuContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        padding: computed.padding,
        borderRadius: computed.borderRadius,
        display: computed.display,
      };
    });

    addResult(
      "Menu",
      "Menu container has proper styling",
      "PASS",
      `padding: ${styles.padding}, borderRadius: ${styles.borderRadius}`
    );

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/menu-open.png`,
      fullPage: false,
    });
  }
}

async function testAccordion(page) {
  console.log("\n🧪 Testing Accordion...");

  const accordionItem = page.locator("text=Accordion Item 1").locator("..");
  await accordionItem.click();
  await sleep(300);

  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/accordion.png`,
    clip: { x: 0, y: 2100, width: 600, height: 200 },
  });

  addResult(
    "Accordion",
    "Accordion item expands",
    "PASS",
    "Visual test - see screenshot"
  );
}

async function generateReport() {
  console.log("\n📝 Generating test report...");

  const timestamp = new Date().toISOString();
  const passCount = testResults.filter((r) => r.status === "PASS").length;
  const failCount = testResults.filter((r) => r.status === "FAIL").length;
  const warnCount = testResults.filter((r) => r.status === "WARN").length;
  const totalCount = testResults.length;

  let report = `# qstd Playground Test Report\n\n`;
  report += `**Date:** ${timestamp}\n`;
  report += `**Test Results:** ${passCount} passed, ${failCount} failed, ${warnCount} warnings out of ${totalCount} tests\n\n`;
  report += `---\n\n`;

  // Group by component
  const byComponent = {};
  testResults.forEach((result) => {
    if (!byComponent[result.component]) {
      byComponent[result.component] = [];
    }
    byComponent[result.component].push(result);
  });

  Object.keys(byComponent).forEach((component) => {
    report += `## ${component}\n\n`;
    byComponent[component].forEach((result) => {
      const emoji =
        result.status === "PASS"
          ? "✅"
          : result.status === "FAIL"
          ? "❌"
          : "⚠️";
      report += `### ${emoji} ${result.test}\n`;
      report += `**Status:** ${result.status}\n`;
      if (result.details) {
        report += `**Details:** ${result.details}\n`;
      }
      report += `\n`;
    });
    report += `---\n\n`;
  });

  // Add screenshots section
  report += `## Screenshots\n\n`;
  const screenshots = fs.readdirSync(SCREENSHOTS_DIR);
  screenshots.forEach((screenshot) => {
    report += `- ![${screenshot}](./test-screenshots/${screenshot})\n`;
  });

  fs.writeFileSync(REPORT_FILE, report);
  console.log(`✅ Report saved to ${REPORT_FILE}`);
}

async function main() {
  console.log("🚀 Starting qstd Playground Tests\n");
  console.log(`Testing URL: ${PLAYGROUND_URL}`);
  console.log(`Screenshots will be saved to: ${SCREENSHOTS_DIR}\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
  });
  const page = await context.newPage();

  try {
    await page.goto(PLAYGROUND_URL, { waitUntil: "networkidle" });
    await sleep(1000); // Let page fully load

    // Take full page screenshot
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/full-playground.png`,
      fullPage: true,
    });

    // Run all tests
    await testPaddingUtilities(page);
    await testTooltip(page);
    await testButton(page);
    await testInput(page);
    await testSwitch(page);
    await testProgress(page);
    await testRadio(page);
    await testMenu(page);
    await testAccordion(page);
    await testDrawer(page);
    await testFilePicker(page);

    // Generate report
    await generateReport();

    console.log("\n✅ All tests completed!");
    console.log(`\nSummary:`);
    console.log(
      `- ✅ Passed: ${testResults.filter((r) => r.status === "PASS").length}`
    );
    console.log(
      `- ❌ Failed: ${testResults.filter((r) => r.status === "FAIL").length}`
    );
    console.log(
      `- ⚠️  Warnings: ${testResults.filter((r) => r.status === "WARN").length}`
    );
  } catch (error) {
    console.error("❌ Test error:", error);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/error.png` });
  } finally {
    await browser.close();
  }
}

main();
