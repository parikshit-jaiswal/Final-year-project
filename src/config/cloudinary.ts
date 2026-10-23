import { v2 as cloudinary } from "cloudinary";

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be configured`);
  }
  return value;
}

let configured = false;

function configureCloudinary() {
  if (configured) return;
  cloudinary.config({
    cloud_name: requiredEnvironment("CLOUDINARY_CLOUD_NAME"),
    api_key: requiredEnvironment("CLOUDINARY_API_KEY"),
    api_secret: requiredEnvironment("CLOUDINARY_API_SECRET"),
  });
  configured = true;
}

export function uploadConditionPhoto(buffer: Buffer, originalName: string) {
  configureCloudinary();
  return new Promise<{ secureUrl: string; publicId: string }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: "caretrail/provider-conditions",
        resource_type: "image",
        public_id: originalName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-"),
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      },
    );
    upload.end(buffer);
  });
}
