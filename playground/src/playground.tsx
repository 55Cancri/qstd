import React from "react";
import Block from "qstd/react";
import type { RadioOption } from "qstd/react";

// Updated drawer components: BtnGroup and CloseBtn
export default function Playground() {
  // Local state carried over from Chatbox examples
  const [isChecked, setIsChecked] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isOn, setIsOn] = React.useState(false);
  const [txtarea, setTxtareaVal] = React.useState("");
  const [progress1, setProgress1] = React.useState(0);
  const [progress2, setProgress2] = React.useState(0);

  // Progress1: toggle between 0 and 100 at random intervals
  React.useEffect(() => {
    let isActive = true;
    let timeoutId: number | undefined;

    const randomDelayMs = () => 2000 + Math.floor(Math.random() * 3000);

    const scheduleNext = (nextValue: number) => {
      timeoutId = window.setTimeout(() => {
        if (!isActive) return;
        setProgress1(nextValue);
        scheduleNext(nextValue === 0 ? 100 : 0);
      }, randomDelayMs());
    };

    scheduleNext(100);
    return () => {
      isActive = false;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  // Progress2: smooth oscillation
  React.useEffect(() => {
    let isActive = true;
    let rafId: number | undefined;
    const halfCycleMs = 3000;
    const fullCycleMs = halfCycleMs * 2;
    const start = performance.now();

    const tick = (now: number) => {
      if (!isActive) return;
      const elapsed = (now - start) % fullCycleMs;
      const goingUp = elapsed < halfCycleMs;
      const t = goingUp
        ? elapsed / halfCycleMs
        : (elapsed - halfCycleMs) / halfCycleMs;
      const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
      const easedHalf = easeOutCubic(t);
      const value01 = goingUp ? easedHalf : 1 - easedHalf;
      const nextVal = Math.max(0, Math.min(100, value01 * 100));
      setProgress2(nextVal);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      isActive = false;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <Block grid p={6} rowG={48} maxW="1000px" mx="auto">
      <Block
        is="txt"
        as="h1"
        fontSize="2xl"
        fontWeight="bold"
        color="text-primary"
      >
        Block Component Examples
      </Block>

      {/* TEST: Verify px, py utilities work after config fix */}
      <Block px={6} py={3} bg="neutral.200" rounded={8}>
        ✅ Test: px_6, py_3 padding utilities should work now!
      </Block>

      {/* TEST: Native div with Panda props - will Panda extract these? */}
      <div className="px_6 py_3 bg_blue.500 rounded_8">
        🧪 Direct className test: px_6, py_3 on native div
      </div>

      {/* Basic and utility examples */}
      <Block grid rowG={3}>
        <Block is="txt" as="h2" fontSize="lg" fontWeight="semibold">
          Basics
        </Block>
        <Block flex="wrap" gap={2}>
          <Block is="btn">Default Button</Block>
          <Block
            is="btn"
            isLoading
            loadingIcon="oval"
            _loading={{
              _svg: { strokeColor: { base: "blue.500", _dark: "blue.300" } },
            }}
          >
            Loading Button
          </Block>
          <Block is="checkbox" checked={isChecked} onChecked={setIsChecked}>
            Checkbox {isChecked ? "(checked)" : "(unchecked)"}
          </Block>
          <Block is="hr" />
        </Block>
      </Block>

      {/* Tooltip */}
      <Block grid rowG={3}>
        <Block is="txt" as="h2" fontSize="lg" fontWeight="semibold">
          Tooltip
        </Block>
        <Block flex="wrap" gap={3}>
          <Block
            is="btn"
            tooltip={
              <Block.Tooltip.Container
                bg="green.900"
                color={{ base: "green.400", _dark: "green.400" }}
                px={6}
                py={3}
                rounded={32}
              >
                Hey!
              </Block.Tooltip.Container>
            }
          >
            Tooltip
          </Block>
          <Block is="btn" tooltip="Simple tooltip">
            Simple Tooltip
          </Block>
        </Block>
      </Block>

      {/* Progress */}
      <Block grid rowG={3}>
        <Block is="txt" as="h2" fontSize="lg" fontWeight="semibold">
          Progress
        </Block>
        <Block flex="wrap" gap={3}>
          <Block
            is="progress"
            value={progress1}
            max={100}
            w="200px"
            h={6}
            alignS
          />
          <Block
            is="progress"
            value={progress2}
            max={100}
            w="200px"
            h={6}
            alignS
          >
            <Block.Progress.TrackBg
              bg={{ base: "red.200", _dark: "neutral.700" }}
            />
            <Block.Progress.TrackFill
              animate={{ transition: { duration: 0 } }}
              bg={{
                base: "blue.500",
                _dark:
                  progress2 > 60
                    ? "green.400"
                    : progress2 > 30
                    ? "yellow.400"
                    : "red.400",
              }}
            />
          </Block>
        </Block>
      </Block>

      {/* Menu */}
      <Block grid rowG={3}>
        <Block is="txt" as="h2" fontSize="lg" fontWeight="semibold">
          Menu
        </Block>
        <Block
          is="menu"
          variant="click"
          trigger={<Block is="btn">Menu Trigger</Block>}
        >
          <Block.Menu.Container grid rows="/ 4" px={4} py={2} borderRadius="8">
            <Block is="txt" color="text-primary">
              Testing
            </Block>
            <Block is="txt" color="text-primary">
              Testing
            </Block>
            <Block is="txt" color="text-primary">
              123
            </Block>
          </Block.Menu.Container>
        </Block>
      </Block>

      {/* Switch */}
      <Block grid rowG={3}>
        <Block is="txt" as="h2" fontSize="lg" fontWeight="semibold">
          Switch
        </Block>
        <Block is="switch" checked={isOn} onChange={setIsOn}>
          <Block.Switch.Track
            bg={{
              base: isOn ? "blue.500!" : "neutral.300",
              _dark: isOn ? "blue.500!" : "neutral.700",
            }}
          />
          <Block.Switch.Thumb
            bg={{ base: "neutral.100", _dark: "neutral.900" }}
          />
        </Block>
      </Block>

      {/* Accordion */}
      <Block grid rowG={3}>
        <Block is="txt" as="h2" fontSize="lg" fontWeight="semibold">
          Accordion
        </Block>
        <Block is="accordion">
          <Block.Accordion.Item title="Accordion Item 1" cols="/ 10">
            Hello
          </Block.Accordion.Item>
          <Block.Accordion.Item
            title={
              <Block is="txt" color="text-primary">
                Accordion Item 2
              </Block>
            }
            cols="/ 10"
          >
            World!
          </Block.Accordion.Item>
        </Block>
      </Block>

      {/* Radio */}
      <Block grid rowG={3}>
        <Block is="txt" as="h2" fontSize="lg" fontWeight="semibold">
          Radio (Default)
        </Block>
        <Block
          is="radio"
          p={2}
          grid
          rows="/ 8"
          defaultValue="1"
          fontWeight="medium"
          fontSize="xs"
          options={[
            { label: "Option 1", value: "1" },
            { label: "Option 2", value: "2" },
            { label: "Option 3", value: "3", disabled: true },
          ]}
          onChange={(x) => console.log("radio-default change:", x)}
          _radioSelected={{ _radioCircleOuter: { borderColor: "blue.400" } }}
          _radioCircleOuter={{ size: 12 }}
          _radioCircleInner={{ size: 6 }}
        />
      </Block>

      <Block grid rowG={3}>
        <Block is="txt" as="h2" fontSize="lg" fontWeight="semibold">
          Radio (Custom Render)
        </Block>
        <Block
          is="radio"
          p={2}
          grid
          rows="/ 8"
          defaultValue="2"
          fontWeight="medium"
          fontSize="xs"
          outline="revert"
          options={[
            { label: "Custom 1", value: "1" },
            { label: "Custom 2", value: "2" },
            { label: "Custom 3 (disabled)", value: "3", disabled: true },
          ]}
          _radioCircleOuter={{
            size: 12,
            borderWidth: 1.5,
            borderColor: { base: "neutral.500", _dark: "neutral.400" },
          }}
          _radioCircleInner={{ size: 4 }}
          _radioSelected={{ _radioCircleOuter: { borderColor: "violet.400" } }}
          _radioDisabled={{
            _radioCircleOuter: {
              borderColor: { base: "neutral.400", _dark: "neutral.600" },
            },
          }}
          renderOption={(x: RadioOption) => (
            <Block.Radio.Item
              cols="/ 10"
              whiteSpace="nowrap"
              disabled={x.disabled}
              value={x.value}
            >
              {x.label}
            </Block.Radio.Item>
          )}
          onChange={(x: string) => console.log("radio-custom change:", x)}
        />
      </Block>

      {/* Inputs */}
      <Block grid rowG={3}>
        <Block is="txt" as="h2" fontSize="lg" fontWeight="semibold">
          Inputs
        </Block>
        <Block flex="wrap" gap={3}>
          <Block
            is="textarea"
            placeholder="Type something..."
            pl="28px"
            error="This is an error"
            minW={200}
            minRows={2}
            maxRows={8}
            transition=".2s height ease-out"
            value={txtarea}
            onChange={(e) => setTxtareaVal(e.target.value)}
          >
            <Block.Textarea.Label>Label</Block.Textarea.Label>
          </Block>

          <Block
            is="input"
            placeholder="Search tests"
            pl="28px"
            value={"hello"}
            onChange={() => {}}
          >
            <Block.Input.LeftIcon
              icon="search"
              left="8px"
              fontSize="xs"
              color="text-secondary"
            />
          </Block>
        </Block>
      </Block>

      {/* Skeletons */}
      <Block grid rowG={3}>
        <Block is="txt" as="h2" fontSize="lg" fontWeight="semibold">
          Skeletons
        </Block>
        <Block grid rows="/ 18" w>
          <Block flex cols="center / 24">
            <Block is="skeleton" as="circle" />
            <Block grid rows="/ 18" w>
              <Block is="skeleton" as="block" h={8} br={4} />
              <Block is="skeleton" as="block" h={8} br={4} />
            </Block>
          </Block>
          <Block is="skeleton" as="block" h={8} br={4} w="85%" />
        </Block>
      </Block>

      {/* Drawer */}
      <Block grid rowG={3}>
        <Block is="txt" as="h2" fontSize="lg" fontWeight="semibold">
          Drawer
        </Block>
        <Block flex="wrap" gap={3}>
          <Block is="btn" onClick={() => setIsDrawerOpen(true)}>
            Open Drawer
          </Block>
        </Block>
      </Block>

      <Block
        is="drawer"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <Block grid rowG={4} px={6} pb={6}>
          <Block is="txt" as="h2" fontSize="xl" fontWeight="bold">
            Drawer Title
          </Block>
          <Block is="txt">
            This is the drawer content. You can put any content here.
          </Block>
          <Block.Drawer.BtnGroup>
            <Block is="btn" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Block>
            <Block
              is="btn"
              bg="blue.500"
              color="white"
              px={4}
              py={1}
              br={32}
              onClick={() => setIsDrawerOpen(false)}
            >
              Confirm
            </Block>
          </Block.Drawer.BtnGroup>
          <Block.Drawer.CloseBtn onClick={() => setIsDrawerOpen(false)} />
        </Block>
      </Block>

      {/* FilePicker */}
      <Block grid rowG={3}>
        <Block is="txt" as="h2" fontSize="lg" fontWeight="semibold">
          FilePicker
        </Block>
        <Block flex="wrap" gap={3}>
          <Block
            is="btn"
            filepicker
            accept="image/*"
            onChange={(files) => {
              console.log("Selected files:", files);
              alert(`Selected ${files.length} file(s)`);
            }}
          >
            Choose Image
          </Block>
          <Block
            is="btn"
            filepicker
            multiple
            onChange={(files) => {
              console.log("Selected files:", files);
              alert(`Selected ${files.length} file(s)`);
            }}
          >
            Choose Multiple Files
          </Block>
        </Block>
      </Block>

      {/* Extras */}
      <Block grid rowG={3}>
        <Block is="txt" as="h2" fontSize="lg" fontWeight="semibold">
          Extras
        </Block>
        <Block flex="wrap" gap={3}>
          <Block
            icon="check-circle"
            color={{ base: "green.500", _dark: "green.400" }}
          />
          <Block
            is="blockquote"
            p={3}
            bg={{ base: "neutral.200", _dark: "neutral.700" }}
            br={6}
          >
            "Simplicity is the soul of efficiency."
          </Block>
          <Block
            is="pre"
            p={3}
            bg={{ base: "neutral.200", _dark: "neutral.700" }}
            br={6}
          >
            {`const greet = (name: string) => \`Hello, \${name}\`;`}
          </Block>
          <Block is="link" onClick={() => alert("Clicked link-like Block")}>
            Link-like Block
          </Block>
        </Block>
      </Block>
    </Block>
  );
}
