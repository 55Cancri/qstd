#!/bin/bash

LOG=$(find "$HOME/Library/Application Support/Cursor/logs" -type f -name tsserver.log \
  -path '*/tsserver-semantic-log-*/*' -exec stat -f '%m %N' {} + 2>/dev/null | sort -nr | head -1 | sed -E 's/^[0-9]+ //')

if [ -z "$LOG" ]; then
  echo "❌ No TSServer semantic log found."
  echo "Make sure 'typescript.tsserver.log' is set to 'verbose' in settings."
  exit 1
fi

echo "=== TypeScript Language Service Performance ==="
echo "Log: $LOG"
echo ""

echo "completionInfo (IntelliSense):"
awk '/completionInfo: elapsed time/ {print $0}' "$LOG" | sed -E 's/.*milliseconds\) ([0-9\.]+).*/\1/' \
  | awk '{sum+=$1; c++; if($1>m) m=$1} END {if (c) printf("  count=%d avg=%.1fms max=%.1fms\n", c, sum/c, m); else print "  No data"}'

echo ""
echo "quickinfo (hover):"
awk '/quickinfo: elapsed time/ {print $0}' "$LOG" | sed -E 's/.*milliseconds\) ([0-9\.]+).*/\1/' \
  | awk '{sum+=$1; c++; if($1>m) m=$1} END {if (c) printf("  count=%d avg=%.1fms max=%.1fms\n", c, sum/c, m); else print "  No data"}'

echo ""
echo "documentHighlights:"
awk '/documentHighlights: elapsed time/ {print $0}' "$LOG" | sed -E 's/.*milliseconds\) ([0-9\.]+).*/\1/' \
  | awk '{sum+=$1; c++; if($1>m) m=$1} END {if (c) printf("  count=%d avg=%.1fms max=%.1fms\n", c, sum/c, m); else print "  No data"}'

echo ""
echo "Recent completionInfo timings (ms):"
RECENT=$(awk '/completionInfo: elapsed time/ {print $0}' "$LOG" | sed -E 's/.*milliseconds\) ([0-9\.]+).*/\1/' | tail -10)
if [ -z "$RECENT" ]; then
  echo "  No data"
else
  echo "$RECENT"
fi

echo ""
echo "Semantic work samples:"
SEMANTIC=$(grep -E 'getCompletionData: Semantic work:' "$LOG" | tail -5)
if [ -z "$SEMANTIC" ]; then
  echo "  No data"
else
  echo "$SEMANTIC"
fi

echo ""
echo "=== Performance Assessment ==="
# Calculate status based on averages
COMP_AVG=$(awk '/completionInfo: elapsed time/ {print $0}' "$LOG" | sed -E 's/.*milliseconds\) ([0-9\.]+).*/\1/' \
  | awk '{sum+=$1; c++} END {if (c) printf("%.1f", sum/c); else print "0"}')

if [ "$(echo "$COMP_AVG < 200" | bc -l 2>/dev/null || echo 0)" = "1" ]; then
  echo "✅ Good: completionInfo avg < 200ms"
elif [ "$(echo "$COMP_AVG < 500" | bc -l 2>/dev/null || echo 0)" = "1" ]; then
  echo "⚠️  Acceptable: completionInfo avg < 500ms"
elif [ "$COMP_AVG" != "0" ]; then
  echo "❌ Poor: completionInfo avg >= 500ms (consider optimization)"
else
  echo "ℹ️  No completionInfo data available"
fi
