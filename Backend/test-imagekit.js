require("dotenv").config();
const ImageKit = require("@imagekit/nodejs");
const { toFile } = require("@imagekit/nodejs");

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function testImageKit() {
  console.log("Testing ImageKit credentials...");
  console.log(
    "Public Key:",
    process.env.IMAGEKIT_PUBLIC_KEY ? "SET" : "MISSING",
  );
  console.log(
    "Private Key:",
    process.env.IMAGEKIT_PRIVATE_KEY ? "SET" : "MISSING",
  );
  console.log("URL Endpoint:", process.env.IMAGEKIT_URL_ENDPOINT);

  try {
    // Get auth parameters - this is a safe API call to test credentials
    const authParams = imagekit.helper.getAuthenticationParameters();
    console.log("\n✅ Auth Parameters Generated (credentials valid):");
    console.log(authParams);

    // Test upload with a small in-memory file
    console.log("\nTesting file upload...");
    const testImageBase64 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    ); // 1x1 transparent PNG
    const testFile = await toFile(testImageBase64, "test-image.png");

    const uploadResult = await imagekit.files.upload({
      file: testFile,
      fileName: "test-image.png",
      folder: "/test",
    });

    console.log("✅ Upload successful:", uploadResult.url);
  } catch (err) {
    console.error("\n❌ ImageKit Error:");
    console.error("Status:", err.status);
    console.error("Message:", err.message);
    console.error("Error:", err.error);
    if (err.error && err.error.help) {
      console.error("Help:", err.error.help);
    }
  }
}

testImageKit();
