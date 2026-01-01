// TypeScript test file to verify Block component type behavior
// This file demonstrates the complete API working correctly

import * as React from "react";
import Block from ".";
import { useMotionValue, useTransform } from "framer-motion";

// Test all requested is variants with proper typing
const TestAllVariants = () => {
  const y = useMotionValue(0);
  const height = useTransform(y, (v) => v + 100);
  const radius = useTransform(y, (v) => v);

  return (
    <div>
      {/* Base usage without is */}
      <Block grid cursor="pointer">
        Base Block
      </Block>

      <Block
        drag="y"
        dragConstraints={{ top: 0, bottom: 100 }}
        style={{
          borderTopLeftRadius: radius,
          borderTopRightRadius: radius,
          height,
          y,
        }}
      >
        MotionValue style props
      </Block>

      {/* All requested is variants */}
      <Block is="txt" as="h1">
        Text as h1
      </Block>
      <Block is="txt" as="p">
        Text as p (default)
      </Block>
      <Block is="txt">Text default</Block>

      <Block is="btn" onClick={() => {}}>
        Button
      </Block>
      <Block is="btn" isLoading>
        Loading Button
      </Block>

      <Block is="input" placeholder="Enter text" />
      <Block is="textarea" rows={4} />
      <Block is="checkbox" checked onChecked={(_v: boolean) => {}} />
      <Block is="progress" value={50} max={100} />
      <Block is="switch" checked onChange={(_v: boolean) => {}} />
      <Block is="drawer" open onClose={() => {}} />
      <Block is="radio" name="test" value="option1" />
      <Block
        is="menu"
        isOpen
        variant="click"
        onOpenOrClose={(_v: boolean) => {}}
      />
      <Block is="link" href="/test">
        Link
      </Block>
      <Block is="img" src="/test.jpg" alt="Test image" />
      <Block is="select">
        <option>Test</option>
      </Block>
      <Block is="blockquote">Quoted text</Block>
      <Block is="pre">Preformatted text</Block>

      {/* Motion props test with proper typing */}
      <Block
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        _motion={{ duration: 0.5 }}
      >
        Motion Block
      </Block>
      <Block
        is="btn"
        layout="position"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        _motion={{ type: "spring", stiffness: 300 }}
        onClick={() => {}}
      >
        Animated Button
      </Block>
      <Block
        is="txt"
        as="h1"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }}
      >
        Animated Heading
      </Block>

      {/* Form variants with as constraints */}
      <Block is="form" onSubmit={() => {}}>
        Form
      </Block>
      <Block is="form" as="label">
        Label
      </Block>
      <Block is="form" as="legend">
        Legend
      </Block>

      {/* Table variants with as constraints */}
      <Block is="table">Table</Block>
      <Block is="table" as="tr">
        Table Row
      </Block>
      <Block is="table" as="td">
        Table Cell
      </Block>
      <Block is="table" as="th">
        Table Header
      </Block>

      {/* List variants with required as */}
      <Block is="list" as="ul">
        Unordered List
      </Block>
      <Block is="list" as="ol">
        Ordered List
      </Block>
      <Block is="list" as="li">
        List Item
      </Block>

      {/* SEO variants with required as */}
      <Block is="seo" as="nav">
        Navigation
      </Block>
      <Block is="seo" as="main">
        Main Content
      </Block>
      <Block is="seo" as="aside">
        Sidebar
      </Block>
      <Block is="seo" as="article">
        Article
      </Block>
      <Block is="seo" as="section">
        Section
      </Block>
      <Block is="seo" as="details">
        Details
      </Block>
      <Block is="seo" as="header">
        Header
      </Block>
      <Block is="seo" as="footer">
        Footer
      </Block>
    </div>
  );
};

// Additional test examples
const TestErrorCases = () => {
  // These should show TypeScript errors when uncommented:
  // return <Block is="list">Missing required as prop</Block>; // ❌ Error
  // return <Block is="seo">Missing required as prop</Block>; // ❌ Error
  // return <Block is="form" as="div">Invalid as value</Block>; // ❌ Error
  return null;
};

export { TestAllVariants, TestErrorCases };
