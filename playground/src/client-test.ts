import { Str } from "qstd/client";

const json1 = Str.parseJson("{}");

if (json1.ok) {
  const isRecordUnknown = json1.data;
}

const json2 = Str.parseJson<{ name: "John"; age: 30 }>("{}");

if (json2.ok) {
  const isTyped = json2.data;
}
